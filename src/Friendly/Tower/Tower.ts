import {
    AnimatedSpriteController,
    AnimationEnd,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Log, MathUtil,
    RectCollider,
    RenderRect,
    SpriteSheet,
    Timer
} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Ammunition} from "../../Common/Ammunition";
import {Layers} from "../../Layers";
import {BossRocketAttack} from "../../Enemy/Boss/BossRocketAttack";
import {Attack} from "../../Common/Attack";
import {TowerBeeAttack} from "./TowerBeeAttack";

// 64x64
// idle frame 0
// 1 - 38 - shot
import turretSpr from "../../Art/turret.png";
// 0 - 32 idle
// 33 - 40 drain
// 40 empty idle
import turretCanSpr from "../../Art/turret-canister.png";

// containers 17,19 21,17, 25,15, 29,13

const turretSheet = new SpriteSheet(turretSpr, 64, 64);
const turretCan = new SpriteSheet(turretCanSpr, 7, 9);

class Can extends Entity
{
    constructor(x: number, y: number, readonly flipped: boolean)
    {
        super("can", x, y);
    }

    rotate<T>(arr: T[], amt: number): T[]
    {
        const last = arr.splice(arr.length - amt, amt);
        arr.unshift(...last);
        return arr;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: this.rotate(turretCan.textureSliceFromRow(0, 0, 32), MathUtil.randomRange(0, 32)),
                config: {
                    xScale: this.flipped ? -1 : 1, xAnchor: this.flipped ? 1 : 0, xOffset: -32, yOffset: -32,
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 100
                }
            },
            {
                id: 1,
                textures: turretCan.textureSliceFromRow(0, 33, 40),
                config: {
                    xScale: this.flipped ? -1 : 1, xAnchor: this.flipped ? 1 : 0, xOffset: -32, yOffset: -32,
                    animationEndAction: AnimationEnd.STOP,
                    animationSpeed: 120
                }
            }
        ]));
    }
}

class CanisterArray extends Component
{
    constructor(readonly canisters: Can[], public current: number = 0)
    {
        super();
    }
}

export class Tower extends Entity
{
    constructor(name: string, x: number, y: number, readonly flipped: boolean)
    {
        super("tower_1", x, y, Layers.tower);
    }

    onAdded()
    {
        super.onAdded();

        const width = 10;
        const height = 25;
        const fireRateS = 5;
        const maxAmmo = 4;

        const spr = this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: turretSheet.textureSliceFromRow(0, 0, 0),
                config: {
                    animationEndAction: AnimationEnd.STOP, xScale: this.flipped ? -1 : 1,
                    xAnchor: 0.5, yAnchor: 0.5
                }
            },
            {
                id: 1,
                textures: turretSheet.textureSliceFromRow(0, 1, 38),
                config: {
                    animationEndAction: AnimationEnd.STOP, animationSpeed: 60, xScale: this.flipped ? -1 : 1,
                    xAnchor: 0.5, yAnchor: 0.5
                }
            }
        ]));

        let cans: CanisterArray;

        if (this.flipped)
        {
            cans = this.addComponent(new CanisterArray([
                this.addChild(new Can(28, 13, this.flipped)),
                this.addChild(new Can(32, 15, this.flipped)),
                this.addChild(new Can(36, 17, this.flipped)),
                this.addChild(new Can(40, 19, this.flipped))
            ]));
        }
        else
        {
            cans = this.addComponent(new CanisterArray([
                this.addChild(new Can(29, 13, this.flipped)),
                this.addChild(new Can(25, 15, this.flipped)),
                this.addChild(new Can(21, 17, this.flipped)),
                this.addChild(new Can(17, 19, this.flipped))
            ]));
        }

        const health = this.addComponent(new Health(100, 100));
        const ammunition = this.addComponent(new Ammunition(maxAmmo, maxAmmo));

        const attackTimer = this.addComponent(new Timer(fireRateS * 1000, null, true));
        attackTimer.onTrigger.register(caller => {
            spr.setAnimation(1, true);
            caller.getEntity().addComponent(new Timer(1 * 60, cans, false))
                  .onTrigger.register((caller1, data) => {
                data.canisters[data.current].getComponent<AnimatedSpriteController>(
                    AnimatedSpriteController)!.setAnimation(1);
                data.current = (data.current + 1) % 4;
            });
            caller.getEntity().addComponent(new Timer(29 * 60, null, false)).onTrigger.register(caller1 => {
                (caller1.getEntity() as Tower).fireShot(caller1, ammunition);
            });
            caller.getEntity().addComponent(new Timer(39 * 60, spr)).onTrigger.register((caller1, data) => {
                data.setAnimation(0);
            });
        });

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.tower,
                    height: height,
                    width: width
                })
        );

        collider.onTriggerEnter.register((c, d) => this.receiveDamage(c, d, health));
    }

    receiveDamage(caller: Collider, data: { other: Collider, result: unknown }, health: Health)
    {
        const other = data.other.getEntity();
        if (other instanceof BossRocketAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                if (health.isEmpty())
                {
                    // TODO Destroy the tower? Maybe a system listener instead since we need to replace with a
                    //  destroyed tower instead?
                }
            }
        }
    }

    fireShot(caller: Component, ammunition: Ammunition)
    {
        if (ammunition.getCurrentAmmo() <= 0)
        {
            return;
        }

        const x = caller.getEntity().transform.position.x;
        const y = caller.getEntity().transform.position.y;

        const target = caller.getScene().getEntityWithName("boss");
        if (!target)
        {
            Log.error("Tried to target the Boss for a Tower attack, but nothing could be found.");
            return;
        }

        if (this.flipped)
        {
            caller.getScene().addEntity(new TowerBeeAttack(x + 11 - 32, y + 12 - 32, Layers.towerAttack, target));
        }
        else
        {
            caller.getScene().addEntity(new TowerBeeAttack(x + 52 - 32, y + 12 - 32, Layers.towerAttack, target));
        }
        ammunition.removeAmmo(1);
    }
}


export class DestroyedTower extends Entity
{
    constructor(x: number, y: number)
    {
        super("destroyedTower", x, y);
    }

    onAdded()
    {
        super.onAdded();

        const width = 10;
        const height = 25;
        this.addComponent(new RenderRect(0, 0, width, height, 0xadadad, 0xadadad));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.tower,
                    height: height, width: width
                }));
    }

}

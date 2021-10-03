import {
    AnimatedSpriteController,
    AnimationEnd,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Log,
    MathUtil,
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
import {Player} from "../../Player/Player";

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
    constructor(x: number, y: number, readonly flipped: boolean)
    {
        super("tower", x, y, Layers.tower);
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
                textures: [turretSheet.textureFromIndex(0)],
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
                    xAnchor: 0.5, yAnchor: 0.5,
                    animationEndEvent: () => {
                        spr.setAnimation(0, true);
                    }
                },
                events: {
                    1: () => {
                        const can = cans.canisters[cans.current];
                        if (!can)
                        {
                            Log.error("Tried to drain a tower canister but none were remaining.");
                            return;
                        }
                        can.getComponent<AnimatedSpriteController>(AnimatedSpriteController)?.setAnimation(1);
                        cans.current = (cans.current + 1);
                    },
                    29: () => {
                        this.fireShot(cans, ammunition);
                    }
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
        attackTimer.onTrigger.register(_ => {
            if (ammunition.getCurrentAmmo() > 0)
            {
                spr.setAnimation(1, true);
            }
        });

        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {layer: Layers.tower, radius: 15}));

        collider.onTriggerEnter.register((c, d) => this.receiveAmmo(c, d, ammunition, cans));
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

    receiveAmmo(collider: Collider, data: { other: Collider, result: unknown }, ammunition: Ammunition,
                cans: CanisterArray)
    {
        const other = data.other.getEntity();
        if (other instanceof Player)
        {
            const playerAmmo = other.getComponent<Ammunition>(Ammunition);
            if (playerAmmo)
            {
                const ammoUsed = ammunition.addAmmo(playerAmmo.getCurrentAmmo());
                if (!ammoUsed)
                {
                    return;
                }

                playerAmmo.removeAmmo(ammoUsed);
                for (let i = 0; i < ammoUsed; i++)
                {
                    cans.current = (cans.current - 1);
                    const canAnimation = cans.canisters[cans.current]
                        .getComponent<AnimatedSpriteController>(AnimatedSpriteController);
                    if (canAnimation)
                    {
                        canAnimation.setAnimation(0);
                    }
                    else
                    {
                        Log.error("Tried to replenish the ammo cartridge but no animator was found");
                    }
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

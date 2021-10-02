import {
    AnimatedSpriteController,
    AnimationEnd,
    CollisionSystem,
    Entity,
    RectCollider,
    RenderRect,
    SpriteSheet
} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Ammunition} from "../../Common/Ammunition";
import {Layers} from "../../Layers";
import {BossRocketAttack} from "../../Enemy/Boss/BossRocketAttack";
import {Attack} from "../../Common/Attack";
import {HealthBar} from "../../Common/HealthBar";

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
    constructor(x: number, y: number)
    {
        super("can", x, y);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: [turretCan.texture(0, 0)]
            }
        ]));
    }
}

export class Tower extends Entity
{
    constructor(x: number, y: number)
    {
        super("tower", x, y, Layers.tower);
    }

    onAdded()
    {
        super.onAdded();

        const width = 10;
        const height = 25;

        this.addComponent(new AnimatedSpriteController(1, [
            {
                id: 0,
                textures: turretSheet.textureSliceFromRow(0, 0, 0),
                config: {animationEndAction: AnimationEnd.STOP}
            },
            {
                id: 1,
                textures: turretSheet.textureSliceFromRow(0, 1, 38),
                config: {animationEndAction: AnimationEnd.STOP, animationSpeed: 60}
            }
        ]));

        this.addChild(new Can(29, 13));
        this.addChild(new Can(25, 15));
        this.addChild(new Can(21, 17));
        this.addChild(new Can(17, 19));

        const health = this.addComponent(new Health(100, 100));
        this.addChild(new HealthBar("tower_health", 0, 0, Layers.tower, "Tower", 0, 30));
        this.addComponent(new Ammunition(100, 50));

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.tower,
                    height: height,
                    width: width
                })
        );

        collider.onTriggerEnter.register((caller, data) => {
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
        });
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

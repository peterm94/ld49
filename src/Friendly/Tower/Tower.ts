import {CollisionSystem, Entity, RectCollider, RenderRect} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Ammunition} from "../../Common/Ammunition";
import {Layers} from "../../Layers";
import {BossAttack} from "../../Enemy/Boss/BossAttack";
import {Attack} from "../../Common/Attack";
import {HealthBar} from "../../Common/HealthBar";

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

        this.addComponent(new RenderRect(0, 0, width, height, 0xffffff, 0xffffff));

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
            if (other instanceof BossAttack)
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

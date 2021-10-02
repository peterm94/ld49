import {CollisionSystem, Entity, RectCollider, RenderRect} from "lagom-engine";
import {Health} from "../../Common/Health";
import {HealthBar} from "../../Common/HealthBar";
import {Layers} from "../../Layers";
import {TowerAttack} from "../../Friendly/Tower/TowerAttack";
import {Attack} from "../../Common/Attack";

export class Boss extends Entity
{
    constructor(x: number, y: number)
    {
        super("Boss", x, y, 10);
    }

    onAdded()
    {
        super.onAdded();

        const width = 50;
        const height = 50;

        this.addComponent(new RenderRect(0, 0, width, height, 0x0700ff, 0xff0000));
        this.addComponent(new RenderRect(5, 5, 40, 40, 0x00ff00, 0xff0000));

        const health = this.addComponent(new Health(1000, 1000));
        this.addChild(new HealthBar("boss_health", 0, 0, 2, "Boss", 0, 55));

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.boss,
                    width: width, height: height
                }));

        collider.onTriggerEnter.register((caller, data) => {
            const other = data.other.getEntity();
            if (other instanceof TowerAttack)
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

import {Collider, CollisionSystem, Component, Entity, RectCollider, RenderRect, Timer, Util} from "lagom-engine";
import {Health} from "../../Common/Health";
import {HealthBar} from "../../Common/HealthBar";
import {Layers} from "../../Layers";
import {TowerAttack} from "../../Friendly/Tower/TowerAttack";
import {Attack} from "../../Common/Attack";
import {BossAttack} from "./BossAttack";

export class Boss extends Entity
{
    constructor(x: number, y: number)
    {
        super("boss", x, y, Layers.boss);
    }

    onAdded()
    {
        super.onAdded();

        const width = 50;
        const height = 50;

        this.addComponent(new RenderRect(0, 0, width, height, 0x0700ff, 0xff0000));
        this.addComponent(new RenderRect(5, 5, 40, 40, 0x00ff00, 0xff0000));

        const attackTimer = this.addComponent(new Timer(1000, null, true));
        attackTimer.onTrigger.register(this.instantiateAttack);

        const health = this.addComponent(new Health(1000, 1000));
        this.addChild(new HealthBar("boss_health", 0, 0, Layers.boss, "Boss", 0, 55));

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.boss,
                    width: width, height: height
                }));

        collider.onTriggerEnter.register((c, d) => this.getAttacked(c, d, health));
    }

    instantiateAttack(caller: Component)
    {
        const x = caller.getEntity().transform.position.x;
        const y = caller.getEntity().transform.position.y;

        const possibleTargets = caller.getScene().entities.filter((entity) => entity.name === "tower");
        let target: Entity | null;
        if (possibleTargets)
        {
            target = Util.choose(...possibleTargets);
        }
        else
        {
            target = caller.getScene().getEntityWithName("player");
        }

        if (target === null)
        {
            console.error("Tried to target something for a Boss attack, but nothing could be found.");
            return;
        }

        caller.getScene().addEntity(new BossAttack(x, y, Layers.bossAttack, target));
    }

    getAttacked(caller: Collider, data: { other: Collider; result: unknown }, health: Health)
    {
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
    }
}

import {Collider, CollisionSystem, Component, Entity, Log, RectCollider, RenderRect, Timer} from "lagom-engine";
import {Health} from "../../Common/Health";
import {HealthBar} from "../../Common/HealthBar";
import {Layers} from "../../Layers";
import {TowerBeeAttack} from "../../Friendly/Tower/TowerBeeAttack";
import {Attack} from "../../Common/Attack";
import {BossRocketAttack} from "./BossRocketAttack";

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

        const rocketAttackTimer = this.addComponent(new Timer(5 * 1000, null, true));
        rocketAttackTimer.onTrigger.register(this.instantiateRocketAttack);

        const health = this.addComponent(new Health(1000, 1000));

        // TODO Big health bar at the top of the screen instead?
        const healthBar = this.addChild(new HealthBar("boss_health", 0, 0, Layers.boss, 0, 0, 55));

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.boss,
                    width: width, height: height
                }));

        collider.onTriggerEnter.register((c, d) => this.getAttacked(c, d, health, healthBar));
    }

    instantiateRocketAttack(caller: Component)
    {
        const x = caller.getEntity().transform.position.x;
        const y = caller.getEntity().transform.position.y;

        const target = caller.getScene().getEntityWithName("player");
        if (!target)
        {
            Log.error("Tried to target the Player for a Boss attack, but nothing could be found.");
            return;
        }

        caller.getScene().addEntity(new BossRocketAttack(x, y, Layers.bossAttack, target));
    }

    getAttacked(caller: Collider, data: { other: Collider; result: unknown }, health: Health, healthBar: HealthBar)
    {
        const other = data.other.getEntity();
        if (other instanceof TowerBeeAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                healthBar.remainingHealthPercentage = health.getPercentageRemaining();
                if (health.isEmpty())
                {
                    // TODO Destroy the tower? Maybe a system listener instead since we need to replace with a
                    //  destroyed tower instead?
                }
            }
        }
    }
}

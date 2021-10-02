import {Collider, CollisionSystem, Component, Entity, Log, RectCollider, RenderRect, Timer} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Ammunition} from "../../Common/Ammunition";
import {Layers} from "../../Layers";
import {BossRocketAttack} from "../../Enemy/Boss/BossRocketAttack";
import {Attack} from "../../Common/Attack";
import {TowerBeeAttack} from "./TowerBeeAttack";

export class Tower extends Entity
{
    constructor(name: string, x: number, y: number)
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

        this.addComponent(new RenderRect(0, 0, width, height, 0xffffff, 0xffffff));

        const health = this.addComponent(new Health(100, 100));
        const ammunition = this.addComponent(new Ammunition(maxAmmo, maxAmmo));

        const attackTimer = this.addComponent(new Timer(fireRateS * 1000, null, true));
        attackTimer.onTrigger.register(caller => this.fireShot(caller, ammunition));

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

        caller.getScene().addEntity(new TowerBeeAttack(x, y, Layers.towerAttack, target));
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

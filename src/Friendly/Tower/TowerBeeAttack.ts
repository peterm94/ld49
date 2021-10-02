import {CollisionSystem, Entity, MathUtil, RectCollider, RenderRect, Timer} from "lagom-engine";
import {Attack} from "../../Common/Attack";
import {AttackMovement} from "../../Common/AttackMovement";
import {Layers} from "../../Layers";

export class TowerBeeAttack extends Entity
{
    constructor(x: number, y: number, z: number, private target: Entity)
    {
        super("towerBeeAttack", x, y, z);
    }

    onAdded()
    {
        super.onAdded();

        const damage = 1;
        const speed = 200;
        const lifeDurationSec = 10;

        this.addComponent(new RenderRect(0, 0, 5, 5, 0xffffff, 0xffffff));
        this.addComponent(new Attack(damage));
        this.addComponent(
            new AttackMovement(
                // TODO: This shouldn't be negative, bug?
                -MathUtil.pointDirection(this.transform.getGlobalPosition().x, this.transform.getGlobalPosition().y,
                    this.target.transform.getGlobalPosition().x, this.target.transform.getGlobalPosition().y),
                speed));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.towerAttack,
                    height: 5, width: 5
                }));

        // We shouldn't need this since it's attacking the boss, but just in case.
        const endOfLife = this.addComponent(new Timer(lifeDurationSec * 1000, null));

        endOfLife.onTrigger.register((caller) => {
            caller.getEntity().destroy();
        });
    }
}

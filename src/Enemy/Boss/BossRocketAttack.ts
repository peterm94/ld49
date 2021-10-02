import {CollisionSystem, Component, Entity, RectCollider, RenderRect, System, Timer, Vector} from "lagom-engine";
import {Attack} from "../../Common/Attack";
import {Layers} from "../../Layers";

export class BossRocketAttack extends Entity
{
    constructor(x: number, y: number, z: number, private target: Entity)
    {
        super("bossRocketAttack", x, y, z);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 5, 5, 0xffffff, 0xffffff));
        this.addComponent(new Attack(3));
        this.addComponent(new AttackMovement(this.target));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.bossAttack,
                    height: 5, width: 5
                }));

        const endOfLife = this.addComponent(new Timer(5 * 1000, null));

        endOfLife.onTrigger.register(() => {
            this.destroy();
        });
    }
}

class AttackMovement extends Component
{
    constructor(readonly target: Entity | undefined, readonly moveSpeed = 50)
    {
        super();
    }
}

export class ProjectileMover extends System
{
    constructor()
    {
        super();
    }

    update(delta: number)
    {
        this.runOnEntities((entity: Entity,
                            attackMovement: AttackMovement) => {
            const movement = entity.getComponent<AttackMovement>(AttackMovement);
            if (!movement || !movement.target)
            {
                return;
            }
            const entityPos = entity.transform.position;

            const targetPos = new Vector(movement.target.transform.position.x, movement.target.transform.position.y);
            const attackPos = new Vector(entityPos.x, entityPos.y);

            const movementVector = (targetPos.sub(attackPos)).normalize()
                                                             .multiply(attackMovement.moveSpeed * delta / 1000);

            entityPos.x += movementVector.x;
            entityPos.y += movementVector.y;
        });
    }

    types = () => [AttackMovement];
}

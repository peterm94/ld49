import {CollisionSystem, Component, Entity, MathUtil, RectCollider, RenderRect, System, Timer} from "lagom-engine";
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
        this.addComponent(new Attack(1));
        this.addComponent(
            new AttackMovement(
                // TODO: This shouldn't be negative, bug?
                -MathUtil.pointDirection(this.transform.getGlobalPosition().x, this.transform.getGlobalPosition().y,
                    this.target.transform.getGlobalPosition().x, this.target.transform.getGlobalPosition().y)));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.bossAttack,
                    height: 5, width: 5
                }));

        const endOfLife = this.addComponent(new Timer(3 * 1000, null));

        endOfLife.onTrigger.register((caller) => {
            caller.getEntity().destroy();
        });
    }
}

class AttackMovement extends Component
{
    constructor(readonly targetAngle: number, readonly moveSpeed = 100)
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
            if (movement == null)
            {
                return;
            }
            const movementVector = MathUtil.lengthDirXY(attackMovement.moveSpeed * delta / 1000, movement.targetAngle);

            entity.transform.position.x += movementVector.x;
            entity.transform.position.y += movementVector.y;
        });
    }

    types = () => [AttackMovement];
}

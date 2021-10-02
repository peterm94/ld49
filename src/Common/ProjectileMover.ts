import {Entity, MathUtil, System} from "lagom-engine";
import {AttackMovement} from "./AttackMovement";

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

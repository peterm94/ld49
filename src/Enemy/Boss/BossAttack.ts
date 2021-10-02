import {CollisionSystem, Entity, RectCollider, RenderRect} from "lagom-engine";
import {Attack} from "../../Common/Attack";
import {Layers} from "../../Layers";

export class BossAttack extends Entity
{
    constructor(x: number, y: number)
    {
        super("bossAttack", x, y);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new RenderRect(0, 0, 5, 5, 0xffffff, 0xffffff));
        this.addComponent(new Attack(20));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.bossAttack,
                    height: 5, width: 5
                }));
    }
}

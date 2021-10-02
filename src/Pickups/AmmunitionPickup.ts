import {CollisionSystem, Entity, RectCollider, RenderRect} from "lagom-engine";
import {Layers} from "../Layers";
import {PickupCount} from "./Pickup";

export class AmmunitionPickup extends Entity
{
    constructor(x: number, y: number)
    {
        super("ammunitionPickup", x, y, Layers.pickup);
    }

    onAdded(): void
    {
        super.onAdded();

        const rect = new RenderRect(0, 0, 10, 10, 0xffffff, 0xffffff);
        this.addComponent(rect);
        this.addComponent(new PickupCount(10));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    xOff: 0, yOff: 0, layer: Layers.pickup, rotation: 0,
                    height: 10, width: 10
                }));
    }
}

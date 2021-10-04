import {AnimatedSprite, AnimationEnd, CircleCollider, CollisionSystem, Entity, Timer} from "lagom-engine";
import {Layers} from "../Layers";
import {PickupCount} from "./PickupCount";

export class Pickup extends Entity
{
    constructor(name: string, x: number, y: number,
                readonly amount: number, readonly flashAtSec: number, readonly flashForSec: number,
                readonly sprite: any, readonly pickupRadius: number)
    {
        super(name, x, y, Layers.pickup);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new PickupCount(this.amount));

        // Sprite.
        const sprite = this.addComponent(
            new AnimatedSprite(this.sprite,
                {animationSpeed: 100, animationEndAction: AnimationEnd.LOOP, xAnchor: 0.5, yAnchor: 0.5}));

        // Pickup collider.
        this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {layer: Layers.pickup, radius: this.pickupRadius}));

        // Flash at the determined time.
        this.addComponent(new Timer(this.flashAtSec * 1000, null, false))
            .onTrigger.register((_) => {
            sprite.applyConfig({alpha: 0.6});
        });

        // Delete after flashing.
        this.addComponent(new Timer((this.flashAtSec + this.flashForSec) * 1000, null, false))
            .onTrigger.register((caller) => {
            caller.parent.destroy();
        });
    }
}

import {AnimatedSprite, AnimationEnd, CollisionSystem, Entity, RectCollider, SpriteSheet, Util} from "lagom-engine";
import {Layers} from "../Layers";
import {PickupCount} from "./Pickup";

import honeySprite1 from '../Art/honey1.png';
import honeySprite2 from '../Art/honey2.png';

const honey1 = new SpriteSheet(honeySprite1, 18, 16);
const honey2 = new SpriteSheet(honeySprite2, 18, 16);


export class AmmunitionPickup extends Entity
{
    constructor(x: number, y: number)
    {
        super("ammunitionPickup", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(Util.choose(honey1, honey2).textureSliceFromRow(0, 0, 7),
            {animationSpeed: 100, animationEndAction: AnimationEnd.LOOP}));
        this.addComponent(new PickupCount(10));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    xOff: 0, yOff: 0, layer: Layers.pickup, rotation: 0,
                    height: 10, width: 10
                }));
    }
}

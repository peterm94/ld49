import {AnimatedSprite, AnimationEnd, CollisionSystem, Entity, RectCollider, SpriteSheet, Timer, Util} from "lagom-engine";
import {Layers} from "../Layers";
import {PickupCount} from "./Pickup";

import honeySprite1 from '../Art/honey1.png';
import honeySprite2 from '../Art/honey2.png';
import honeySprite3 from '../Art/honey3.png';

const honey1 = new SpriteSheet(honeySprite1, 18, 16);
const honey2 = new SpriteSheet(honeySprite2, 18, 16);
const honey3 = new SpriteSheet(honeySprite3, 18, 16);


export class AmmunitionPickup extends Entity
{
    constructor(x: number, y: number)
    {
        super("ammunitionPickup", x, y, Layers.pickup);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AnimatedSprite(Util.choose(honey1, honey2, honey3).textureSliceFromRow(0, 0, 7),
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


export class AmmunitionSpawner extends Entity
{
    constructor()
    {
        super("ammunitionSpawner",  0, 0);
    }

    onAdded(): void
    {
        super.onAdded();
        const ammoSpawnFrequencySeconds = 10;

        const timer =  new Timer(ammoSpawnFrequencySeconds * 1000, null, true);
        timer.onTrigger.register((caller) => {
            const scene = caller.getScene();
            const worldgen = scene.getEntityWithName("worldgen");
            if (!worldgen)
            {
                return;
            }
            const allTiles = worldgen.children.filter(entity => entity.name == "tile");
            const ammoSpawnTilePos = Util.choose(...allTiles).transform.getGlobalPosition();
            scene.addEntity(new AmmunitionPickup(ammoSpawnTilePos.x, ammoSpawnTilePos.y));
        });
        this.addComponent(timer);
    }
}
import {
    AnimatedSprite,
    AnimationEnd,
    CircleCollider,
    CollisionSystem,
    Entity,
    SpriteSheet,
    Timer,
    Util
} from "lagom-engine";
import {Layers} from "../Layers";
import {PickupCount} from "./Pickup";

import honeySprite1 from '../Art/honey1.png';
import honeySprite2 from '../Art/honey2.png';
import honeySprite3 from '../Art/honey3.png';
import {tileSpriteWidth, tileSurfaceHeight} from "../World/WorldGen";

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
        const amount = 1;
        const deleteTimeSeconds = 5;

        this.addComponent(new AnimatedSprite(Util.choose(honey1, honey2, honey3).textureSliceFromRow(0, 0, 7),
            {animationSpeed: 100, animationEndAction: AnimationEnd.LOOP, xAnchor: 0.5, yAnchor: 0.5}));
        this.addComponent(new PickupCount(amount));

        this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {layer: Layers.pickup, radius: 8}));

        this.addComponent(new Timer(deleteTimeSeconds * 1000, null, false))
            .onTrigger.register((caller, data) => {
            caller.parent.destroy();
        });
    }
}


export class AmmunitionSpawner extends Entity
{
    constructor()
    {
        super("ammunitionSpawner", 0, 0);
    }

    onAdded(): void
    {
        super.onAdded();
        const ammoSpawnFrequencySeconds = 3;

        const timer = new Timer(ammoSpawnFrequencySeconds * 1000, null, true);
        timer.onTrigger.register((caller) => {
            const scene = caller.getScene();
            const worldgen = scene.getEntityWithName("worldgen");
            if (!worldgen)
            {
                return;
            }
            const allTiles = worldgen.children.filter(entity => entity.name == "tile");
            const entity = Util.choose(...allTiles);

            const tileGlobalPos = entity.transform.getGlobalPosition(undefined, true);
            const offsetFromTop = Math.floor(tileSurfaceHeight / 2) - 2;
            const offsetFromLeft = tileSpriteWidth / 2;

            const tileCenterX = tileGlobalPos.x + offsetFromLeft;
            const tileCenterY = tileGlobalPos.y + offsetFromTop;

            scene.addEntity(new AmmunitionPickup(tileCenterX, tileCenterY));
        });
        this.addComponent(timer);
    }
}

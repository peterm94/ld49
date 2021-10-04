import {Component, Entity, Util} from "lagom-engine";
import {tileSpriteWidth, tileSurfaceHeight} from "../World/WorldGen";

export class PickupSpawner extends Entity
{
    constructor(name: string, x: number, y: number, readonly spawnFrequencySec: number)
    {
        super(name, x, y);
    }

    spawnPickupOnRandomTile(caller: Component, pickup: Entity)
    {
        const scene = caller.getScene();
        const worldgen = scene.getEntityWithName("worldgen");
        if (!worldgen)
        {
            return;
        }
        const allTiles = worldgen.children.filter(entity => entity.name == "tile");

        if (allTiles.length)
        {
            const entity = Util.choose(...allTiles);

            const tileGlobalPos = entity.transform.getGlobalPosition(undefined, true);
            const offsetFromTop = Math.floor(tileSurfaceHeight / 2) - 2;
            const offsetFromLeft = tileSpriteWidth / 2;

            const tileCenterX = tileGlobalPos.x + offsetFromLeft;
            const tileCenterY = tileGlobalPos.y + offsetFromTop;

            pickup.transform.position.x = tileCenterX;
            pickup.transform.position.y = tileCenterY;
            scene.addEntity(pickup);
        }
    }
}

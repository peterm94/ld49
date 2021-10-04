import {Component, Entity, Log, Util} from "lagom-engine";
import {tileSpriteWidth, tileSurfaceHeight, WorldGen} from "../World/WorldGen";
import {Pickup} from "./Pickup";

export class PickupSpawner extends Entity
{
    constructor(name: string, x: number, y: number, readonly timeBetweenSpawnsSec: number)
    {
        super(name, x, y);
    }

    spawnPickupOnRandomTile(caller: Component, pickup: Pickup)
    {
        const scene = caller.getScene();

        const worldgen = scene.getEntityWithName("worldgen");
        if (!worldgen)
        {
            return;
        }
        if (!(worldgen instanceof WorldGen))
        {
            return;
        }

        const allEmptyTiles = worldgen.getAllEmptyTiles();
        if (!allEmptyTiles.length)
        {
            Log.error("Tried to spawn a pickup but no tiles exist without a pickup on it already.");
            return;
        }

        const chosenTile = Util.choose(...allEmptyTiles);

        const tileGlobalPos = chosenTile.transform.position;
        const offsetFromTop = Math.floor(tileSurfaceHeight / 2) - 2;
        const offsetFromLeft = tileSpriteWidth / 2;

        const tileCenterX = tileGlobalPos.x + offsetFromLeft;
        const tileCenterY = tileGlobalPos.y + offsetFromTop;

        pickup.transform.position.x = offsetFromLeft;
        pickup.transform.position.y = offsetFromTop;
        chosenTile.addChild<Pickup>(pickup);
    }
}

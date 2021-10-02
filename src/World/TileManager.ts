import {CollisionSystem, Component, Entity, MathUtil, PolyCollider, Sprite, SpriteSheet, System, Timer, Util} from "lagom-engine";
import { Layers } from "../Layers";
import { NoTile } from "./WorldGen";

export class TileManager extends Entity
{
    constructor()
    {
        super("tilemgr", 0, 0, Layers.hexagons);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Timer(10 * 1000, null, true))
            .onTrigger
            .register((caller, data) => {
                const worldgen = caller.getScene().getEntityWithName("worldgen");
                if (worldgen)
                {
                    const allTiles = worldgen.children.filter(entity => entity.name == "tile");
                    const tileToDelete = Util.choose(...allTiles);
                    worldgen.addChild(new NoTile(tileToDelete.transform.x, tileToDelete.transform.y, true));
                    tileToDelete.destroy();
                }
            });
    }
}
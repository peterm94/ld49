import {CollisionSystem, Component, Entity, LagomGameComponent, MathUtil, PolyCollider, Sprite, SpriteSheet, System, Timer, Util} from "lagom-engine";
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
                    // Tile goes seethru before it disappears
                    tileToDelete.getComponent<Sprite>(Sprite)?.applyConfig({alpha: 0.5});
                    tileToDelete.addComponent(new Timer(2 * 1000, null, false))
                                .onTrigger.register((caller, data) =>
                                {
                                    const worldgen = caller.getScene().getEntityWithName("worldgen");
                                    if (worldgen)
                                    {
                                        worldgen.addChild(new NoTile(caller.parent.transform.x, caller.parent.transform.y, true));
                                        caller.parent.destroy();
                                    }
                                });
                }
            });
    }
}
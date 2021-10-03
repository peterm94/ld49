import {Entity, Log, Sprite, Timer, Util} from "lagom-engine";
import {Layers} from "../Layers";
import {NoTile} from "./WorldGen";
import {SoundManager} from "../SoundManager/SoundManager";

export class TileManager extends Entity
{
    constructor()
    {
        super("tilemgr", 0, 0, Layers.hexagons);
    }

    onAdded()
    {
        super.onAdded();
        const frequencyToRemoveSeconds = 10;
        const seethroughTileLifeSeconds = 2;
        const seethroughTileAlpha = 0.5;

        this.addComponent(new Timer(frequencyToRemoveSeconds * 1000, null, true))
            .onTrigger
            .register((caller) => {
                const worldgen = caller.getScene().getEntityWithName("worldgen");
                if (worldgen)
                {
                    const allTiles = worldgen.children.filter(entity => entity.name === "tile");
                    if (!allTiles.length)
                    {
                        Log.error("Tried to destroy a tile, but no tiles could be found!");
                        return;
                    }
                    const tileToDelete = Util.choose(...allTiles);

                    // Tile goes seethru before it disappears.
                    const tileSprite = tileToDelete.getComponent<Sprite>(Sprite);

                    if (tileSprite == null)
                    {
                        Log.error("Couldn't get the sprite for the tile to delete.");
                        return;
                    }

                    tileSprite.applyConfig({alpha: seethroughTileAlpha});
                    (this.scene.getEntityWithName("audio") as SoundManager).playSound("crack");
                    tileToDelete.addComponent(new Timer(seethroughTileLifeSeconds * 1000, null, false))
                                .onTrigger.register((caller) => {
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

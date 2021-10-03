import {Component, Entity, Log, MathUtil, Scene, Sprite, Timer, Util} from "lagom-engine";
import {NoTile} from "./WorldGen";
import {SoundManager} from "../SoundManager/SoundManager";

export class TileDestroyer extends Component
{
    onAdded()
    {
        super.onAdded();
    }

    removeRandomTilesOverTime(scene: Scene, timeFrameMs: number, totalTiles: number)
    {
        const seethroughDurationMs = timeFrameMs * 0.75;
        const seethroughTileAlpha = 0.5;
        const worldgen = scene.getEntityWithName("worldgen");
        if (worldgen)
        {
            const tilesToChooseFrom = worldgen.children.filter(entity => entity.name === "tile");
            if (!tilesToChooseFrom.length)
            {
                Log.error("Tried to destroy a tile, but no tiles could be found!");
                return;
            }

            // Get tiles that can be deleted
            const tilesToDelete: Entity[] = [];
            for (let i = 0; i < totalTiles; i++)
            {
                const chosenTile = Util.choose(...tilesToChooseFrom);
                const chosenTileIndex = tilesToChooseFrom.indexOf(chosenTile);
                tilesToChooseFrom.splice(chosenTileIndex, 1);
                tilesToDelete.push(chosenTile);
            }

            tilesToDelete.forEach((tile) => {
                const startTimeBufferMs = timeFrameMs * (MathUtil.randomRange(0, 25) / 100);

                // Tile goes seethru before it disappears.
                const tileSprite = tile.getComponent<Sprite>(Sprite);

                if (tileSprite == null)
                {
                    Log.error("Couldn't get the sprite for the tile to delete.");
                    return;
                }

                // Wait for a random amount of time before destroying tiles so that they change randomly on the
                // users screen.
                tile.addComponent(new Timer(startTimeBufferMs, null, false))
                    .onTrigger.register((_) => {
                    tileSprite.applyConfig({alpha: seethroughTileAlpha});
                    (this.getScene().getEntityWithName("audio") as SoundManager).playSound("crack");

                    tile.addComponent(new Timer(seethroughDurationMs, null, false))
                        .onTrigger.register((seethroughCaller) => {
                        const worldgen = seethroughCaller.getScene().getEntityWithName("worldgen");
                        if (worldgen)
                        {
                            worldgen.addChild(
                                new NoTile(seethroughCaller.parent.transform.x, seethroughCaller.parent.transform.y,
                                    true, MathUtil.randomRange(0, 20)));
                            seethroughCaller.parent.destroy();
                        }
                    });
                });
            });
        }
    }
}

import {AnimatedSpriteController, Component, Entity, Log, MathUtil, Scene, Timer, Util} from "lagom-engine";
import {NoTile, WorldGen} from "./WorldGen";
import {SoundManager} from "../SoundManager/SoundManager";

export class TileDestroyer extends Component
{
    onAdded()
    {
        super.onAdded();
    }

    removeRandomTilesOverTime(scene: Scene, timeFrameMs: number, totalTiles: number)
    {
        const worldgen = scene.getEntityWithName("worldgen");
        if (!worldgen)
        {
            return;
        }

        if (!(worldgen instanceof WorldGen))
        {
            return;
        }

        const breakingDuration = timeFrameMs * 0.75;
        const allEmptyTiles = worldgen.getAllEmptyTiles();

        if (!allEmptyTiles.length)
        {
            Log.error("Tried to destroy a tile, but no tiles could be found without anything on them!");
            return;
        }

        // Get tiles that can be deleted
        const tilesToDelete: Entity[] = [];
        for (let i = 0; i < totalTiles; i++)
        {
            const chosenTile = Util.choose(...allEmptyTiles);
            const chosenTileIndex = allEmptyTiles.indexOf(chosenTile);
            allEmptyTiles.splice(chosenTileIndex, 1);
            tilesToDelete.push(chosenTile);
        }

        tilesToDelete.forEach((tile) => {
            const startTimeBufferMs = timeFrameMs * (MathUtil.randomRange(0, 35) / 100);

            // Wait for a random amount of time before destroying tiles so that they change randomly on the
            // users screen.
            tile.addComponent(new Timer(startTimeBufferMs, null, false))
                .onTrigger.register((_) => {
                tile.getComponent<AnimatedSpriteController>(AnimatedSpriteController)?.setAnimation(1);
                (this.getScene().getEntityWithName("audio") as SoundManager).playSound("crack");

                tile.addComponent(new Timer(breakingDuration, null, false))
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

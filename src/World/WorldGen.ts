import {
    CollisionSystem,
    Component,
    Entity,
    Log,
    MathUtil,
    PolyCollider,
    Sprite,
    SpriteSheet,
    System,
    Timer
} from "lagom-engine";
import tileImg from '../Art/coloured-hex.png';
import {Layers} from "../Layers";
import {GroundCount, PlayerFalling} from "../Player/Player";

export const tileSpriteWidth = 32;
export const tileSpriteHeight = 20;
export const tileSurfaceHeight = 15;

const tile = new SpriteSheet(tileImg, tileSpriteWidth, tileSpriteHeight);

// How far to move each staggered hexagon to the right in order for it to slot nicely into the previous tile.
const tileStaggeredOffsetX = 24;

export class WorldGen extends Entity
{
    public static board: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 1, 0, 0, 0, 0, 1, 0,],
        [1, 1, 0, 0, 0, 0, 1, 0,],
        [0, 1, 0, 0, 0, 0, 1, 0,],
        [1, 1, 1, 0, 0, 1, 1, 0,],
        [0, 1, 1, 1, 0, 1, 1, 0,],
        [1, 1, 0, 1, 1, 1, 1, 0,],
        [0, 1, 1, 1, 1, 1, 0, 0,],
        [1, 1, 1, 1, 1, 1, 0, 0,],
        [0, 0, 1, 1, 1, 1, 1, 0,],
        [1, 1, 1, 1, 1, 1, 1, 0,],
        [0, 1, 1, 1, 1, 1, 1, 0,],
        [1, 1, 1, 1, 1, 1, 1, 0,],
        [0, 0, 1, 1, 1, 1, 1, 0,],
        [0, 0, 1, 1, 1, 1, 0, 0,],
        [0, 1, 1, 1, 1, 1, 0, 0,],
        [1, 1, 1, 0, 1, 1, 1, 0,],
        [0, 1, 1, 1, 1, 1, 1, 0,],
        [1, 1, 1, 1, 1, 1, 1, 0,],
        [0, 1, 1, 1, 1, 1, 1, 0,],
        [1, 1, 1, 1, 1, 1, 1, 0,],
        [0, 0, 1, 1, 1, 1, 0, 0,],
        [0, 0, 0, 1, 1, 1, 0, 0,],
        [0, 0, 1, 1, 1, 1, 1, 0,],
        [0, 0, 1, 1, 1, 1, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0,],
        [0, 0, 0, 0, 0, 0, 0, 0,],
    ];

    constructor(x: number, y: number, readonly towerTilePos: number[][], readonly playerSpawnTilePos: number[][],
                readonly ammunitionSpawnTiles: number[][])
    {
        super("worldgen", x, y, Layers.hexagons);
    }

    /**
     * The board is made up of a number of groups of sprites which are 2 hexagons wide.
     * Each of the hexagons are 32px wide, but we offset since they're hexagonal and we need to slot them together.
     * Due to the offset, the smooshed sprite width is 25px * 2 = 50px.
     * We use 24px as the offset elsewhere because we want the edge pixels to overlap as it's smoother.
     */
    static getBoardWidth(): number
    {
        // Account for the additional invisible row we need because our hexagons need to be created in columns of two.
        const actualBoardWidth = WorldGen.board[0].length - 0.5;
        return 50 * (actualBoardWidth);
    }

    /**
     * The board is made up of hexagon sprites which have a visible face height of 15px.
     * The hexagons also have visible edges, which are 5px high.
     * Since each group of hexagons is actually two columns, and we stagger each hexagon on the x, the actual
     * distance on the y per hexagon is half of the hexagon face height.
     */
    static getBoardHeight(): number
    {
        return 7.5 * WorldGen.board.length;
    }

    onAdded()
    {
        super.onAdded();

        // Stagger each row of the board.
        WorldGen.board.forEach((row, rowIndex) => {

            // Every second row should be shifted to the right so that the hexagons slot together.
            const xOffset = rowIndex % 2 === 0 ? 0 : tileStaggeredOffsetX;
            row.forEach((col, colIndex) => {

                // Each row should be shifted down by half the height of the hexagon.
                // Half (not full) height because we're offsetting each row too so it only moves down half each
                // iteration.
                const yPos = rowIndex * 7;

                // Shift right as required, and offset so we can emulate tiling each entry from left to right.
                const xPos = xOffset + colIndex * 48;
                if (col === 1)
                {
                    // Decide whether to elevate, lower, or do nothing to the hexagon.
                    let heightOffset = MathUtil.randomRange(-1, 2);

                    // We don't want the tile that our gun is on to ever be destroyed randomly.
                    let title = "tile";
                    const isTowerHex = this.towerTilePos.some(
                        ([col, row]) => colIndex === col && rowIndex === row
                    );

                    const isPlayerSpawn = this.playerSpawnTilePos.some(
                        ([col, row]) => colIndex === col && rowIndex === row
                    );

                    if (isTowerHex)
                    {
                        title = "tile_tower_spawn";
                        heightOffset = 1;
                    }
                    else if (isPlayerSpawn)
                    {
                        title = "tile_player_spawn";
                    }

                    this.addChild(new Tile(title, xPos, yPos - heightOffset, heightOffset));
                }
                else
                {
                    // We don't want explicitly missing tiles to come back again.
                    this.addChild(new NoTile(xPos, yPos, false));
                }
            });
        });
    }
}

export class Tile extends Entity
{
    constructor(name: string, x: number, y: number, readonly tileOffset: number)
    {
        super(name, x, y, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(tile.textureFromIndex(0)));
        this.addComponent(new TileComponent());

        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (global instanceof CollisionSystem)
        {
            const coll = this.addComponent(new PolyCollider(global, {
                layer: Layers.hexagons,
                // points: [[7, 1], [24, 1], [30, 7], [24, 13], [7, 13], [1, 7]],
                points: [[4, -2], [27, -2], [33, 7], [27, 16], [4, 16], [-2, 7]],
                yOff: this.tileOffset
                // points: [[11, 4], [19, 4], [22, 7], [19, 10], [11, 10], [8, 7]]
            }));

            coll.onTriggerEnter.register((caller, data) => {
                // TODO In the hole
                if (data.other.layer === Layers.playerGround)
                {
                    const gc = data.other.getEntity().getComponent<GroundCount>(GroundCount);
                    if (gc !== null)
                    {
                        gc.groundCount++;
                        Log.info("ON A TILE", gc.groundCount);
                    }
                }
            });

            coll.onTriggerExit.register((caller, other) => {
                if (other.layer === Layers.playerGround)
                {
                    const gc = other.getEntity().getComponent<GroundCount>(GroundCount);
                    if (gc !== null)
                    {
                        gc.groundCount--;
                        Log.info("OFF A TILE", gc.groundCount);
                    }
                }
            });
        }
    }
}

export class NoTile extends Entity
{

    constructor(x: number, y: number, private readonly regenerateTile: boolean)
    {
        super("notile", x, y, y);
    }

    onAdded()
    {
        super.onAdded();
        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (global instanceof CollisionSystem)
        {
            const coll = this.addComponent(new PolyCollider(global, {
                layer: Layers.hexagons,
                points: [[7, 1], [24, 1], [30, 7], [24, 13], [7, 13], [1, 7]]
                // points: [[11, 4], [19, 4], [22, 7], [19, 10], [11, 10], [8, 7]]
            }));

            coll.onTrigger.register((caller, data) => {

                // TODO In the hole
                if (data.other.layer === Layers.playerGround)
                {
                    const gc = data.other.getEntity().getComponent<GroundCount>(GroundCount);
                    if (gc !== null)
                    {
                        Log.info("IN A HOLE?", gc.groundCount);

                        if (gc.groundCount === 0)
                        {
                            if (data.other.getEntity().getComponent<PlayerFalling>(PlayerFalling))
                            {
                                // Already falling
                                return;
                            }
                            data.other.getEntity().addComponent(new PlayerFalling(this.depth));
                        }
                    }
                }
            });
        }

        if (this.regenerateTile)
        {
            this.addComponent(new Timer(10 * 1000, null, false))
                .onTrigger.register(caller => {
                const worldgen = caller.getScene().getEntityWithName("worldgen");
                if (!worldgen)
                {
                    return;
                }
                const parent = caller.getEntity().parent;
                if (parent)
                {
                    const offset = MathUtil.randomRange(-1, 2);
                    worldgen.addChild(new Tile("tile", this.transform.x, this.transform.y - offset, offset));
                    caller.getEntity().destroy();
                }
            });
        }
    }
}

export class TileComponent extends Component
{
}

export class RemoveTile extends Component
{
}


export class TileRemover extends System
{
    types = () => [Sprite, RemoveTile];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: Sprite, rem: RemoveTile) => {
            sprite.applyConfig({alpha: 0.5});
            rem.destroy();
        });
    }
}

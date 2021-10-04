import {
    AnimatedSpriteController,
    AnimationEnd,
    CollisionSystem,
    Entity,
    MathUtil,
    PolyCollider,
    SpriteSheet,
    Timer,
    Util
} from "lagom-engine";
import {Layers} from "../Layers";
import {SoundManager} from "../SoundManager/SoundManager";
import {GroundCount, Player} from "../Player/Player";
import tileCrackSprite from "../Art/coloured-hex-craking.png";
import {Pickup} from "../Pickups/Pickup";

export const tileSpriteWidth = 32;
export const tileSpriteHeight = 20;
export const tileSurfaceHeight = 15;

const tileCrack = new SpriteSheet(tileCrackSprite, tileSpriteWidth, tileSpriteHeight);

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
        [1, 1, 1, 1, 1, 1, 0, 0,],
        [0, 1, 1, 1, 1, 1, 1, 0,],
        [1, 1, 1, 1, 1, 1, 0, 0,],
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

    getAllEmptyTiles()
    {
        return this.children.filter(entity => {
            const isTile = entity.name === "tile";
            if (!isTile)
            {
                return false;
            }

            // Don't spawn on tiles that already have a pickup on them.
            return !entity.children.some(child => child instanceof Pickup);
        });
    }
}

export class Tile extends Entity
{
    constructor(name: string, x: number, y: number, readonly tileOffset: number)
    {
        super(name, x, y, y);
    }

    onRemoved()
    {
        const gc = this.getScene().getEntityWithName("player")?.getComponent<GroundCount>(GroundCount);
        if (gc)
        {
            Util.remove(gc.grounds, this);
        }

        super.onRemoved();
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                // First frame has no cracks.
                textures: [tileCrack.textureFromIndex(0)],
                config: {animationSpeed: 100, animationEndAction: AnimationEnd.STOP},
            },
            {
                id: 1,
                textures: tileCrack.textureSliceFromSheet(),
                config: {animationSpeed: 100, animationEndAction: AnimationEnd.STOP},
            },
        ]));

        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (!(global instanceof CollisionSystem))
        {
            return;
        }

        const collider = this.addComponent(new PolyCollider(global, {
            layer: Layers.hexagons,
            // points: [[7, 1], [24, 1], [30, 7], [24, 13], [7, 13], [1, 7]],
            points: [[4, -2], [27, -2], [33, 7], [27, 16], [4, 16], [-2, 7]],
            yOff: this.tileOffset
            // points: [[11, 4], [19, 4], [22, 7], [19, 10], [11, 10], [8, 7]]
        }));

        collider.onTriggerEnter.register((caller, data) => {
            if (data.other.layer !== Layers.playerGround)
            {
                return;
            }

            const gc = data.other.getEntity().getComponent<GroundCount>(GroundCount);
            if (gc !== null)
            {
                gc.grounds.push(caller.getEntity());
                gc.layer = caller.getEntity().layer;
                gc.groundCount++;
            }
        });

        collider.onTriggerExit.register((caller, other) => {
            if (other.layer !== Layers.playerGround)
            {
                return;
            }
            const player = other.getEntity();

            if (!(player instanceof Player))
            {
                return;
            }

            const gc = player.getComponent<GroundCount>(GroundCount);
            if (gc === null)
            {
                return;
            }
            Util.remove(gc.grounds, caller.getEntity());
            gc.layer = caller.getEntity().layer;
            gc.groundCount--;

            if (gc.groundCount !== 0)
            {
                return;
            }
        });
    }
}

export class NoTile extends Entity
{

    constructor(x: number, y: number, private readonly regenerateTile: boolean, readonly secondsBeforeRegen = 10)
    {
        super("notile", x, y, y);
    }

    onAdded()
    {
        super.onAdded();

        if (!this.regenerateTile)
        {
            return;
        }

        this.addComponent(new Timer(this.secondsBeforeRegen * 1000, null, false))
            .onTrigger.register(caller => {
            const worldgen = caller.getScene().getEntityWithName("worldgen");
            if (!worldgen)
            {
                return;
            }
            const parent = caller.getEntity().parent;
            if (!parent)
            {
                return;
            }

            (this.scene.getEntityWithName("audio") as SoundManager).playSound("voop");
            worldgen.addChild(new Tile("tile", this.transform.x, this.transform.y, 0));
            caller.getEntity().destroy();
        });
    }
}

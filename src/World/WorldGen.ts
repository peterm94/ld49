import {CollisionSystem, Component, Entity, PolyCollider, Sprite, SpriteSheet, System, Timer} from "lagom-engine";
import tileImg from '../Art/coloured-hex.png';
import {Layers} from "../Layers";
import { PlayerFalling } from "../Player/Player";

const tile = new SpriteSheet(tileImg, 32, 20);

export class WorldGen extends Entity
{
    constructor()
    {
        super("worldgen", 0, 0, Layers.hexagons);
    }

    onAdded()
    {
        super.onAdded();

        const board: number[][] = [
            [0, 1, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 1, 0],
            [1, 1, 1, 0, 0, 0, 1, 1],
            [1, 1, 1, 0, 0, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 0, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
        ];

        board.forEach((row, rowIndex) => {
            const xOffset = rowIndex % 2 == 0 ? 0 : 24;
            row.forEach((col, colIndex) => {
                const yPos = rowIndex * 7;
                const xPos = xOffset + colIndex * 48;
                if (col)
                {
                    this.addChild(new Tile(xPos, yPos));
                }
                else
                {
                    this.addChild(new NoTile(xPos, yPos, false));
                }
            });
        });
    }
}

export class Tile extends Entity
{
    constructor(x: number, y: number)
    {
        super("tile", x, y, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(tile.textureFromIndex(0)));
        this.addComponent(new TileComponent());
    }
}

export class NoTile extends Entity
{
    private regenerateTile: boolean;

    constructor(x: number, y: number, willRegenerate: boolean)
    {
        super("notile", x, y, y);
        this.regenerateTile = willRegenerate;
    }

    onAdded()
    {
        super.onAdded();
        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (global instanceof CollisionSystem)
        {
            const coll = this.addComponent(new PolyCollider(global, {
                layer: Layers.hexagons,
                // points: [[7, 1], [24, 1], [30, 7], [24, 13], [7, 13], [1, 7]]
                points: [[11, 4], [19, 4], [22, 7], [19, 10], [11, 10], [8, 7]]
            }));

            coll.onTriggerEnter.register((caller, data) => {
                // TODO In the hole
                if (data.other.layer === Layers.player)
                {
                    if (data.other.getEntity().getComponent<PlayerFalling>(PlayerFalling))
                    {
                        // Already falling
                        return;
                    }
                    data.other.getEntity().addComponent(new PlayerFalling(this.depth));
                }
            });
        }

        if (this.regenerateTile)
        {
            this.addComponent(new Timer(10 * 1000, null, false))
                .onTrigger.register((caller, data) => {
                const worldgen = caller.getScene().getEntityWithName("worldgen");
                if (!worldgen)
                {
                    return;
                }
                const parent = caller.getEntity().parent;
                if (parent)
                {
                    worldgen.addChild(new Tile(this.transform.x, this.transform.y));
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

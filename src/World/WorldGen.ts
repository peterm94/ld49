import {CollisionSystem, Component, Entity, MathUtil, PolyCollider, Sprite, SpriteSheet, System, Timer} from "lagom-engine";
import tileImg from '../Art/coloured-hex.png';
import {Layers} from "../Layers";

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

        for (let i = 0; i < 8; i++)
        {
            for (let j = 0; j < 30; j++)
            {
                const offset = j % 2 == 0 ? 0 : 24;

                if (MathUtil.randomRange(0, 100) > 85)
                {
                    this.addChild(new NoTile(offset + i * 48, j * 7, false));
                }
                else
                {
                    this.addChild(new Tile(offset + i * 48, j * 7));
                }
            }
        }
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
            });
        }

        if (this.regenerateTile)
        {
            this.addComponent(new Timer(1 * 1000, null, false))
                .onTrigger.register((caller, data) => {
                    const worldgen = caller.getScene().getEntityWithName("worldgen");
                    if (!worldgen)
                    {
                        return;
                    }
                    const parent = caller.getEntity().parent;
                    console.log(parent);
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

import {CircleCollider, CollisionSystem, Component, Entity, Sprite, SpriteSheet, System} from "lagom-engine";
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

                this.addChild(new Tile(offset + i * 48, j * 7));
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
        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (global instanceof CollisionSystem)
        {
            this.addComponent(new CircleCollider(global, {layer: Layers.hexagons, radius: 5}));
        }
    }
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

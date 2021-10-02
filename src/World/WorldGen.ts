import {CircleCollider, CollisionSystem, Entity, Sprite, SpriteSheet} from "lagom-engine";
import tileImg from '../Art/hex-32-15.png';
import {Layers} from "../Layers";

const tile = new SpriteSheet(tileImg, 32, 15);

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
        super("tile", x, y);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(new Sprite(tile.textureFromIndex(0)));
        const global = this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem);
        if (global instanceof CollisionSystem)
        {
            this.addComponent(new CircleCollider(global, {layer: Layers.hexagons, radius: 10}));
        }
    }
}

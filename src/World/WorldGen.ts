import {Entity, Sprite, SpriteSheet} from "lagom-engine";
import tileImg from '../Art/hex.png';

const tile = new SpriteSheet(tileImg, 48, 32);

export class WorldGen extends Entity
{
    constructor()
    {
        super("worldgen", 0, 0);
    }

    onAdded()
    {
        super.onAdded();

        for (let i = 0; i < 9; i++)
        {
            for (let j = 0; j < 20; j++)
            {
                const offset = j % 2 == 0 ? 0 : 32;

                this.addChild(new Tile(offset + i * 64, j * 16));
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
    }
}

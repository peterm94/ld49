import {Entity} from "lagom-engine";
import {Layers} from "../Layers";
import {TileDestroyer} from "./TileDestroyer";

export class TileManager extends Entity
{
    constructor()
    {
        super("tilemgr", 0, 0, Layers.hexagons);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new TileDestroyer());
    }
}

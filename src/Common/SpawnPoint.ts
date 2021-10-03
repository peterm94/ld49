import {Entity} from "lagom-engine";

export class SpawnPoint extends Entity
{
    constructor(name: string, x: number, y: number)
    {
        super(name, x, y);
    }
}

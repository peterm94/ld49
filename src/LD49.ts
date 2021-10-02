import {CollisionMatrix, Game, Scene} from "lagom-engine";
import {Boss} from "./Boss";
import {WorldGen} from "./World/WorldGen";

export enum Layers
{
    boss,
    ball,
}

export class LD49 extends Game
{
    constructor()
    {
        super({width: 640, height: 360, resolution: 2, backgroundColor: 0x45283C});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const collisionMatrix = new CollisionMatrix();
        collisionMatrix.addCollision(Layers.boss, Layers.ball);

        this.addEntity(new WorldGen());
        this.addEntity(new Boss(this.camera.width - 150, 20));
    }
}

import {CollisionMatrix, DebugCollisionSystem, DiscreteCollisionSystem, Game, Scene} from "lagom-engine";
import {WorldGen} from "./World/WorldGen";
import {Player, PlayerMover} from "./Player/Player";
import {Layers} from "./Layers";

const matrix = new CollisionMatrix();
matrix.addCollision(Layers.player, Layers.hexagons);

export class LD49 extends Game
{
    constructor()
    {
        super({width: 426, height: 240, resolution: 3, backgroundColor: 0x45283C});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const collSystem = this.addGlobalSystem(new DiscreteCollisionSystem(matrix));
        this.addGlobalSystem(new DebugCollisionSystem(collSystem));
        this.addSystem(new PlayerMover());

        this.addEntity(new Player(30, 30));
        this.addEntity(new WorldGen());
    }
}

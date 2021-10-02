import {CollisionMatrix, DebugCollisionSystem, Diagnostics, DiscreteCollisionSystem, Game, Scene} from "lagom-engine";
import {WorldGen} from "./World/WorldGen";
import {Player, PlayerMover} from "./Player/Player";
import {Layers} from "./Layers";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";
import {AmmunitionPickup} from "./Pickups/AmmunitionPickup";

const matrix = new CollisionMatrix();
matrix.addCollision(Layers.player, Layers.hexagons);
matrix.addCollision(Layers.player, Layers.pickup);

export class LD49 extends Game
{
    constructor()
    {
        super({width: 426, height: 240, resolution: 3, backgroundColor: 0x0d2b45});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        this.addGlobalSystem(new DiscreteCollisionSystem(matrix));

        // Global entities.
        this.addGUIEntity(new Diagnostics("red"));
        this.addGUIEntity(new GameStatusDisplay(150, 50));

        const collSystem = this.addGlobalSystem(new DiscreteCollisionSystem(matrix));
        this.addGlobalSystem(new DebugCollisionSystem(collSystem));
        this.addSystem(new PlayerMover());

        // Game entities.
        this.addEntity(new Player(30, 30));
        this.addEntity(new AmmunitionPickup(400, 200));

        this.addSystem(new GameStatusUpdater());
        this.addEntity(new WorldGen());
    }
}

import {CollisionMatrix, Diagnostics, DiscreteCollisionSystem, Game, Scene} from "lagom-engine";
import {Player, PlayerMover} from "./Player/Player";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";
import {AmmunitionPickup} from "./Pickups/AmmunitionPickup";
import {Layers} from "./Layers";

const matrix = new CollisionMatrix();

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

        matrix.addCollision(Layers.player, Layers.pickup);
        this.addGlobalSystem(new DiscreteCollisionSystem(matrix));

        // Global entities.
        this.addEntity(new Diagnostics("red"));
        this.addEntity(new GameStatusDisplay(150, 50));

        this.addSystem(new PlayerMover());

        // Game entities.
        this.addEntity(new Player(30, 30));
        this.addEntity(new AmmunitionPickup(400, 200));

        // System controls.
        this.addSystem(new PlayerMover());
        this.addSystem(new GameStatusUpdater());
    }
}

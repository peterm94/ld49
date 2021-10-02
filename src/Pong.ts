import {CollisionMatrix, Diagnostics, DiscreteCollisionSystem, Game, Scene} from "lagom-engine";
import {Player, PlayerMover} from "./Player/Player";
import {Layers} from "./Layers";
import {AmmunitionPickup} from "./Pickups/AmmunitionPickup";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";

export class Pong extends Game
{
    constructor()
    {
        super({width: 800, height: 600, resolution: 1, backgroundColor: 0x000000});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const collisionMatrix = new CollisionMatrix();
        collisionMatrix.addCollision(Layers.player, Layers.pickup);

        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));

        // Global entities.
        this.addEntity(new Diagnostics("red"));
        this.addEntity(new GameStatusDisplay(400, 50));

        // Game entities.
        this.addEntity(new Player(30, 300));
        this.addEntity(new AmmunitionPickup(400, 200));

        // System controls.
        this.addSystem(new PlayerMover());
        this.addSystem(new GameStatusUpdater());
    }
}

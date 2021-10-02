import {
    CollisionMatrix,
    Diagnostics,
    DiscreteCollisionSystem,
    FrameTriggerSystem,
    Game,
    Log,
    LogLevel,
    Scene,
    TimerSystem
} from "lagom-engine";
import {Boss} from "./Enemy/Boss/Boss";
import {WorldGen} from "./World/WorldGen";
import {Player, PlayerMover} from "./Player/Player";
import {Layers} from "./Layers";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";
import {AmmunitionPickup} from "./Pickups/AmmunitionPickup";
import {TileManager} from "./World/TileManager";
import {ProjectileMover} from "./Enemy/Boss/BossRocketAttack";
import {Tower} from "./Friendly/Tower/Tower";

const matrix = new CollisionMatrix();
matrix.addCollision(Layers.player, Layers.hexagons);
matrix.addCollision(Layers.player, Layers.pickup);
matrix.addCollision(Layers.player, Layers.bossAttack);

export class LD49 extends Game
{
    constructor()
    {
        super({width: 426, height: 240, resolution: 3, backgroundColor: 0x0d2b45});

        // TODO enable this before deploy
        // Log.logLevel = LogLevel.ERROR;
        Log.logLevel = LogLevel.WARN;

        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        // Global entities.
        this.addGUIEntity(new Diagnostics("white", 5, true));
        this.addGUIEntity(new GameStatusDisplay(370, 200));

        const collSystem = this.addGlobalSystem(new DiscreteCollisionSystem(matrix));
        // this.addGlobalSystem(new DebugCollisionSystem(collSystem));
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new TimerSystem());
        this.addSystem(new PlayerMover());
        this.addSystem(new ProjectileMover());

        // Game entities.
        this.addEntity(new Player(30, 30));

        // Towers.
        this.addEntity(new Tower(100, 100));
        this.addEntity(new Tower(300, 100));

        // Pickups.
        this.addEntity(new AmmunitionPickup(400, 200));

        this.addEntity(new TileManager());

        this.addSystem(new GameStatusUpdater());
        this.addEntity(new WorldGen());
        this.addEntity(new Boss(this.camera.width - 150, 20));
    }
}

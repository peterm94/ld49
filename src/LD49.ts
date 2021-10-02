import {
    AudioAtlas,
    CollisionMatrix,
    Component,
    Diagnostics,
    DiscreteCollisionSystem,
    Entity,
    FrameTriggerSystem,
    Game,
    GlobalSystem,
    Log,
    LogLevel,
    Scene,
    Sprite,
    SpriteSheet,
    Timer,
    TimerSystem
} from "lagom-engine";
import {Boss} from "./Enemy/Boss/Boss";
import {WorldGen} from "./World/WorldGen";
import {Player, PlayerMover} from "./Player/Player";
import {Layers} from "./Layers";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";
import {AmmunitionPickup} from "./Pickups/AmmunitionPickup";
import {TileManager} from "./World/TileManager";
import {Tower} from "./Friendly/Tower/Tower";
import {ProjectileMover} from "./Common/ProjectileMover";

import titleScreenImg from "./Art/title.png";
import {SoundManager} from "./SoundManager/SoundManager";

const titleScreen = new SpriteSheet(titleScreenImg, 426, 240);


const matrix = new CollisionMatrix();
matrix.addCollision(Layers.player, Layers.hexagons);
matrix.addCollision(Layers.player, Layers.pickup);
matrix.addCollision(Layers.player, Layers.bossAttack);
matrix.addCollision(Layers.towerAttack, Layers.boss);

export class LD49 extends Game
{
    static muted = false;
    static musicPlaying = false;
    static audioAtlas: AudioAtlas = new AudioAtlas();

    constructor()
    {
        super({width: 426, height: 240, resolution: 3, backgroundColor: 0x0d2b45});

        // TODO enable this before deploy
        // Log.logLevel = LogLevel.ERROR;
        Log.logLevel = LogLevel.INFO;

        this.setScene(new MainScene(this));
    }
}

export class ScreenCard extends Entity
{
    constructor(readonly texture: any, readonly clickAction: number, layer = 0)
    {
        super("card", 0, 0, layer);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new Sprite(this.texture));

        // Game reload. Skip to gameplay.
        if (!MainScene.firstLoad && this.clickAction === 0)
        {
            const action = this.addComponent(new ClickAction(this.clickAction));
            action.onAction();
        }
        else
        {
            MainScene.firstLoad = false;

            this.addComponent(new Timer(500, null)).onTrigger.register(() => {
                this.addComponent(new ClickAction(this.clickAction));
            });
        }
    }
}


class ClickAction extends Component
{
    constructor(readonly action: number)
    {
        super();
    }

    onAction()
    {
        switch (this.action)
        {
            // start game
            case 0:
            {
                (this.getScene() as MainScene).startGame();
                this.getEntity().destroy();
                break;
            }
            // restart
            case 1:
            {
                this.getScene().entities.forEach(x => x.destroy());
                this.getScene().systems.forEach(x => x.destroy());
                this.getScene().globalSystems.forEach(x => x.destroy());
                this.getScene().getGame().setScene(new MainScene(this.getScene().getGame()));
                break;
            }
        }
    }
}

class ClickListener extends GlobalSystem
{
    types = () => [ClickAction];

    update(delta: number): void
    {
        this.runOnComponents((clickActions: ClickAction[]) => {

            if (Game.mouse.isButtonPressed(0))
            {
                for (const action of clickActions)
                {
                    action.onAction();
                    action.destroy();
                }
            }
        });
    }
}


class MainScene extends Scene
{
    static firstLoad = true;

    onAdded()
    {
        super.onAdded();

        this.addGUIEntity(new ScreenCard(titleScreen.textureFromIndex(0), 0));
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new ClickListener());
        this.addGUIEntity(new SoundManager());
    }

    startGame()
    {

        // Global entities.
        this.addGUIEntity(new Diagnostics("white", 5, true));
        this.addGUIEntity(new GameStatusDisplay(320, 190));

        const collSystem = this.addGlobalSystem(new DiscreteCollisionSystem(matrix));
        // this.addGlobalSystem(new DebugCollisionSystem(collSystem));

        // Entity movers.
        this.addSystem(new PlayerMover());
        this.addSystem(new ProjectileMover());

        // Game entities.
        this.addEntity(new Player(30, 30));

        // Towers.
        this.addEntity(new Tower("tower_1", 100, 100));
        this.addEntity(new Tower("tower_2", 300, 100));

        // Pickups.
        this.addEntity(new AmmunitionPickup(400, 200));

        this.addEntity(new TileManager());

        this.addSystem(new GameStatusUpdater());
        this.addEntity(new WorldGen());
        this.addEntity(new Boss(this.camera.width - 150, 20));
    }
}

import {
    AudioAtlas,
    CollisionMatrix,
    Component, DebugCollisionSystem,
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
import {tileSpriteWidth, tileSurfaceHeight, WorldGen} from "./World/WorldGen";
import {Player, PlayerDropper, PlayerMover, PlayerResetter} from "./Player/Player";
import {Layers} from "./Layers";
import {GameStatusDisplay, GameStatusUpdater} from "./GameManagement/GameStatus";
import {AmmunitionPickup, AmmunitionSpawner} from "./Pickups/AmmunitionPickup";
import {TileManager} from "./World/TileManager";
import {Tower} from "./Friendly/Tower/Tower";
import {ProjectileMover} from "./Common/ProjectileMover";

import titleScreenImg from "./Art/title.png";
import {SoundManager} from "./SoundManager/SoundManager";
import {SpawnPoint} from "./Common/SpawnPoint";

const screenWidth = 426;
const screenHeight = 240;

const titleScreen = new SpriteSheet(titleScreenImg, screenWidth, screenHeight);


const matrix = new CollisionMatrix();
matrix.addCollision(Layers.playerGround, Layers.hexagons);
matrix.addCollision(Layers.playerGround, Layers.pickup);
matrix.addCollision(Layers.player, Layers.bossAttack);
matrix.addCollision(Layers.towerAttack, Layers.boss);

export class LD49 extends Game
{
    static muted = false;
    static musicPlaying = false;
    static audioAtlas: AudioAtlas = new AudioAtlas();

    constructor()
    {
        super({width: screenWidth, height: screenHeight, resolution: 3, backgroundColor: 0x0d2b45});

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

        // World generation.
        // Figure out the empty space between the board and the end of the screen, half it, and we get a centered board!
        const worldStartX = (screenWidth - WorldGen.getBoardWidth()) / 2;

        // Where entities are spawned on the board.
        // Each entry is the column index (left to right) and row index (top to bottom) in that column that the entity
        // should end up on.
        const towerSpawnTiles = [[1, 6], [4, 6]];
        const playerSpawnTiles = [[3, 12]];
        const ammunitionSpawnTiles = [[3, 13], [0, 0]];

        // Float the hexagon toward the bottom, buffer 7px so that we can see the edge of the bottom row.
        const totalTileHeight = WorldGen.getBoardHeight() + 7;
        const worldStartY = screenHeight - totalTileHeight;
        this.addEntity(new WorldGen(worldStartX, worldStartY, towerSpawnTiles, playerSpawnTiles, ammunitionSpawnTiles));

        // Create any entities that are tied to the board.
        this.entities.forEach((entity) => {
            const tileGlobalPos = entity.transform.getGlobalPosition(undefined, true);
            const offsetFromTop = Math.floor(tileSurfaceHeight / 2) - 2;
            const offsetFromLeft = tileSpriteWidth / 2;

            const tileCenterX = tileGlobalPos.x + offsetFromLeft;
            const tileCenterY = tileGlobalPos.y + offsetFromTop;
            switch (entity.name)
            {
                case "tile_tower_spawn":

                    // Sprites are flipped depending on what side of the screen they're on.
                    const flipped = tileGlobalPos.x > screenWidth / 2;
                    this.addEntity(new Tower(tileCenterX, tileCenterY, flipped));
                    break;
                case "tile_player_spawn":
                    this.addEntity(new SpawnPoint("player_spawn", tileCenterX, tileCenterY));
                    break;
                case "tile_ammunition_spawn":
                    this.addEntity(new AmmunitionPickup(tileCenterX, tileCenterY));
            }
        });

        // Entity movers.
        this.addSystem(new PlayerMover());
        this.addSystem(new ProjectileMover());

        // Game entities.
        this.addEntity(new Player(30, 30));

        // Pickups.
        this.addEntity(new AmmunitionSpawner());

        this.addEntity(new TileManager());
        this.addSystem(new PlayerDropper());
        this.addSystem(new PlayerResetter());
        this.addSystem(new GameStatusUpdater());

        // Enemies.
        this.addEntity(new Boss(this.camera.width - 150, 20));
    }
}

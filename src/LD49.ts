import {
    AnimatedSprite,
    AudioAtlas,
    CollisionMatrix,
    Component,
    DebugCollisionSystem,
    DiscreteCollisionSystem,
    Entity,
    FrameTriggerSystem,
    Game,
    GlobalSystem,
    Key,
    Log,
    LogLevel,
    Scene,
    ScreenShaker,
    SpriteSheet,
    TextDisp,
    Timer,
    TimerSystem
} from "lagom-engine";
import {Boss} from "./Enemy/Boss/Boss";
import {tileSpriteHeight, tileSpriteWidth, tileSurfaceHeight, WorldGen} from "./World/WorldGen";
import {Player, PlayerDropper, PlayerMover, PlayerResetter} from "./Player/Player";
import {Layers} from "./Layers";
import {AmmunitionSpawner} from "./Pickups/AmmunitionPickup";
import {TileManager} from "./World/TileManager";
import {Tower} from "./Friendly/Tower/Tower";
import {ProjectileMover} from "./Common/ProjectileMover";

import {SoundManager} from "./SoundManager/SoundManager";
import {SpawnPoint} from "./Common/SpawnPoint";
import {pressedKeys, viewCollisionSystem} from "./index";
import {AmmunitionStatusDisplay} from "./GameManagement/AmmunitionStatus";
import {HealthStatusDisplay} from "./GameManagement/HealthStatus";

import bearRoarWav from "./Sound/roar.wav";
import explosionWav from "./Sound/explosion.wav";
import rocketNoiseWav from "./Sound/rocket_noise.wav";
import crackWav from "./Sound/crack2.wav";
import voopWav from "./Sound/voop.wav";
import refill1 from "./Sound/refill_1.wav";
import refill2 from "./Sound/refill_2.wav";
import refill3 from "./Sound/refill_3.wav";
import refill4 from "./Sound/refill_4.wav";
import squelch from "./Sound/squelch.wav";
import {BackgroundBees} from "./World/WorkerBees";
import loseSpr from "./Art/splash/game-over.png";
import winSpr from "./Art/splash/victory.png";
import beeShootWav from "./Sound/bee_shot.wav";
import pawEffect from "./Sound/paw_effect.wav";
import {HealthSpawner} from "./Pickups/HealthPickup";
import grooveMusic from "./Sound/music.mp3";
import start from "./Art/splash/start.png";
import earIdleSprite from "./Art/bear-sheets/ear-idle.png";
import eyeBlinkSprite from "./Art/bear-sheets/eye-blink.png";
import eyeIdleSprite from "./Art/bear-sheets/eye-idle.png";
import mouthIdleSprite from "./Art/bear-sheets/mouth-idle.png";
import mouthRoarSprite from "./Art/bear-sheets/mouth-roar.png";
import handSprite from "./Art/bear-paw.png";
import bearRocketSprite from "./Art/bear-rocket.png";
import rockExplosion from "./Art/bear-rocket-explosion.png";
import turretSpr from "./Art/turret.png";
import turretCanSpr from "./Art/turret-canister.png";
import killerBeeSpr from "./Art/killer-bee.png";
import bgBeeSpr from "./Art/bg-bee.png";
import ammoHexEmptySprite from "./Art/ammo-hex-empty.png";
import beeSpriteBig from './Art/bee.png';

import ammoHexFullSprite from "./Art/ammo-hex.png";
import bossHealthSpr from "./Art/bear-health.png";
import bossHealthHeadSpr from "./Art/bear-healthbar-adornment.png";
import beeAltSprite from "./Art/bee-alt.png";
import honeySprite1 from "./Art/honey1.png";
import honeySprite2 from "./Art/honey2.png";
import honeySprite3 from "./Art/honey3.png";
import beeSpriteSmall from "./Art/bee-alt-small.png";
import beeMoveSprite from "./Art/bee-movie.png";
import muteSpr from "./Art/mute.png";
import tileCrackSprite from "./Art/coloured-hex-craking.png";

export const screenWidth = 426;
export const screenHeight = 240;

const youLoseScreen = new SpriteSheet(loseSpr, screenWidth, screenHeight);
const youWinScreen = new SpriteSheet(winSpr, screenWidth, screenHeight);

const matrix = new CollisionMatrix();
matrix.addCollision(Layers.playerGround, Layers.hexagons);
matrix.addCollision(Layers.playerGround, Layers.pickup);
matrix.addCollision(Layers.player, Layers.bossAttack);
matrix.addCollision(Layers.player, Layers.tower);
matrix.addCollision(Layers.towerAttack, Layers.boss);


export class LD49 extends Game
{
    static gameTime = 0;
    static beeOver = false;
    static muted = false;
    static musicPlaying = false;
    static audioAtlas: AudioAtlas = new AudioAtlas();

    constructor()
    {
        super({width: screenWidth, height: screenHeight, resolution: 3, backgroundColor: 0x0d2b45});

        // TODO enable this before deploy
        Log.logLevel = LogLevel.ERROR;
        // Log.logLevel = LogLevel.INFO;

        this.addResource("titleScreen", new SpriteSheet(start, screenWidth, screenHeight));
        this.addResource("youLoseScreen", youLoseScreen);
        this.addResource("youWinScreen", youWinScreen);
        this.addResource("earIdle", new SpriteSheet(earIdleSprite, 196, 128));
        this.addResource("eyeBlink", new SpriteSheet(eyeBlinkSprite, 196, 128));
        this.addResource("eyeIdle", new SpriteSheet(eyeIdleSprite, 196, 128));
        this.addResource("mouthIdle", new SpriteSheet(mouthIdleSprite, 196, 128));
        this.addResource("mouthRoar", new SpriteSheet(mouthRoarSprite, 196, 128));
        this.addResource("bearHands", new SpriteSheet(handSprite, 64, 64));
        this.addResource("rocket", new SpriteSheet(bearRocketSprite, 32, 32));
        this.addResource("rocketExplosion", new SpriteSheet(rockExplosion, 32, 32));
        this.addResource("turretSheet", new SpriteSheet(turretSpr, 64, 64));
        this.addResource("turretCan", new SpriteSheet(turretCanSpr, 7, 9));
        this.addResource("killerBee", new SpriteSheet(killerBeeSpr, 5, 5));
        this.addResource("ammoHexEmpty", new SpriteSheet(ammoHexEmptySprite, 32, 32));
        this.addResource("ammoHexFull", new SpriteSheet(ammoHexFullSprite, 32, 32));
        this.addResource("bossHealth", new SpriteSheet(bossHealthSpr, 50, 200));
        this.addResource("bossHealthHead", new SpriteSheet(bossHealthHeadSpr, 32, 32));
        this.addResource("beeAlt", new SpriteSheet(beeAltSprite, 64, 64));
        this.addResource("honey1", new SpriteSheet(honeySprite1, 18, 16));
        this.addResource("honey2", new SpriteSheet(honeySprite2, 18, 16));
        this.addResource("honey3", new SpriteSheet(honeySprite3, 18, 16));
        this.addResource("hpbee", new SpriteSheet(beeSpriteSmall, 32, 32));
        this.addResource("bigbee", new SpriteSheet(beeSpriteBig, 64, 64));
        this.addResource("bee_move", new SpriteSheet(beeMoveSprite, 64, 64));
        this.addResource("killaBee", new SpriteSheet(killerBeeSpr, 5, 5));
        this.addResource("mute", new SpriteSheet(muteSpr, 16, 16));
        this.addResource("bgBee", new SpriteSheet(bgBeeSpr, 5, 5));
        this.addResource("tileCrack", new SpriteSheet(tileCrackSprite, tileSpriteWidth, tileSpriteHeight));

        LD49.audioAtlas.load("bearRoar", bearRoarWav).volume(0.6);
        LD49.audioAtlas.load("bearRoarQuiet", bearRoarWav).volume(0.3);
        LD49.audioAtlas.load("rocketExplosion", explosionWav).volume(0.15);
        LD49.audioAtlas.load("fallThroughFloor", rocketNoiseWav).volume(0.1);
        LD49.audioAtlas.load("crack", crackWav).volume(0.15);
        LD49.audioAtlas.load("voop", voopWav).volume(0.1);
        LD49.audioAtlas.load("pickup", squelch).volume(0.3);
        LD49.audioAtlas.load("refill_1", refill1).volume(2);
        LD49.audioAtlas.load("refill_2", refill2).volume(2);
        LD49.audioAtlas.load("refill_3", refill3).volume(2);
        LD49.audioAtlas.load("refill_4", refill4).volume(2);
        LD49.audioAtlas.load("beeShoot", beeShootWav).volume(0.08);
        LD49.audioAtlas.load("pawEffect", pawEffect).volume(0.1);

        const music = LD49.audioAtlas.load("music", grooveMusic);
        music.loop(true);
        music.volume(0.25);

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

        this.addComponent(new AnimatedSprite(this.texture, {animationSpeed: 650}));

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

            if (Game.mouse.isButtonPressed(0) || pressedKeys.has(" ") || pressedKeys.has(Key.Enter))
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

export class EndScreen extends Scene
{
    constructor(game: Game, readonly win: boolean)
    {
        super(game);
    }

    onAdded()
    {
        super.onAdded();
        this.addGUIEntity(new ScreenCard(this.win ? youWinScreen.textureSliceFromSheet()
                                                  : youLoseScreen.textureSliceFromSheet(), 1))
            .addComponent(new TextDisp(screenWidth - 70, 30, `Time: ${LD49.gameTime}`,
                {fill: this.win ? 0x203c56 : 0xd08159, fontSize: 10}));
        if (this.win)
        {
            MainScene.firstLoad = true;
        }

        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new ClickListener());


        // this.addGUIEntity(new SoundManager());
    }
}

class MainScene extends Scene
{
    static firstLoad = true;

    onAdded()
    {
        super.onAdded();

        this.addGUIEntity(new ScreenCard(this.game.getResource("titleScreen").textureSliceFromSheet(), 0));
        this.addGlobalSystem(new FrameTriggerSystem());
        this.addGlobalSystem(new TimerSystem());
        this.addGlobalSystem(new ClickListener());
        this.addGlobalSystem(new ScreenShaker(screenWidth / 2, screenHeight / 2));
        this.addGUIEntity(new SoundManager());
    }

    startGame()
    {
        LD49.beeOver = false;
        LD49.gameTime = 0;

        // Global entities.
        // this.addGUIEntity(new Diagnostics("white", 5, true));
        this.addGUIEntity(new AmmunitionStatusDisplay(screenWidth - 20, screenHeight - 20));
        this.addGUIEntity(new HealthStatusDisplay(screenWidth - 20, 20));

        const gtimer = this.addGUIEntity(new Entity("gametimer", 10, screenHeight - 20));
        const txt = gtimer.addComponent(new TextDisp(0, 0, "Time: 0", {fill: 0xd08159, fontSize: 10}));
        gtimer.addComponent(new Timer(1000, txt, true)).onTrigger.register((caller, data) => {
            if (LD49.beeOver)
            {
                caller.destroy();
            }
            else
            {
                LD49.gameTime += 1;
                data.pixiObj.text = `Time: ${LD49.gameTime}`;
            }
        });

        const collSystem = this.addGlobalSystem(new DiscreteCollisionSystem(matrix));
        if (viewCollisionSystem)
        {
            this.addGlobalSystem(new DebugCollisionSystem(collSystem));
        }

        // World generation.
        // Figure out the empty space between the board and the end of the screen, half it, and we get a centered board!
        const worldStartX = (screenWidth - WorldGen.getBoardWidth()) / 2;

        // Where entities are spawned on the board.
        // Each entry is the column index (left to right) and row index (top to bottom) in that column that the entity
        // should end up on.
        const towerSpawnTiles = [[1, 11], [5, 11]];
        const playerSpawnTiles = [[3, 12]];
        const ammunitionSpawnTiles = [[3, 13], [0, 0]];

        // Float the hexagon toward the bottom, buffer -13px so that we can't see the edge of the invisible bottom row.
        const totalTileHeight = WorldGen.getBoardHeight() - 13;
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
            }
        });

        // Entity movers.
        this.addSystem(new PlayerMover());
        this.addSystem(new ProjectileMover());

        // Game entities.
        const playerSpawn = this.getEntityWithName("player_spawn");
        if (playerSpawn)
        {
            const spawnPosition = playerSpawn.transform.getGlobalPosition();
            this.addEntity(
                new Player(spawnPosition.x, spawnPosition.y));
        }
        else
        {
            Log.error("No player spawns exist, can't spawn a player.");
        }

        // Pickups.
        this.addEntity(new AmmunitionSpawner());
        this.addEntity(new HealthSpawner());
        this.addEntity(new BackgroundBees());
        this.addEntity(new TileManager());
        this.addSystem(new PlayerDropper());
        this.addSystem(new PlayerResetter());

        // Enemies.
        this.addEntity(new Boss(this.camera.width / 2, 55));
    }
}

import {
    AnimatedSpriteController,
    AnimationEnd,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    MathUtil,
   Scene,
    ScreenShake,
    SpriteSheet,
    Timer,
    Util
} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Layers} from "../../Layers";
import {TowerBeeAttack} from "../../Friendly/Tower/TowerBeeAttack";
import {Attack} from "../../Common/Attack";

import earIdleSprite from "../../Art/bear-sheets/ear-idle.png";
import eyeBlinkSprite from "../../Art/bear-sheets/eye-blink.png";
import eyeIdleSprite from "../../Art/bear-sheets/eye-idle.png";
import mouthIdleSprite from "../../Art/bear-sheets/mouth-idle.png";
import mouthRoarSprite from "../../Art/bear-sheets/mouth-roar.png";
import {BossStatusDisplay} from "../../GameManagement/BossStatusDisplay";
import {TileDestroyer} from "../../World/TileDestroyer";
import {SoundManager} from "../../SoundManager/SoundManager";
import {BearHand, FadeInSystem, FadeOutSystem} from "./BossHands";
import {LD49} from "../../LD49";

const earIdle = new SpriteSheet(earIdleSprite, 196, 128);
const eyeBlink = new SpriteSheet(eyeBlinkSprite, 196, 128);
const eyeIdle = new SpriteSheet(eyeIdleSprite, 196, 128);
const mouthIdle = new SpriteSheet(mouthIdleSprite, 196, 128);
const mouthRoar = new SpriteSheet(mouthRoarSprite, 196, 128);

export class Boss extends Entity
{
    private firstRoar: boolean;

    constructor(x: number, y: number)
    {
        super("boss", x, y, Layers.boss);
        this.firstRoar = true;
    }

    onAdded()
    {
        super.onAdded();

        const ears = this.addChild(new Entity("ears", 0, 0, Layers.boss));
        const earsSpr = ears.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: earIdle.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }
            }
        ]));


        const eyes = this.addChild(new Entity("eyes", 0, 0, Layers.boss));

        const addBlinkTimer = () => {
            eyes.addComponent(new Timer(MathUtil.randomRange(2000, 10_000), eyesSpr, false)).onTrigger
                .register((caller, data) => {
                    data.setAnimation(1);
                    data.reset();
                });
        };

        const eyesSpr = eyes.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: eyeIdle.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }
            },
            {
                id: 1,
                textures: eyeBlink.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    animationSpeed: 100,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    animationEndEvent: () => {
                        eyesSpr.setAnimation(0);
                        addBlinkTimer();
                    }
                }
            }
        ]));

        addBlinkTimer();

        const mouthRoarStart = mouthRoar.textureSliceFromRow(0, 0, 8);
        const mouthRoarOpen = mouthRoar.textureSliceFromRow(0, 9, 9);
        const mouthRoarEnd = mouthRoar.textureSliceFromRow(0, 10, 14);

        // Smoother end roar, this should probably be done in Aseprite but oh well.
        mouthRoarEnd.unshift(mouthRoarStart[mouthRoarStart.length - 1]);

        enum RoarAnimStates
        {
            IDLE,
            START_ROAR,
            OPEN_ROAR,
            END_ROAR,
        }

        const mouth = this.addChild(new Entity("mouth", 0, 0, Layers.boss));

        const addRoarTimer = () => {
            mouth.addComponent(new Timer(MathUtil.randomRange(2_000, 10_000), roarSpr, false)).onTrigger
                 .register((caller, data) => {
                     data.setAnimation(RoarAnimStates.START_ROAR);
                 });
        };


        const roarSpr = mouth.addComponent(new AnimatedSpriteController(RoarAnimStates.IDLE, [
            {
                id: RoarAnimStates.IDLE,
                textures: mouthIdle.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }
            },
            {
                id: RoarAnimStates.START_ROAR,
                textures: mouthRoarStart,
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    animationEndEvent: () => {
                        // Pause the ears for the roar duration.
                        earsSpr.nextTriggerTime += 3000;
                        roarSpr.getEntity().addComponent(new ScreenShake(0.3, 3000));
                        roarSpr.setAnimation(RoarAnimStates.OPEN_ROAR);

                        (this.scene.getEntityWithName("audio") as SoundManager)
                            .playSound((this.firstRoar) ? "bearRoar" : "bearRoarQuiet");

                        if (this.firstRoar) {
                            this.firstRoar = false;
                        }

                        this.dropTiles(2000, this.getScene());
                    }
                }
            },
            {
                id: RoarAnimStates.OPEN_ROAR,
                textures: mouthRoarOpen,
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    animationEndEvent: () => {
                        mouth.addComponent(new Timer(3000, roarSpr)).onTrigger.register((caller, data) => {
                            data.setAnimation(RoarAnimStates.END_ROAR);
                        });
                        // TODO why can't I trigger it from END_ROAR? it gets stuck and has to catch up?
                        mouth.addComponent(new Timer(4000, roarSpr)).onTrigger.register((caller, data) => {
                            data.setAnimation(RoarAnimStates.IDLE);
                            addRoarTimer();
                        });
                    },
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }
            },
            {
                id: RoarAnimStates.END_ROAR,
                textures: mouthRoarEnd,
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                    // animationEndEvent: () => {
                    //     roarSpr.setAnimation(RoarAnimStates.IDLE, true);
                    //     addRoarTimer();
                    // }
                }
            }
        ]));

        addRoarTimer();

        const rocketAttackTimer = this.addComponent(new Timer(5 * 1000, null, true));
        rocketAttackTimer.onTrigger.register(this.instantiateRocketAttack);

        const health = this.addComponent(new Health(100, 100));

        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem), {
                layer: Layers.boss,
                radius: 20
            }));

        collider.onTriggerEnter.register((c, d) => this.getAttacked(c, d, health));

        this.getScene().addGUIEntity(new BossStatusDisplay(0, 30, health));
        this.getScene().addSystem(new FadeInSystem());
        this.getScene().addSystem(new FadeOutSystem());
    }

    instantiateRocketAttack(caller: Component)
    {
        const clawSide = Util.choose(true, false);
        if (clawSide)
        {
            const x = MathUtil.randomRange(66, 122);
            const y = MathUtil.randomRange(17, 34);
            const tilt = ((x-66) / (122 - 66)) * 0.45;
            caller.getScene().addEntity(new BearHand(x, y, false, tilt));
        }
        else
        {
            const x = MathUtil.randomRange(296, 360);
            const y = MathUtil.randomRange(22, 28);
            const tilt = ((x-296) / (360 - 296)) * 0.45;
            caller.getScene().addEntity(new BearHand(x, y, true, -tilt));
        }
    }

    getAttacked(caller: Collider, data: { other: Collider; result: unknown }, health: Health)
    {
        const other = data.other.getEntity();
        if (other instanceof TowerBeeAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                if (health.isEmpty())
                {
                    // TODO Destroy the tower? Maybe a system listener instead since we need to replace with a
                    //  destroyed tower instead?
                }
            }
        }
    }

    dropTiles(timeWindowMs: number, scene: Scene)
    {
        const tileManager = scene.getEntityWithName("tilemgr");

        if (tileManager)
        {
            const thig = tileManager.getComponent<TileDestroyer>(TileDestroyer);

            if (thig)
            {
                thig.removeRandomTilesOverTime(scene, timeWindowMs, 15);
            }
        }
    }
}

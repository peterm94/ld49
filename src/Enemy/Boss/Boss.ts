import {
    AnimatedSpriteController,
    AnimationEnd,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Log,
    MathUtil,
    Scene,
    ScreenShake,
    SpriteSheet,
    Timer
} from "lagom-engine";
import {Health} from "../../Common/Health";
import {Layers} from "../../Layers";
import {TowerBeeAttack} from "../../Friendly/Tower/TowerBeeAttack";
import {Attack} from "../../Common/Attack";
import {BossRocketAttack} from "./BossRocketAttack";

import earIdleSprite from "../../Art/bear-sheets/ear-idle.png";
import eyeBlinkSprite from "../../Art/bear-sheets/eye-blink.png";
import eyeIdleSprite from "../../Art/bear-sheets/eye-idle.png";
import mouthIdleSprite from "../../Art/bear-sheets/mouth-idle.png";
import mouthRoarSprite from "../../Art/bear-sheets/mouth-roar.png";
import {BossStatusDisplay} from "../../GameManagement/BossStatusDisplay";
import {TileDestroyer} from "../../World/TileDestroyer";
import {SoundManager} from "../../SoundManager/SoundManager";
import {BossPhase, BossPhases} from "./BossPhase";

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
        const health = this.addComponent(new Health(100, 100));
        const bossPhase = this.addComponent(new BossPhase(BossPhases.PHASE_1));

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
            if (bossPhase.currentPhase <= BossPhases.PHASE_2 && bossPhase.currentPhase !== BossPhases.DEAD)
            {
                mouth.addComponent(new Timer(MathUtil.randomRange(2_000, 10_000), roarSpr, false)).onTrigger
                     .register((caller, data) => {
                         data.setAnimation(RoarAnimStates.START_ROAR);
                     });
            }
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

                        if (this.firstRoar)
                        {
                            this.firstRoar = false;
                        }

                        // Big difficulty shift for the final phase.
                        const numberOfTiles = bossPhase.currentPhase === BossPhases.PHASE_4 ? 30 : 15;
                        this.dropTiles(2000, numberOfTiles, this.getScene());
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
        rocketAttackTimer.onTrigger.register((caller) => {
            if (bossPhase.currentPhase <= BossPhases.PHASE_3 && bossPhase.currentPhase !== BossPhases.DEAD)
            {
                this.instantiateRocketAttack(caller);
            }
        });

        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem), {
                layer: Layers.boss,
                radius: 20
            }));

        collider.onTriggerEnter.register((c, d) => this.receiveAttack(c, d, health, bossPhase));

        this.getScene().addGUIEntity(new BossStatusDisplay(0, 30, health));
    }

    instantiateRocketAttack(caller: Component)
    {
        const x = caller.getEntity().transform.position.x;
        const y = caller.getEntity().transform.position.y;

        const target = caller.getScene().getEntityWithName("player");
        if (!target)
        {
            Log.error("Tried to target the Player for a Boss attack, but nothing could be found.");
            return;
        }

        caller.getScene().addEntity(new BossRocketAttack(x, y, Layers.bossAttack, target));
    }

    receiveAttack(caller: Collider, data: { other: Collider; result: unknown }, health: Health, bossPhase: BossPhase)
    {
        const other = data.other.getEntity();
        if (other instanceof TowerBeeAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                bossPhase.updatePhase(health.getPercentageRemaining());
                if (bossPhase.currentPhase === BossPhases.DEAD)
                {
                    // TODO Destroy the Boss? Death animation? Win screen?
                }
                console.log(bossPhase.currentPhase);
            }
        }
    }

    dropTiles(timeWindowMs: number, numberOfTiles: number, scene: Scene)
    {
        const tileManager = scene.getEntityWithName("tilemgr");

        if (tileManager)
        {
            const thig = tileManager.getComponent<TileDestroyer>(TileDestroyer);

            if (thig)
            {
                thig.removeRandomTilesOverTime(scene, timeWindowMs, numberOfTiles);
            }
        }
    }
}

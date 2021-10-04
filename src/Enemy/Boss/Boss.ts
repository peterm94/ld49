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
    Sprite,
    SpriteSheet,
    System,
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
import {BossPhase, BossPhases} from "./BossPhase";
import {EndScreen, LD49} from "../../LD49";
import {BossRocketExplosion} from "./BossRocketAttack";

const earIdle = new SpriteSheet(earIdleSprite, 196, 128);
const eyeBlink = new SpriteSheet(eyeBlinkSprite, 196, 128);
const eyeIdle = new SpriteSheet(eyeIdleSprite, 196, 128);
const mouthIdle = new SpriteSheet(mouthIdleSprite, 196, 128);
const mouthRoar = new SpriteSheet(mouthRoarSprite, 196, 128);

class FlashWhite extends Component
{
}

class FlashWhiteSystem extends System
{
    types = () => [AnimatedSpriteController, FlashWhite];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, sprite: AnimatedSpriteController, flashWhite: FlashWhite) => {

            sprite.applyConfig({filters: [Sprite.whiteFilter()]});
            entity.addComponent(new Timer(100, sprite, false)).onTrigger.register((caller, data) => {
                data.applyConfig({filters: []});
            });

            flashWhite.destroy();
        });
    }
}

export enum RoarAnimStates
{
    IDLE,
    START_ROAR,
    OPEN_ROAR,
    END_ROAR,
}

export class Boss extends Entity
{
    bearWinner = false;
    playerWinner = false;

    constructor(x: number, y: number)
    {
        super("boss", x, y, Layers.boss);
    }

    onAdded()
    {
        super.onAdded();
        const health = this.addComponent(new Health(35, 35));
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

        const mouth = this.addChild(new Entity("mouth", 0, 0, Layers.boss));

        const addRoarTimer = () => {
            let timeBetweenAttacks = 2_000;
            if (bossPhase.currentPhase === BossPhases.PHASE_2)
            {
                timeBetweenAttacks = MathUtil.randomRange(2_000, 8_000);
            }
            else if (bossPhase.currentPhase === BossPhases.PHASE_3)
            {
                timeBetweenAttacks = MathUtil.randomRange(2_000, 8_000);
            }
            else if (bossPhase.currentPhase === BossPhases.FINAL_PHASE)
            {
                timeBetweenAttacks = MathUtil.randomRange(3_000, 8_000);
            }
            mouth.addComponent(new Timer(timeBetweenAttacks, roarSpr, false)).onTrigger
                 .register((caller, data) => {
                     if (bossPhase.currentPhase <= BossPhases.PHASE_2 && bossPhase.currentPhase !== BossPhases.DEAD)
                     {
                         data.setAnimation(RoarAnimStates.START_ROAR);
                     }
                     else
                     {
                         addRoarTimer();
                     }
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

                        const bigRoar = bossPhase.currentPhase === BossPhases.FINAL_PHASE;
                        const roarLengthMs = bigRoar ? 4000 : 3000;
                        const roarIntensity = bigRoar ? 0.5 : 0.3;
                        let numberOfTiles = 20;// = bigRoar ? 40 : 15;

                        // Big difficulty shift for the final phase.
                        switch (bossPhase.currentPhase)
                        {
                            case BossPhases.FINAL_PHASE:
                                numberOfTiles = 40;
                                break;
                            case BossPhases.PHASE_3:
                                numberOfTiles = 30;
                                break;
                        }


                        // Pause the ears for the roar duration.
                        earsSpr.nextTriggerTime += 3000;
                        roarSpr.getEntity().addComponent(new ScreenShake(roarIntensity, roarLengthMs));
                        roarSpr.setAnimation(RoarAnimStates.OPEN_ROAR);

                        (this.scene.getEntityWithName("audio") as SoundManager)
                            .playSound((bigRoar) ? "bearRoar" : "bearRoarQuiet");

                        if (!this.playerWinner)
                        {
                            this.dropTiles(roarLengthMs, numberOfTiles, this.getScene());
                        }
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

        const addRocketTimer = () => {
            let timeBetweenAttacks = 5;
            if (bossPhase.currentPhase === BossPhases.PHASE_2)
            {
                timeBetweenAttacks = 3;
            }
            else if (bossPhase.currentPhase === BossPhases.PHASE_3)
            {
                timeBetweenAttacks = 2;
            }
            else if (bossPhase.currentPhase === BossPhases.FINAL_PHASE)
            {
                timeBetweenAttacks = 3;
            }
            this.addComponent(new Timer(timeBetweenAttacks * 1000, null)).onTrigger.register((caller) => {
                if (bossPhase.currentPhase <= BossPhases.PHASE_1 && bossPhase.currentPhase !== BossPhases.DEAD)
                {
                    // Amp up the difficulty when the boss's hp is low, double rockets!
                    if (bossPhase.currentPhase === BossPhases.FINAL_PHASE)
                    {
                        this.instantiateRocketAttack(caller, true);
                        this.instantiateRocketAttack(caller, false);
                    }
                    else
                    {
                        // Pick a random side.
                        const clawSide = Util.choose(true, false);
                        this.instantiateRocketAttack(caller, clawSide);
                    }
                }
                addRocketTimer();
            });
        };

        addRocketTimer();


        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem), {
                layer: Layers.boss,
                radius: 20
            }));

        collider.onTriggerEnter.register((c, d) => this.receiveAttack(c, d, health, bossPhase));

        this.getScene().addGUIEntity(new BossStatusDisplay(0, 30, health));
        this.getScene().addSystem(new FadeInSystem());
        this.getScene().addSystem(new FadeOutSystem());
        // this.getScene().addSystem(new FlashWhiteSystem());
    }

    instantiateRocketAttack(caller: Component, clawSide: boolean)
    {
        if (clawSide)
        {
            const x = MathUtil.randomRange(66, 122);
            const y = MathUtil.randomRange(17, 34);
            const tilt = ((x - 66) / (122 - 66)) * 0.45;
            caller.getScene().addEntity(new BearHand(x, y, false, tilt));
        }
        else
        {
            const x = MathUtil.randomRange(296, 360);
            const y = MathUtil.randomRange(22, 28);
            const tilt = ((x - 296) / (360 - 296)) * 0.45;
            caller.getScene().addEntity(new BearHand(x, y, true, -tilt));
        }
    }

    receiveAttack(caller: Collider, data: { other: Collider; result: unknown }, health: Health, bossPhase: BossPhase)
    {
        // No damage if bear wins and is taunting you.
        if (this.bearWinner || this.playerWinner)
        {
            return;
        }

        const other = data.other.getEntity();
        if (other instanceof TowerBeeAttack)
        {
            caller.getEntity().findChildWithName("ears")?.addComponent(new FlashWhite());
            caller.getEntity().findChildWithName("eyes")?.addComponent(new FlashWhite());
            caller.getEntity().findChildWithName("mouth")?.addComponent(new FlashWhite());

            this.getScene().addEntity(new BossRocketExplosion(other.transform.x, other.transform.y));

            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                bossPhase.updatePhase(health.getPercentageRemaining());
                if (bossPhase.currentPhase === BossPhases.DEAD)
                {
                    LD49.beeOver = true;
                    this.playerWinner = true;
                    // Stop in progress attacks
                    this.getComponentsOfType<Timer<null>>(Timer)?.forEach(x => x.destroy());

                    const mouth = this.findChildWithName("mouth");
                    mouth?.getComponentsOfType<Timer<AnimatedSpriteController>>(Timer)
                         ?.forEach(value => value.destroy());
                    mouth?.getComponent<AnimatedSpriteController>(AnimatedSpriteController)
                         ?.setAnimation(RoarAnimStates.START_ROAR);

                    const reduceAlpha = () => {
                        this.addComponent(new Timer(100, this)).onTrigger.register((caller1, data1) => {
                            data1.transform.alpha -= 0.03;
                            data1.transform.position.y += 0.7;
                            if (data1.transform.alpha < -0.5)
                            {
                                // TODO Destroy the Boss? Death animation?
                                Log.info("Boss is dead!");
                                const game = this.getScene().getGame();
                                this.getScene().entities.forEach(x => x.destroy());
                                this.getScene().systems.forEach(x => x.destroy());
                                this.getScene().globalSystems.forEach(x => x.destroy());
                                game.setScene(new EndScreen(game, true));
                            }
                            else
                            {
                                reduceAlpha();
                            }
                        });
                    };
                    reduceAlpha();
                }
            }
        }
    }

    dropTiles(timeWindowMs: number, numberOfTiles: number, scene: Scene)
    {
        const tileManager = scene.getEntityWithName("tilemgr");

        if (tileManager)
        {
            const thingDestroyer = tileManager.getComponent<TileDestroyer>(TileDestroyer);

            if (thingDestroyer)
            {
                thingDestroyer.removeRandomTilesOverTime(scene, timeWindowMs, numberOfTiles);
            }
        }
    }
}

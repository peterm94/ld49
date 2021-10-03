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
    SpriteSheet,
    Timer
} from "lagom-engine";
import {Health} from "../../Common/Health";
import {HealthBar} from "../../Common/HealthBar";
import {Layers} from "../../Layers";
import {TowerBeeAttack} from "../../Friendly/Tower/TowerBeeAttack";
import {Attack} from "../../Common/Attack";
import {BossRocketAttack} from "./BossRocketAttack";

import earIdleSprite from "../../Art/bear-sheets/ear-idle.png";
import eyeBlinkSprite from "../../Art/bear-sheets/eye-blink.png";
import eyeIdleSprite from "../../Art/bear-sheets/eye-idle.png";
import mouthIdleSprite from "../../Art/bear-sheets/mouth-idle.png";
import mouthRoarSprite from "../../Art/bear-sheets/mouth-roar.png";

const earIdle = new SpriteSheet(earIdleSprite, 196, 128);
const eyeBlink = new SpriteSheet(eyeBlinkSprite, 196, 128);
const eyeIdle = new SpriteSheet(eyeIdleSprite, 196, 128);
const mouthIdle = new SpriteSheet(mouthIdleSprite, 196, 128);
const mouthRoar = new SpriteSheet(mouthRoarSprite, 196, 128);

export class Boss extends Entity
{
    constructor(x: number, y: number)
    {
        super("boss", x, y, Layers.boss);
    }

    onAdded()
    {
        super.onAdded();

        const width = 196;
        const height = 128;

        const sheet = earIdle.textureSliceFromSheet();
        // Log.info(sheet);

        const earsSpr = this.addComponent(new AnimatedSpriteController(0, [
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

        const addBlinkTimer = () => {
            this.addComponent(new Timer(MathUtil.randomRange(2000, 10_000), eyesSpr, false)).onTrigger
                .register((caller, data) => {
                    data.setAnimation(1);
                });
        };


        const eyesSpr = this.addComponent(new AnimatedSpriteController(0, [
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

        const roarSpr = this.addComponent(new AnimatedSpriteController(RoarAnimStates.IDLE, [
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
                        roarSpr.setAnimation(RoarAnimStates.OPEN_ROAR);
                    }
                }
            },
            {
                id: RoarAnimStates.OPEN_ROAR,
                textures: mouthRoarOpen,
                config: {
                    animationEndAction: AnimationEnd.STOP,
                    animationEndEvent: () => {
                        this.addComponent(new Timer(3000, roarSpr)).onTrigger.register((caller, data) => {
                            data.setAnimation(RoarAnimStates.END_ROAR);
                        });
                        // TODO why can't I trigger it from END_ROAR? it gets stuck and has to catch up?
                        this.addComponent(new Timer(4000, roarSpr)).onTrigger.register((caller, data) => {
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

        const addRoarTimer = () => {
            this.addComponent(new Timer(MathUtil.randomRange(2000, 10_000), roarSpr, false)).onTrigger
                .register((caller, data) => {
                    data.setAnimation(1);
                });
        };

        addRoarTimer();

        const rocketAttackTimer = this.addComponent(new Timer(5 * 1000, null, true));
        rocketAttackTimer.onTrigger.register(this.instantiateRocketAttack);

        const health = this.addComponent(new Health(1000, 1000));

        // TODO Big health bar at the top of the screen instead?
        const healthBar = this.addChild(new HealthBar("boss_health", 0, 0, Layers.boss, 0, 0, 55));

        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem), {
                layer: Layers.boss,
                radius: 20
            }));

        collider.onTriggerEnter.register((c, d) => this.getAttacked(c, d, health, healthBar));
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

    getAttacked(caller: Collider, data: { other: Collider; result: unknown }, health: Health, healthBar: HealthBar)
    {
        const other = data.other.getEntity();
        if (other instanceof TowerBeeAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                healthBar.remainingHealthPercentage = health.getPercentageRemaining();
                if (health.isEmpty())
                {
                    // TODO Destroy the tower? Maybe a system listener instead since we need to replace with a
                    //  destroyed tower instead?
                }
            }
        }
    }
}

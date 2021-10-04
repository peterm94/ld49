import {AnimatedSpriteController, AnimationEnd, Component, Entity, Log, SpriteSheet, System} from "lagom-engine";
import handSprite from "../../Art/bear-paw.png";
import {BossRocketAttack} from "./BossRocketAttack";
import {Layers} from "../../Layers";
import {SoundManager} from "../../SoundManager/SoundManager";

const bearHands = new SpriteSheet(handSprite, 64, 64);


export class BearHand extends Entity
{
    constructor(x: number, y: number, readonly flipped: boolean, readonly angle: number)
    {
        super("hand", x, y);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSpriteController(1, [
            {
                id: 1,
                textures: bearHands.textureSliceFromSheet(),
                config: {
                    xAnchor: 0.5, yAnchor: 0.5, animationSpeed: 100, animationEndAction: AnimationEnd.STOP, alpha: 0,
                    xScale: this.flipped ? -1 : 1, rotation: -this.angle
                },
                events: {
                    9: () => {

                        const x = this.transform.position.x;
                        const y = this.transform.position.y;

                        const target = this.getScene().getEntityWithName("player");
                        if (!target)
                        {
                            Log.error("Tried to target the Player for a Boss attack, but nothing could be found.");
                            return;
                        }

                        this.getScene().addEntity(new BossRocketAttack(x + 1, y + 5, Layers.bossAttack, target));
                    },
                    17: () => {
                        this.addComponent(new FadeOut(0, 1));
                    }
                }
            }]));

        this.addComponent(new FadeIn(1, 1));
        (this.scene.getEntityWithName("audio") as SoundManager).playSound("pawEffect");
    }
}


class FadeIn extends Component
{
    constructor(readonly target: number, readonly speed: number)
    {
        super();
    }
}


class FadeOut extends Component
{
    constructor(readonly target: number, readonly speed: number)
    {
        super();
    }
}


export class FadeInSystem extends System
{
    types = () => [FadeIn, AnimatedSpriteController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, fade: FadeIn, sprite: AnimatedSpriteController) => {
            const curr = sprite.sprite!.pixiObj.alpha;
            const newAlpha = curr + fade.speed * delta / 1000;

            if (newAlpha >= fade.target)
            {
                fade.destroy();
            }
            sprite.applyConfig({alpha: newAlpha});
        });
    }
}

export class FadeOutSystem extends System
{
    types = () => [FadeOut, AnimatedSpriteController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, fade: FadeOut, sprite: AnimatedSpriteController) => {
            const curr = sprite.sprite!.pixiObj.alpha;
            const newAlpha = curr - fade.speed * delta / 1000;

            sprite.applyConfig({alpha: newAlpha});

            if (newAlpha <= fade.target)
            {
                entity.destroy();
            }
        });
    }
}

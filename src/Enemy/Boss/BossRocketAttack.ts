import {
    AnimatedSprite,
    CollisionSystem,
    Entity,
    MathUtil,
    RectCollider,
    RenderRect,
    SpriteSheet,
    Timer
} from "lagom-engine";
import {Attack} from "../../Common/Attack";
import {Layers} from "../../Layers";
import {AttackMovement} from "../../Common/AttackMovement";
import bearRocketSprite from "../../Art/bear-rocket.png";

const rocket = new SpriteSheet(bearRocketSprite, 32, 32);

export class BossRocketAttack extends Entity
{
    constructor(x: number, y: number, z: number, private target: Entity)
    {
        super("bossRocketAttack", x, y, z);
    }

    onAdded()
    {
        super.onAdded();

        const damage = 1;
        const speed = 100;
        const lifeDurationSec = 3;

        // TODO pointDirection is backwards in library
        const targetDir = -MathUtil.pointDirection(this.transform.getGlobalPosition().x,
            this.transform.getGlobalPosition().y,
            this.target.transform.getGlobalPosition().x, this.target.transform.getGlobalPosition().y);

        this.addComponent(new AnimatedSprite(rocket.textureSliceFromRow(0, 0, 3),
                         {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: 90, rotation: targetDir + MathUtil.degToRad(270)}));
        this.addComponent(new Attack(damage));
        this.addComponent(
            new AttackMovement(
                // TODO: This shouldn't be negative, bug?
                -MathUtil.pointDirection(this.transform.getGlobalPosition().x, this.transform.getGlobalPosition().y,
                    this.target.transform.getGlobalPosition().x, this.target.transform.getGlobalPosition().y),
                speed));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.bossAttack,
                    height: 5, width: 5
                }));

        const endOfLife = this.addComponent(new Timer(lifeDurationSec * 1000, null));

        endOfLife.onTrigger.register((caller) => {
            caller.getEntity().destroy();
        });
    }
}

import {AnimatedSprite, CircleCollider, CollisionSystem, Entity, MathUtil, SpriteSheet, Timer} from "lagom-engine";
import {Attack} from "../../Common/Attack";
import {AttackMovement} from "../../Common/AttackMovement";
import {Layers} from "../../Layers";
import killerBeeSpr from "../../Art/killer-bee.png";

const killerBee = new SpriteSheet(killerBeeSpr, 5, 5);

export class TowerBeeAttack extends Entity
{
    constructor(x: number, y: number, z: number, private target: Entity)
    {
        super("towerBeeAttack", x, y, z);
    }

    onAdded()
    {
        super.onAdded();

        const damage = 1;
        const speed = 100;
        const lifeDurationSec = 10;

        // TODO pointDirection is backwards in library
        const targetDir = -MathUtil.pointDirection(this.transform.getGlobalPosition().x,
            this.transform.getGlobalPosition().y,
            this.target.transform.getGlobalPosition().x, this.target.transform.getGlobalPosition().y);

        this.addComponent(new AnimatedSprite(killerBee.textureSliceFromRow(0, 0, 1),
            {yAnchor: 0.5, xAnchor: 0.5, animationSpeed: 150, rotation: targetDir + MathUtil.degToRad(90)}));
        this.addComponent(new Attack(damage));
        this.addComponent(
            new AttackMovement(targetDir, speed));

        this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {layer: Layers.towerAttack, radius: 3}));

        // We shouldn't need this since it's attacking the boss, but just in case.
        const endOfLife = this.addComponent(new Timer(lifeDurationSec * 1000, null));

        endOfLife.onTrigger.register((caller) => {
            caller.getEntity().destroy();
        });
    }
}

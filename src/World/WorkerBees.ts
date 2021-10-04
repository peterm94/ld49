import killerBeeSpr from "../Art/killer-bee.png";
import {AnimatedSprite, Component, Entity, MathUtil, SpriteSheet, System, Timer, Util} from "lagom-engine";

const killerBee = new SpriteSheet(killerBeeSpr, 5, 5);

export class BackgroundBees extends Entity
{
    spawnBee()
    {
        this.addComponent(new Timer(MathUtil.randomRange(5000, 4000), null, false)).onTrigger
            .register((caller, data) => {
                const bee = this.addChild(new Entity("bgbeeee", Util.choose(-20, 450), MathUtil.randomRange(88, 240)));
                bee.addComponent(new AnimatedSprite(killerBee.textureSliceFromRow(0, 0, 1),
                    {
                        yAnchor: 0.5, xAnchor: 0.5, animationSpeed: 50,
                        rotation: bee.transform.position.x > 0 ? MathUtil.degToRad(270) : MathUtil.degToRad(90)
                    }));
                bee.addComponent(new BgBee(bee.transform.position.x > 0 ? -1 : 1, MathUtil.randomRange(50, 200)));
                this.spawnBee();
            });
    }

    constructor()
    {
        super("bgbee", 0, 0, -99999999);
    }

    onAdded()
    {
        super.onAdded();

        this.spawnBee();

        this.getScene().addSystem(new BeeMover());
    }
}

class BgBee extends Component
{
    constructor(readonly dir: number, readonly speed: number)
    {
        super();
    }
}

class BeeMover extends System
{
    types = () => [BgBee];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, bee: BgBee) => {
            entity.transform.position.x += bee.dir * bee.speed * delta / 1000;

            if (entity.transform.position.x < -100 || entity.transform.position.x > 1000)
            {
                entity.destroy();
            }
        });
    }
}

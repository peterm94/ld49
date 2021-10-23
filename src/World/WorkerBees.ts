import {AnimatedSprite, Component, Entity, MathUtil, System, Timer, Util} from "lagom-engine";
import {Layers} from "../Layers";


export class BackgroundBees extends Entity
{
    spawnBee()
    {
        this.addComponent(new Timer(MathUtil.randomRange(200, 600), null, false)).onTrigger
            .register((caller, data) => {
                const bee = this.addChild(new Entity("bgbeeee", Util.choose(-20, 450), MathUtil.randomRange(0, 240)));
                bee.addComponent(new AnimatedSprite(this.scene.game.getResource("bgBee").textureSliceFromRow(0, 0, 1),
                    {
                        yAnchor: 0.5, xAnchor: 0.5, animationSpeed: 50,
                        yScale: bee.transform.position.x > 0 ? -1 : 1,
                        rotation: MathUtil.degToRad(90)
                    }));
                bee.addComponent(new BgBee(bee.transform.position.x > 0 ? -1 : 1, MathUtil.randomRange(50, 200)));
                this.spawnBee();
            });
    }

    constructor()
    {
        super("bgbee", 0, 0, Layers.bgbees);
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

class BeeMover extends System<[BgBee]>
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

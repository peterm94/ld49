import killerBeeSpr from "../Art/killer-bee.png";
import {AnimatedSprite, Component, Entity, MathUtil, SpriteSheet, System, Timer, Util, Vector} from "lagom-engine";

const killerBee = new SpriteSheet(killerBeeSpr, 5, 5);

export class BackgroundBees extends Entity
{
    constructor()
    {
        super("bgbee", 0, 0, -99999999);
    }

    spawnBee()
    {
        const minSpawnTimeMs = 0;
        const maxSpawnTimeMs = 1_000;
        this.addComponent(new Timer(MathUtil.randomRange(minSpawnTimeMs, maxSpawnTimeMs), null, false)).onTrigger
            .register((caller, data) => {
                const bee = this.addChild(new Entity("bgbeeee", Util.choose(-20, 450), MathUtil.randomRange(88, 240)));
                bee.addComponent(new AnimatedSprite(killerBee.textureSliceFromRow(0, 0, 1),
                    {
                        yAnchor: 0.5, xAnchor: 0.5, animationSpeed: 50,
                        rotation: bee.transform.position.x > 0 ? MathUtil.degToRad(270) : MathUtil.degToRad(90)
                    }));
                const beeTarget = new Vector(bee.transform.position.x > 0 ? -1 : 1,
                    MathUtil.randomRange(-1, 2));
                bee.addComponent(new BgBee(beeTarget, MathUtil.randomRange(50, 200)));
                this.spawnBee();
            });
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
    constructor(readonly dir: Vector, readonly speed: number)
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
            entity.transform.position.x += bee.dir.x * bee.speed * delta / 1000;
            entity.transform.position.y += bee.dir.y * bee.speed * delta / 1000;

            if (entity.transform.position.x < -100 || entity.transform.position.x > 1000)
            {
                entity.destroy();
            }
        });
    }
}

import {AnimatedSpriteController, AnimationEnd, Component, Entity, Log, SpriteSheet, System} from "lagom-engine";
import beeAltSprite from "../Art/bee-alt.png";

const bee = new SpriteSheet(beeAltSprite, 64, 64);

export class HealthStatusDisplay extends Entity
{
    constructor(x: number, y: number)
    {
        super("healthStatusDisplay", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new HealthStatus());
        this.addChild(new HealthGUIEntry("healthGUI", 0, 0));
        this.addChild(new HealthGUIEntry("healthGUI", 0, 32));
        this.addChild(new HealthGUIEntry("healthGUI", 0, 64));

        this.getScene().addSystem(new HealthStatusUpdater());
    }
}

class HealthGUIEntry extends Entity
{
    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: bee.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                    alpha: 0.25
                }
            },
            {
                id: 1,
                textures: bee.textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 60,
                    xAnchor: 0.5,
                    yAnchor: 0.5,
                    alpha: 1,
                }
            }
        ]));

        spr.setAnimation(1);
    }
}

export class HealthStatus extends Component
{
    constructor(public currentHealth: number = 0, public maxHealth: number = 0)
    {
        super();
    }
}

class HealthStatusUpdater extends System<[HealthStatus]>
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, healthStatus: HealthStatus) => {
            if (!(entity instanceof HealthStatusDisplay))
            {
                return;
            }

            // Get the Guis back to front so that we can empty them from the end backward.
            const healthGuis = entity.children.filter(child => child.name === "healthGUI");
            for (let guiId = 0; guiId < healthStatus.maxHealth; guiId++)
            {
                const healthGui = healthGuis[guiId];
                if (!healthGui)
                {
                    Log.error("Tried to find a health gui to update but none exist");
                    return;
                }

                const guiSprite = healthGui.getComponent<AnimatedSpriteController>(AnimatedSpriteController);
                if (guiSprite)
                {
                    if (guiId < healthStatus.currentHealth)
                    {
                        guiSprite.setAnimation(1);
                    }
                    else
                    {
                        guiSprite.setAnimation(0);
                    }

                }
            }
        });
    }

    types = () => [HealthStatus];
}

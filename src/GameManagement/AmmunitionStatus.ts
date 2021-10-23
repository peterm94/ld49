import {AnimatedSpriteController, AnimationEnd, Component, Entity, Log, System} from "lagom-engine";


export class AmmunitionStatusDisplay extends Entity
{
    constructor(x: number, y: number)
    {
        super("ammunitionStatusDisplay", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new AmmunitionStatus());
        this.addChild(new AmmunitionGUIEntry("ammunitionGUI", 0, 0));
        this.addChild(new AmmunitionGUIEntry("ammunitionGUI", -24, -15));
        this.addChild(new AmmunitionGUIEntry("ammunitionGUI", 0, -31));

        this.getScene().addSystem(new AmmunitionStatusUpdater());
    }
}

class AmmunitionGUIEntry extends Entity
{
    onAdded()
    {
        super.onAdded();

        const spr = this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: this.scene.game.getResource("ammoHexEmpty").textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 200,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                }
            },
            {
                id: 1,
                textures: this.scene.game.getResource("ammoHexFull").textureSliceFromSheet(),
                config: {
                    animationEndAction: AnimationEnd.LOOP,
                    animationSpeed: 60,
                    xAnchor: 0.5,
                    yAnchor: 0.5,
                }
            }
        ]));

        spr.setAnimation(0);
    }
}

export class AmmunitionStatus extends Component
{
    constructor(public currentAmmo: number = 0, public maxAmmo: number = 0)
    {
        super();
    }
}

export class AmmunitionStatusUpdater extends System<[AmmunitionStatus]>
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, ammunitionStatus: AmmunitionStatus) => {
            if (!(entity instanceof AmmunitionStatusDisplay))
            {
                return;
            }

            const ammoGuis = entity.children.filter(child => child.name === "ammunitionGUI");
            for (let guiId = 0; guiId < ammunitionStatus.maxAmmo; guiId++)
            {
                const ammoGui = ammoGuis[guiId];
                if (!ammoGui)
                {
                    Log.error("Tried to find an ammo gui to update but none exist");
                    return;
                }

                const guiSprite = ammoGui.getComponent<AnimatedSpriteController>(AnimatedSpriteController);
                if (guiSprite)
                {
                    if (guiId < ammunitionStatus.currentAmmo)
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

    types = () => [AmmunitionStatus];
}

import {
    CircleCollider,
    CollisionSystem,
    Component,
    Entity,
    Game,
    Key,
    RenderCircle,
    Sprite,
    SpriteSheet,
    System,
    Vector
} from "lagom-engine";
import {Layers} from "../Layers";
import {AmmunitionPickup} from "../Pickups/AmmunitionPickup";
import {Ammunition} from "../Common/Ammunition";
import {PickupCount} from "../Pickups/Pickup";
import {GameStatus} from "../GameManagement/GameStatus";
import beeSprite from '../Art/bee.png';

const bee = new SpriteSheet(beeSprite, 64, 64);

export class Player extends Entity
{
    constructor(x: number, y: number)
    {
        super("player", x, y, Layers.player);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new PlayerControlled(Key.KeyW, Key.KeyS, Key.KeyA, Key.KeyD));
        this.addComponent(new Sprite(bee.textureFromIndex(0), {xAnchor: 0.5, yAnchor: 0.5}));
        const ammunition = this.addComponent(new Ammunition(100, 0));

        const collider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.player,
                    radius: 1,
                    yOff: 5
                }));

        this.addComponent(new RenderCircle(0, 5, 2, 0xFF0000));
        collider.onTriggerEnter.register((caller, data) => {
            const other = data.other.getEntity();
            if (other instanceof AmmunitionPickup)
            {
                const pickupDetails = other.getComponent<PickupCount>(PickupCount);
                if (pickupDetails)
                {
                    ammunition.addAmmo(pickupDetails.amount);
                    other.destroy();

                    // Update the scoreboard.
                    const gameStatusDisplay = this.getScene().getEntityWithName("gameStatusDisplay");
                    if (gameStatusDisplay)
                    {
                        const gameStatus = gameStatusDisplay.getComponent<GameStatus>(GameStatus);
                        if (gameStatus)
                        {
                            gameStatus.ammunition = ammunition.getCurrentAmmo();
                        }
                    }
                }
            }
        });
    }
}

export class PlayerControlled extends Component
{
    constructor(public upKey: Key, public downKey: Key, public leftKey: Key, public rightKey: Key)
    {
        super();
    }
}

export class PlayerMover extends System
{
    private readonly moveSpeed = 70;
    private readonly hexagonHeightRatio = 25 / 32;

    types = () => [PlayerControlled];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, playerControlled: PlayerControlled) => {
            const newPosition = new Vector(0, 0);
            if (Game.keyboard.isKeyDown(playerControlled.upKey))
            {
                newPosition.y -= this.hexagonHeightRatio;
            }
            if (Game.keyboard.isKeyDown(playerControlled.downKey))
            {
                newPosition.y += this.hexagonHeightRatio;
            }

            if (Game.keyboard.isKeyDown(playerControlled.leftKey))
            {
                newPosition.x -= 1;
            }
            if (Game.keyboard.isKeyDown(playerControlled.rightKey))
            {
                newPosition.x += 1;
            }

            if (newPosition.x !== 0 && newPosition.y !== 0)
            {
                newPosition.multiply(0.707);
            }

            newPosition.multiply(this.moveSpeed * delta / 1000);
            entity.transform.position.x += newPosition.x;
            entity.transform.position.y += newPosition.y;
        });
    }
}

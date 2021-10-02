import {CollisionSystem, Component, Entity, Game, Key, RectCollider, RenderRect, System, Vector} from "lagom-engine";
import {Layers} from "../Layers";
import {AmmunitionPickup} from "../Pickups/AmmunitionPickup";
import {Ammunition} from "../Common/Ammunition";
import {PickupCount} from "../Pickups/Pickup";
import {GameStatus} from "../GameManagement/GameStatus";

export class Player extends Entity
{
    private static width = 10;
    private static height = 20;

    constructor(x: number, y: number)
    {
        super("player", x, y, Layers.player);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new PlayerControlled(Key.KeyW, Key.KeyS, Key.KeyA, Key.KeyD));
        this.addComponent(new RenderRect(0, 0, Player.width, Player.height, 0xffffff, 0xffffff));
        const ammunition = this.addComponent(new Ammunition(100, 0));

        const playerCollider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.player,
                    height: Player.height, width: Player.width
                }));

        playerCollider.onTriggerEnter.register((caller, data) => {
            const entity = data.other.getEntity();
            if (entity instanceof AmmunitionPickup)
            {
                const pickupDetails = entity.getComponent<PickupCount>(PickupCount);
                if (pickupDetails)
                {
                    ammunition.addAmmo(pickupDetails.amount);
                    entity.destroy();

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
    private readonly moveSpeed = 50;

    types = () => [PlayerControlled];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity,
                            playerControlled: PlayerControlled) => {
            const newPosition = new Vector(0, 0);
            if (Game.keyboard.isKeyDown(playerControlled.upKey))
            {
                newPosition.y += -1;
            }
            if (Game.keyboard.isKeyDown(playerControlled.downKey))
            {
                newPosition.y += 1;
            }

            if (Game.keyboard.isKeyDown(playerControlled.leftKey))
            {
                newPosition.x += -1;
            }
            if (Game.keyboard.isKeyDown(playerControlled.rightKey))
            {
                newPosition.x += 1;
            }

            newPosition.normalize().multiply(this.moveSpeed * delta / 1000);
            entity.transform.position.x += newPosition.x;
            entity.transform.position.y += newPosition.y;
        });
    }
}

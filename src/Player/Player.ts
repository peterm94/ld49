import {
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Game,
    Key,
    RectCollider,
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
import {Health} from "../Common/Health";
import {Attack} from "../Common/Attack";
import {BossRocketAttack} from "../Enemy/Boss/BossRocketAttack";

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

        this.addComponent(new PlayerController(Key.KeyW, Key.KeyS, Key.KeyA, Key.KeyD));
        this.addComponent(new Sprite(bee.textureFromIndex(0), {xAnchor: 0.5, yAnchor: 0.5}));
        const health = this.addComponent(new Health(3, 3));
        const ammunition = this.addComponent(new Ammunition(100, 0));

        // Handle moving into things.
        const movementCollider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.player,
                    radius: 1,
                    yOff: 5
                }));

        movementCollider.onTriggerEnter.register((c, d) => this.registerPickup(c, d, ammunition));

        // Handle getting hit.
        const spriteWidth = 10;
        const spriteHeight = 16;
        const hitCollider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.player,
                    xOff: -(spriteWidth / 2),
                    yOff: -(spriteHeight / 2),
                    height: spriteHeight,
                    width: spriteWidth,
                })
        );


        hitCollider.onTriggerEnter.register((c, d) => this.registerHit(c, d, health));
    }

    registerPickup(caller: Collider, data: { other: Collider, result: unknown }, ammunition: Ammunition)
    {
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
    }

    registerHit(caller: Collider, data: { other: Collider, result: unknown }, health: Health)
    {
        const other = data.other.getEntity();
        if (other instanceof BossRocketAttack)
        {
            const attackDetails = other.getComponent<Attack>(Attack);
            if (attackDetails)
            {
                health.removeHealth(attackDetails.getDamage());
                other.destroy();

                // Update the scoreboard.
                const gameStatusDisplay = this.getScene().getEntityWithName("gameStatusDisplay");
                if (gameStatusDisplay)
                {
                    const gameStatus = gameStatusDisplay.getComponent<GameStatus>(GameStatus);
                    if (gameStatus)
                    {
                        gameStatus.playerHealth = health.getHealth();
                    }
                }
            }
        }
    }
}

export class PlayerController extends Component
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

    types = () => [PlayerController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, playerController: PlayerController) => {
            const newPosition = new Vector(0, 0);
            if (Game.keyboard.isKeyDown(playerController.upKey))
            {
                newPosition.y -= this.hexagonHeightRatio;
            }
            if (Game.keyboard.isKeyDown(playerController.downKey))
            {
                newPosition.y += this.hexagonHeightRatio;
            }

            if (Game.keyboard.isKeyDown(playerController.leftKey))
            {
                newPosition.x -= 1;
            }
            if (Game.keyboard.isKeyDown(playerController.rightKey))
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

import {
    AnimatedSprite, AnimatedSpriteController, AnimationEnd,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Game,
    Key, Log,
    RectCollider,
    RenderCircle,
    Sprite,
    SpriteSheet,
    System,
    Util,
    Vector
} from "lagom-engine";
import {Layers} from "../Layers";
import {AmmunitionPickup} from "../Pickups/AmmunitionPickup";
import {Ammunition} from "../Common/Ammunition";
import {PickupCount} from "../Pickups/Pickup";
import {GameStatus} from "../GameManagement/GameStatus";
import beeSprite from '../Art/bee.png';
import beeMoveSprite from '../Art/bee-move.png';
import {Health} from "../Common/Health";
import {Attack} from "../Common/Attack";
import {BossRocketAttack} from "../Enemy/Boss/BossRocketAttack";

const bee = new SpriteSheet(beeSprite, 64, 64);
const bee_move = new SpriteSheet(beeMoveSprite, 64, 64);

export class Player extends Entity
{
    initialX: number;
    initialY: number;
    constructor(x: number, y: number)
    {
        super("player", x, y, Layers.player);
        this.initialX = x;
        this.initialY = y;
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new AnimatedSpriteController(0, [
            {
                id: 0,
                textures: bee.textureSliceFromRow(0, 0, 3),
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: 60}

            },
            {
                id: 1,
                textures: bee_move.textureSliceFromRow(0, 0, 1),
                config: {xAnchor: 0.5, yAnchor: 0.5, animationSpeed: 60}

            }
        ]));
        this.addComponent(new PlayerController(Key.KeyW, Key.KeyS, Key.KeyA, Key.KeyD));

        const health = this.addComponent(new Health(3, 3));
        const ammunition = this.addComponent(new Ammunition(100, 0));

        // Handle moving into things.
        const movementCollider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.playerGround,
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

    types = () => [PlayerController, AnimatedSpriteController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, playerController: PlayerController, spr: AnimatedSpriteController) => {
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

            if (newPosition.x != 0 || newPosition.y != 0) {

                spr.setAnimation(1);
            }
            else
            {
                spr.setAnimation(0);
            }

            newPosition.multiply(this.moveSpeed * delta / 1000);
            entity.transform.position.x += newPosition.x;
            entity.transform.position.y += newPosition.y;
        });
    }
}


export class PlayerFalling extends Component
{
    depth: number;
    constructor(depth: number)
    {
        super();
        this.depth = depth;
    }
}

export class PlayerDropper extends System
{
    types = () => [PlayerFalling];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, playerFalling: PlayerFalling) => 
        {
            entity.transform.position.y += 100 * (delta / 1000);
            // TODO get player going under the tile
            // entity.depth = playerFalling.depth;
        });
    }
}

export class PlayerResetter extends System
{
    types = () => [PlayerFalling];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, playerFalling: PlayerFalling) => 
        {
            // TODO there's gotta be a way to read this from the gam
            if (entity.transform.position.y < 430)
            {
                // Not fallen far enough yet
                return;
            }
            const falling = entity.getComponent<PlayerFalling>(PlayerFalling);
            if (falling)
            {
                entity.removeComponent(falling, true);
                const worldgen = entity.getScene().getEntityWithName("worldgen");
                if (worldgen)
                {
                    const allTiles = worldgen.children.filter(entity => entity.name == "tile");
                    const spawnTilePosition = Util.choose(...allTiles).transform.getGlobalPosition();

                    entity.transform.x = spawnTilePosition.x;
                    entity.transform.y = spawnTilePosition.y;
                    // entity.depth = Layers.player;
                }

            }
        });
    }
}

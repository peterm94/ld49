import {
    AnimatedSpriteController,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
    Game,
    Key,
    Log,
    RectCollider,
    SpriteSheet,
    System,
    Util,
    Vector
} from "lagom-engine";
import {Layers} from "../Layers";
import {AmmunitionPickup} from "../Pickups/AmmunitionPickup";
import {Ammunition} from "../Common/Ammunition";
import {PickupCount} from "../Pickups/Pickup";
import beeSprite from '../Art/bee.png';
import beeMoveSprite from '../Art/bee-movie.png';
import {Health} from "../Common/Health";
import {Attack} from "../Common/Attack";
import {BossRocketAttack, BossRocketExplosion} from "../Enemy/Boss/BossRocketAttack";
import {screenHeight, screenWidth} from "../LD49";
import {Tower} from "../Friendly/Tower/Tower";
import {AmmunitionStatus} from "../GameManagement/AmmunitionStatus";
import {HealthStatus} from "../GameManagement/HealthStatus";
import endScreenImg from "../Art/splash/game-over.png";

const bee = new SpriteSheet(beeSprite, 64, 64);
const bee_move = new SpriteSheet(beeMoveSprite, 64, 64);
const endScreen = new SpriteSheet(endScreenImg, screenWidth, screenHeight);

export class GroundCount extends Component
{
    constructor(public groundCount: number)
    {
        super();
    }
}

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
        const maxHealth = 3;
        const maxAmmo = 3;

        this.addComponent(new GroundCount(0));
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
        this.addComponent(new PlayerController());

        const health = this.addComponent(new Health(maxHealth, maxHealth));
        const ammunition = this.addComponent(new Ammunition(maxAmmo, 0));

        // Update the scoreboard.
        const ammunitionStatusDisplay = this.getScene().getEntityWithName("ammunitionStatusDisplay");
        if (ammunitionStatusDisplay)
        {
            const ammunitionStatus = ammunitionStatusDisplay.getComponent<AmmunitionStatus>(AmmunitionStatus);
            if (ammunitionStatus)
            {
                ammunitionStatus.currentAmmo = ammunition.getCurrentAmmo();
                ammunitionStatus.maxAmmo = ammunition.maxAmmo;
            }
        }

        const healthStatusDisplay = this.getScene().getEntityWithName("healthStatusDisplay");
        if (healthStatusDisplay)
        {
            const healthStatus = healthStatusDisplay.getComponent<HealthStatus>(HealthStatus);
            if (healthStatus)
            {
                healthStatus.currentHealth = health.getCurrentHealth();
                healthStatus.maxHealth = health.getMaxHealth();
            }
        }

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
        if (caller.getEntity().getComponent(PlayerFalling))
        {
            // Player is falling, no honey
            return;
        }
        const other = data.other.getEntity();
        if (other instanceof AmmunitionPickup)
        {
            const pickupDetails = other.getComponent<PickupCount>(PickupCount);
            if (pickupDetails)
            {
                ammunition.addAmmo(pickupDetails.amount);
                other.destroy();

                // Update the scoreboard.
                const ammunitionStatusDisplay = this.getScene().getEntityWithName("ammunitionStatusDisplay");
                if (ammunitionStatusDisplay)
                {
                    const ammunitionStatus = ammunitionStatusDisplay.getComponent<AmmunitionStatus>(AmmunitionStatus);
                    if (ammunitionStatus)
                    {
                        ammunitionStatus.currentAmmo = ammunition.getCurrentAmmo();
                        ammunitionStatus.maxAmmo = ammunition.maxAmmo;
                    }
                }
            }
        }
    }

    registerTowerReload(collider: Collider, data: { other: Collider, result: unknown }, ammunition: Ammunition)
    {
        const other = data.other.getEntity();
        if (other instanceof Tower)
        {
            const towerAmmunition = other.getComponent<Ammunition>(Ammunition);
            if (towerAmmunition)
            {
                const ammoUsed = towerAmmunition.addAmmo(ammunition.getCurrentAmmo());
                ammunition.removeAmmo(ammoUsed);
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
                other.destroy();
                this.getScene().addEntity(new BossRocketExplosion(this.transform.x, this.transform.y));

                this.receiveDamage(attackDetails.getDamage(), health);
            }
        }
    }

    public receiveDamage(damage: number, health: Health)
    {
        health.removeHealth(damage);

        // Update the scoreboard.
        const healthStatusDisplay = this.getScene().getEntityWithName("healthStatusDisplay");
        if (healthStatusDisplay)
        {
            const healthStatus = healthStatusDisplay.getComponent<HealthStatus>(HealthStatus);
            if (healthStatus)
            {
                healthStatus.currentHealth = health.getCurrentHealth();
                healthStatus.maxHealth = health.getMaxHealth();
            }
        }

        if (health.getCurrentHealth() == 0)
        {
            Log.error("DEAD");
            // this.getScene().addGUIEntity(new ScreenCard(endScreen,1));
        }
    }
}

export class PlayerController extends Component
{
    public upKey = Key.KeyW;
    public downKey = Key.KeyS;
    public leftKey = Key.KeyA;
    public rightKey = Key.KeyD;
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

            if (newPosition.x != 0 || newPosition.y != 0)
            {

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
            entity.transform.position.y += 200 * (delta / 1000);
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
            // TODO there's gotta be a way to read this from the game
            if (entity.transform.position.y < screenHeight + 40)
            {
                // Not fallen far enough yet
                return;
            }
            const falling = entity.getComponent<PlayerFalling>(PlayerFalling);
            if (falling)
            {
                entity.removeComponent(falling, true);
                entity.depth = Layers.player;
                entity.addComponent(new PlayerController());
                const playerSpawns = entity.getScene().entities.filter(entity => entity.name === "player_spawn");
                if (playerSpawns.length)
                {
                    const spawnPoint = Util.choose(...playerSpawns).transform.getGlobalPosition();

                    entity.transform.x = spawnPoint.x;
                    entity.transform.y = spawnPoint.y;
                    // entity.depth = Layers.player;
                }
                else
                {
                    Log.error("Tried to respawn a player but no spawn points exist.");
                }

            }
        });
    }
}

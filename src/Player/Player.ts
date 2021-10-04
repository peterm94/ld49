import {
    AnimatedSpriteController,
    CircleCollider,
    Collider,
    CollisionSystem,
    Component,
    Entity,
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
import {PickupCount} from "../Pickups/PickupCount";
import beeSprite from '../Art/bee.png';
import beeMoveSprite from '../Art/bee-movie.png';
import {Health} from "../Common/Health";
import {Attack} from "../Common/Attack";
import {BossRocketAttack, BossRocketExplosion} from "../Enemy/Boss/BossRocketAttack";
import {EndScreen, LD49, screenHeight} from "../LD49";
import {Tower} from "../Friendly/Tower/Tower";
import {AmmunitionStatus} from "../GameManagement/AmmunitionStatus";
import {HealthStatus} from "../GameManagement/HealthStatus";
import {SoundManager} from "../SoundManager/SoundManager";
import {HealthPickup} from "../Pickups/HealthPickup";
import {pressedKeys} from "../index";

const bee = new SpriteSheet(beeSprite, 64, 64);
const bee_move = new SpriteSheet(beeMoveSprite, 64, 64);

export class GroundCount extends Component
{
    frames = 0;

    constructor(public groundCount: number, public layer: number, public grounds: Entity[] = [])
    {
        super();
    }
}

class AmIInTheAir extends System
{
    types = () => [GroundCount, PlayerController];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, gc: GroundCount) => {
            if (gc.grounds.length > 0)
            {
                gc.frames = 0;
                return;
            }
            gc.frames++;

            if (gc.frames > 1)
            {
                gc.frames = 0;
                this.fall(entity as Player, gc);
            }
        });
    }

    fall(player: Player, gc: GroundCount)
    {
        (this.scene.getEntityWithName("audio") as SoundManager).playSound("fallThroughFloor");
        player.addComponent(new PlayerFalling(gc.layer));
        player.depth = Layers.playerFalling;
        const controller = player.getComponent(PlayerController);
        if (controller)
        {
            player.removeComponent(controller, true);
        }
        const playerHealth = player.getComponent<Health>(Health);
        if (playerHealth)
        {
            player.receiveDamage(1, playerHealth);
        }
        const playerAmmo = player.getComponent<Ammunition>(Ammunition);
        if (playerAmmo)
        {
            player.removeAmmo(playerAmmo.getCurrentAmmo(), playerAmmo);
        }
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

        this.addComponent(new GroundCount(0, 0));
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
        this.updatePlayerAmmoGUI(ammunition);
        this.updatePlayerHealthGUI(health);
        this.getScene().addSystem(new AmIInTheAir());
        // this.addComponent(new RenderCircle(0, 4, 1, 0xFF0000));

        // Handle moving into things.
        const movementCollider = this.addComponent(
            new CircleCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                {
                    layer: Layers.playerGround,
                    radius: 1,
                    yOff: 4
                }));

        movementCollider.onTriggerEnter.register((c, d) => this.registerPickup(c, d, ammunition, health));

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

    registerPickup(caller: Collider, data: { other: Collider, result: unknown }, ammunition: Ammunition, health: Health)
    {
        if (caller.getEntity().getComponent(PlayerFalling))
        {
            // Player is falling, pickups disabled.
            return;
        }
        const other = data.other.getEntity();
        const pickupDetails = other.getComponent<PickupCount>(PickupCount);
        if (!pickupDetails)
        {
            // No details about the pickup, can't do anything.
            return;
        }

        if (other instanceof AmmunitionPickup)
        {
            if (ammunition.isFull())
            {
                // Can't pick up ammo if we're already full.
                return;
            }

            other.destroy();
            (this.scene.getEntityWithName("audio") as SoundManager).playSound("pickup");
            this.addAmmo(pickupDetails.amount, ammunition);
        }
        else if (other instanceof HealthPickup)
        {
            if (health.isFull())
            {
                // Can't get more health if it's already full.
                return;
            }

            other.destroy();
            (this.scene.getEntityWithName("audio") as SoundManager).playSound("pickup");
            this.addHealth(pickupDetails.amount, health);
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
                LD49.audioAtlas.get("rocketNoise")?.stop();
                this.getScene().addEntity(new BossRocketExplosion(this.transform.x, this.transform.y));

                this.receiveDamage(attackDetails.getDamage(), health);
            }
        }
    }

    receiveDamage(amount: number, health: Health)
    {
        health.removeHealth(amount);

        // Update the scoreboard.
        this.updatePlayerHealthGUI(health);

        if (health.getCurrentHealth() == 0)
        {
            // TODO explode into bees? Paused for effect?
            Log.info("DEAD");
            const game = this.getScene().getGame();
            this.getScene().entities.forEach(x => x.destroy());
            this.getScene().systems.forEach(x => x.destroy());
            this.getScene().globalSystems.forEach(x => x.destroy());
            game.setScene(new EndScreen(game, false));
        }
    }

    removeAmmo(amount: number, ammunition: Ammunition)
    {
        ammunition.removeAmmo(amount);

        // Update the scoreboard.
        this.updatePlayerAmmoGUI(ammunition);
    }

    addAmmo(amount: number, ammunition: Ammunition)
    {
        ammunition.addAmmo(amount);

        // Update the scoreboard.
        this.updatePlayerAmmoGUI(ammunition);
    }

    addHealth(amount: number, health: Health)
    {
        health.addHealth(amount);

        // Update the scoreboard.
        this.updatePlayerHealthGUI(health);
    }

    updatePlayerHealthGUI(health: Health)
    {
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
    }

    updatePlayerAmmoGUI(ammunition: Ammunition)
    {
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

export class PlayerController extends Component
{
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

            if (pressedKeys.has(Key.ArrowUp) || pressedKeys.has("w"))
            {
                newPosition.y -= this.hexagonHeightRatio;
            }
            if (pressedKeys.has(Key.ArrowDown) || pressedKeys.has("s"))
            {
                newPosition.y += this.hexagonHeightRatio;
            }
            if (pressedKeys.has(Key.ArrowLeft) || pressedKeys.has("a"))
            {
                newPosition.x -= 1;
            }
            if (pressedKeys.has(Key.ArrowRight) || pressedKeys.has("d"))
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

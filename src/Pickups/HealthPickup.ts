import {SpriteSheet, Timer} from "lagom-engine";
import beeSprite from '../Art/bee-alt-small.png';
import {PickupSpawner} from "./PickupSpawner";
import {Pickup} from "./Pickup";
import {Health} from "../Common/Health";

const bee = new SpriteSheet(beeSprite, 32, 32);

export class HealthPickup extends Pickup
{
    constructor(x: number, y: number)
    {
        super("healthPickup", x, y,
            1, 6, 2,
            bee.textureSliceFromSheet(), 10);
    }

    onAdded(): void
    {
        super.onAdded();
    }
}


export class HealthSpawner extends PickupSpawner
{
    constructor()
    {
        super("healthSpawner", 0, 0, 20);
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = new Timer(this.spawnFrequencySec * 1000, null, true);
        timer.onTrigger.register((caller) => {
            const player = caller.getScene().getEntityWithName("player");
            if (!player)
            {
                return;
            }

            const playerHealth = player.getComponent<Health>(Health);
            if (!playerHealth)
            {
                return;
            }

            // Only spawn health if the player isn't at full.
            if (!playerHealth.isFull())
            {
                this.spawnPickupOnRandomTile(caller, new HealthPickup(0, 0));
            }
        });
        this.addComponent(timer);
    }
}

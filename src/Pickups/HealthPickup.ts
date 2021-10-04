import {SpriteSheet, Timer} from "lagom-engine";

import beeSprite from '../Art/bee-alt.png';
import honeySprite2 from '../Art/honey2.png';
import honeySprite3 from '../Art/honey3.png';
import {PickupSpawner} from "./PickupSpawner";
import {Pickup} from "./Pickup";

const bee = new SpriteSheet(beeSprite, 64, 64);
const honey2 = new SpriteSheet(honeySprite2, 18, 16);
const honey3 = new SpriteSheet(honeySprite3, 18, 16);


export class HealthPickup extends Pickup
{
    constructor(x: number, y: number)
    {
        super("healthPickup", x, y,
            1, 3, 2,
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
        super("healthSpawner", 0, 0, 5);
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = new Timer(this.spawnFrequencySec * 1000, null, true);
        timer.onTrigger.register((caller) => this.spawnPickupOnRandomTile(caller, new HealthPickup(0, 0)));
        this.addComponent(timer);
    }
}

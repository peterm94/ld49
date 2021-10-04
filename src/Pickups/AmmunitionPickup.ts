import {SpriteSheet, Timer, Util} from "lagom-engine";

import honeySprite1 from '../Art/honey1.png';
import honeySprite2 from '../Art/honey2.png';
import honeySprite3 from '../Art/honey3.png';
import {Pickup} from "./Pickup";
import {PickupSpawner} from "./PickupSpawner";

const honey1 = new SpriteSheet(honeySprite1, 18, 16);
const honey2 = new SpriteSheet(honeySprite2, 18, 16);
const honey3 = new SpriteSheet(honeySprite3, 18, 16);


export class AmmunitionPickup extends Pickup
{
    constructor(x: number, y: number)
    {
        super("ammunitionPickup", x, y,
            1, 3, 2,
            Util.choose(honey1, honey2, honey3).textureSliceFromRow(0, 0, 7), 12);
    }

    onAdded(): void
    {
        super.onAdded();
    }
}


export class AmmunitionSpawner extends PickupSpawner
{
    constructor()
    {
        super("ammunitionSpawner", 0, 0, 2.5);
    }

    onAdded(): void
    {
        super.onAdded();

        const timer = new Timer(this.timeBetweenSpawnsSec * 1000, null, true);
        timer.onTrigger.register((caller) => this.spawnPickupOnRandomTile(caller, new AmmunitionPickup(0, 0)));
        this.addComponent(timer);
    }
}

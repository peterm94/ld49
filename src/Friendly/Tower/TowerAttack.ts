import {Entity} from "lagom-engine";
import {Attack} from "../../Common/Attack";

export class TowerAttack extends Entity
{
    constructor(x: number, y: number)
    {
        super("turretBullet", x, y);
    }

    onAdded()
    {
        super.onAdded();

        this.addComponent(new Attack(10));
    }
}

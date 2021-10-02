import {Entity, TextDisp} from "lagom-engine";

export class HealthBar extends Entity
{
    constructor(name: string, x: number, y: number, z: number, readonly healthText: string,
                readonly xOffset: number = 0, readonly yOffset: number = 0)
    {
        super(name, x, y, z);
    }

    onAdded()
    {
        super.onAdded();
        this.addComponent(
            new TextDisp(this.xOffset, this.yOffset, this.healthText, {align: "center", fill: "red", fontSize: 16}));
    }
}

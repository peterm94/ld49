import {Component} from "lagom-engine";

export class Ammunition extends Component
{
    constructor(readonly maxAmmo: number, private currentAmmo: number)
    {
        super();
    }

    getCurrentAmmo = (): number => this.currentAmmo;

    addAmmo(amount: number): number
    {
        const prevAmmo = this.currentAmmo;
        this.currentAmmo += amount;
        if (this.currentAmmo > this.maxAmmo)
        {
            this.currentAmmo = this.maxAmmo;
        }

        return this.currentAmmo - prevAmmo;
    }

    removeAmmo(amount: number): void
    {
        this.currentAmmo -= amount;
        if (this.currentAmmo < 0)
        {
            this.currentAmmo = 0;
        }
    }
}

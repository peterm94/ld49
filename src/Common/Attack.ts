import {Component} from "lagom-engine";

export class Attack extends Component
{
    constructor(private damage: number)
    {
        super();
    }

    getDamage = () => this.damage;
}

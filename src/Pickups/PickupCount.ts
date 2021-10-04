import {Component} from "lagom-engine";

export class PickupCount extends Component
{
    constructor(readonly amount: number)
    {
        super();
    }
}

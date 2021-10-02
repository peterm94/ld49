import {Component} from "lagom-engine";

export class AttackMovement extends Component
{
    constructor(readonly targetAngle: number, readonly moveSpeed: number)
    {
        super();
    }
}

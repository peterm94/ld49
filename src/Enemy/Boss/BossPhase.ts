import {Component} from "lagom-engine";

export enum BossPhases
{
    PHASE_1 = 100,
    PHASE_2 = 75,
    PHASE_3 = 50,
    PHASE_4 = 25,
    DEAD = 0,
}

export class BossPhase extends Component
{
    constructor(public currentPhase: BossPhases)
    {
        super();
    }

    updatePhase(totalHpPercent: number)
    {
        if (totalHpPercent > BossPhases.PHASE_2)
        {
            this.currentPhase = BossPhases.PHASE_1;
        }
        else if (totalHpPercent > BossPhases.PHASE_3)
        {
            this.currentPhase = BossPhases.PHASE_2;
        }
        else if (totalHpPercent > BossPhases.PHASE_4)
        {
            this.currentPhase = BossPhases.PHASE_3;
        }
        else if (totalHpPercent > BossPhases.DEAD)
        {
            this.currentPhase = BossPhases.PHASE_4;
        }
        else
        {
            this.currentPhase = BossPhases.DEAD;
        }
    }
}

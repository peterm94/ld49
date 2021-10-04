import {Component} from "lagom-engine";

export enum BossPhases
{
    PHASE_1 = 100,
    PHASE_2 = 80,
    PHASE_3 = 50,
    FINAL_PHASE = 15,
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
        else if (totalHpPercent > BossPhases.FINAL_PHASE)
        {
            this.currentPhase = BossPhases.PHASE_3;
        }
        else if (totalHpPercent > BossPhases.DEAD)
        {
            this.currentPhase = BossPhases.FINAL_PHASE;
        }
        else
        {
            this.currentPhase = BossPhases.DEAD;
        }
    }
}

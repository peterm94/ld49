import {Component, Entity, System, TextDisp} from "lagom-engine";

export class GameStatusDisplay extends Entity
{
    constructor(x: number, y: number)
    {
        super("gameStatusDisplay", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new GameStatus());
        this.addComponent(new TextDisp(0, 0, "", {fontSize: 12, fill: 0x777777}));
    }
}

export class GameStatus extends Component
{
    constructor(public ammunition: number = 0, public playerHealth: number = 3, public bossHealth: number = 100)
    {
        super();
    }
}

export class GameStatusUpdater extends System
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, text: TextDisp, gameStatus: GameStatus) => {
            text.pixiObj.text = `Ammo: ${gameStatus.ammunition}\n` +
                `Health: ${gameStatus.playerHealth}\n` +
                `Boss Health: ${gameStatus.bossHealth.toFixed(0)}%`;
        });
    }

    types = () => [TextDisp, GameStatus];
}

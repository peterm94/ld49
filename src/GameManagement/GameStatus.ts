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

        const ammo = this.addComponent(new GameStatus(0));
        const ammoLabel = new TextDisp(-30, 0, ammo.ammunition.toString(), {fill: 0x777777});
        this.addComponent(ammoLabel);
    }
}

export class GameStatus extends Component
{
    constructor(public ammunition: number)
    {
        super();
    }
}

export class GameStatusUpdater extends System
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, text: TextDisp, gameStatus: GameStatus) => {
            text.pixiObj.text = `Ammunition: ${gameStatus.ammunition}`;
        });
    }

    types = () => [TextDisp, GameStatus];
}

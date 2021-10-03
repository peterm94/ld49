import {Component, Entity, Sprite, SpriteSheet, System, TextDisp} from "lagom-engine";

import bearHealthSpr from "../Art/bear-health.png";

const bearHealth = new SpriteSheet(bearHealthSpr, 50, 200);

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
        this.addComponent(new Sprite(bearHealth.texture(0, 0)));
        this.addComponent(new HpBits(
            this.addComponent(new Sprite(bearHealth.textureFromPoints(70, 181, 11, 1), {xOffset: 20, yOffset: 23})),
            this.addComponent(new Sprite(bearHealth.textureFromPoints(120, 182, 11, 1), {xOffset: 20, yOffset: 22})),
            this.addComponent(
                new Sprite(bearHealth.textureFromPoints(120, 182, 11, 1), {xOffset: 20, yOffset: 22 + 160}))
        ));
    }
}

export class GameStatus extends Component
{
    constructor(public ammunition: number = 0, public playerHealth: number = 3, public bossHealth: number = 100)
    {
        super();
    }
}

class HpBits extends Component
{
    constructor(readonly bar: Sprite, readonly barTop: Sprite, readonly barButt: Sprite)
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


export class BossHealthUpdater extends System
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, hpBits: HpBits, gameStatus: GameStatus) => {
            const hpPercentage = gameStatus.bossHealth / 100;

            // Max bar size is 160px.
            const stretch = hpPercentage * 159;
            const offset = 159 - hpPercentage * 159;
            hpBits.bar.applyConfig({yScale: stretch > 2 ? stretch : 0, yOffset: 23 + offset});
            hpBits.barTop.applyConfig({yOffset: 22 + offset, yScale: stretch > 2 ? 1 : 0});
            hpBits.barButt.applyConfig({yScale: hpPercentage > 0 ? 1 : 0});
        });
    }

    types = () => [HpBits, GameStatus];
}

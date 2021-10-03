import {Component, Entity, Sprite, SpriteSheet, System, TextDisp} from "lagom-engine";

import bearHealthSpr from "../Art/bear-health.png";
import bearHealthHeadSpr from "../Art/bear-healthbar-adornment.png";
import {Health} from "../Common/Health";

const bearHealth = new SpriteSheet(bearHealthSpr, 50, 200);
const bearHealthHead = new SpriteSheet(bearHealthHeadSpr, 32, 32);

export class BearStatus extends Entity
{
    constructor(x: number, y: number, readonly health: Health)
    {
        super("bosshp", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new GameStatus());
        this.addComponent(new TextDisp(0, 0, "", {fontSize: 12, fill: 0x777777}));
        this.addComponent(new Sprite(bearHealth.texture(0, 0)));
        this.addComponent(new Sprite(bearHealthHead.textureFromIndex(0),
            {xAnchor: 0.5, yAnchor: 0.5, xOffset: 25, yOffset: 6, xScale: 0.5, yScale: 0.5}));
        this.addComponent(new HpBits(
            this.addComponent(new Sprite(bearHealth.textureFromPoints(70, 181, 11, 1), {xOffset: 20, yOffset: 23})),
            this.addComponent(new Sprite(bearHealth.textureFromPoints(120, 182, 11, 1), {xOffset: 20, yOffset: 22})),
            this.addComponent(
                new Sprite(bearHealth.textureFromPoints(120, 182, 11, 1), {xOffset: 20, yOffset: 22 + 160})),
            this.health
        ));
        this.getScene().addSystem(new BossHealthUpdater());
    }
}

export class GameStatus extends Component
{
    constructor(public ammunition: number = 0, public playerHealth: number = 3, public bossHealth: number = 100)
    {
        super();
    }
}

export class HpBits extends Component
{
    constructor(readonly bar: Sprite, readonly barTop: Sprite, readonly barButt: Sprite, readonly bossHp: Health)
    {
        super();
    }
}

export class BossHealthUpdater extends System
{
    update(delta: number): void
    {
        this.runOnEntities((entity: Entity, hpBits: HpBits) => {
            const hpPercentage = hpBits.bossHp.getCurrentHealth() / hpBits.bossHp.getMaxHealth();

            // Max bar size is 160px.
            const stretch = hpPercentage * 159;
            const offset = 159 - hpPercentage * 159;
            hpBits.bar.applyConfig({yScale: stretch > 2 ? stretch : 0, yOffset: 23 + offset});
            hpBits.barTop.applyConfig({yOffset: 22 + offset, yScale: stretch > 2 ? 1 : 0});
            hpBits.barButt.applyConfig({yScale: hpPercentage > 0 ? 1 : 0});
        });
    }

    types = () => [HpBits];
}

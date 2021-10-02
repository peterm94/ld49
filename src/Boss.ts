import {CollisionSystem, Component, Entity, LagomType, RectCollider, RenderRect, System, TextDisp} from "lagom-engine";

class Health extends Component {
    amount: number;

    constructor(amount: number) {
        super();
        this.amount = amount;
    }
}

class HealthBar extends Entity {
    onAdded() {
        super.onAdded();
        this.addComponent(new TextDisp(5, 55, "Boss", {align: "center", fill: "red", fontSize: 16}));
    }
}

export class Boss extends Entity {
    public static WIDTH = 50;
    public static HEIGHT = 50;

    constructor(x: number, y: number) {
        super("Boss", x, y, 10);
    }

    onAdded() {
        super.onAdded();

        this.addComponent(new Health(1000));

        this.addComponent(new RenderRect(0, 0, Boss.WIDTH, Boss.HEIGHT, 0x0700ff, 0xff0000));
        this.addComponent(new RenderRect(5, 5, 40, 40, 0x00ff00, 0xff0000));
        this.addChild(new HealthBar("boss_health", 0, 0, 2));
    }
}
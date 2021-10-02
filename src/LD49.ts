import {Game, Scene} from "lagom-engine";

export class LD49 extends Game
{
    constructor()
    {
        super({width: 640, height: 360, resolution: 2, backgroundColor: 0x45283C});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();
    }
}

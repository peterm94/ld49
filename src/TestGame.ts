import {Game, Scene} from 'lagom-engine';

class TestScene extends Scene
{

}

export class TestGame extends Game
{
    constructor()
    {
        super({
                  width: 512,
                  height: 512,
                  resolution: 1,
                  backgroundColor: 0x200140
              });

        this.setScene(new TestScene(this));
    }
}

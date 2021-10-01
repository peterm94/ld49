import {
    CollisionMatrix,
    CollisionSystem,
    Component,
    Diagnostics,
    DiscreteCollisionSystem,
    Entity,
    Game,
    Key,
    LagomType,
    Observable,
    RectCollider,
    RenderRect,
    Scene,
    System,
    TextDisp
} from "lagom-engine";

enum Layers
{
    leftpaddle,
    ball,
    rightpaddle
}

enum PaddleSide
{
    left,
    right
}

export class Pong extends Game
{
    constructor()
    {
        super({width: 800, height: 600, resolution: 1, backgroundColor: 0x000000});
        this.setScene(new MainScene(this));
    }
}

class MainScene extends Scene
{
    onAdded()
    {
        super.onAdded();

        const collisionMatrix = new CollisionMatrix();
        collisionMatrix.addCollision(Layers.leftpaddle, Layers.ball);
        collisionMatrix.addCollision(Layers.rightpaddle, Layers.ball);

        this.addGlobalSystem(new DiscreteCollisionSystem(collisionMatrix));

        this.addEntity(new Paddle(30, 300, PaddleSide.left));
        this.addEntity(new Paddle(740, 300, PaddleSide.right));
        this.addEntity(new Ball(400, 200));
        const scoreboard = new Scoreboard(400, 50);
        this.addEntity(scoreboard);
        this.addEntity(new Diagnostics("red"));

        this.addSystem(new PlayerMover());
        this.addSystem(new BallMover());
        this.addSystem(new ScoreSystem(scoreboard.score));
    }
}

class Paddle extends Entity
{
    private static width = 30;
    private static height = 80;

    constructor(x: number, y: number, private side: PaddleSide)
    {
        super("paddle", x, y);
    }

    onAdded()
    {
        super.onAdded();

        if (this.side === PaddleSide.left)
        {
            this.addComponent(new PlayerControlled(Key.KeyW, Key.KeyS));
        }
        else
        {
            this.addComponent(new PlayerControlled(Key.ArrowUp, Key.ArrowDown));
        }

        this.addComponent(new RenderRect(0, 0, Paddle.width, Paddle.height, 0xffffff, 0xffffff));

        this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                             {
                                 layer: Layers.leftpaddle,
                                 height: Paddle.height, width: Paddle.width
                             }));
    }
}

class PlayerControlled extends Component
{
    constructor(public upKey: Key, public downKey: Key)
    {
        super();
    }
}

class PlayerMover extends System
{
    private readonly moveSpeed = 4;

    types = () => [PlayerControlled];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity,
                            playerControlled: PlayerControlled) => {

            if (Game.keyboard.isKeyDown(playerControlled.upKey))
            {
                entity.transform.position.y += this.moveSpeed * -1;
            }
            if (Game.keyboard.isKeyDown(playerControlled.downKey))
            {
                entity.transform.position.y += this.moveSpeed;
            }
        });
    }
}


class BallMovement extends Component
{
    xSpeed: number;
    ySpeed: number;

    constructor()
    {
        super();
        this.xSpeed = -3;
        this.ySpeed = 3;
    }
}


class BallMover extends System
{
    topBounce: number;
    bottomBounce: number;

    constructor()
    {
        super();
        this.topBounce = 10;
        this.bottomBounce = 600 - 10;
    }

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity,
                            ball: BallMovement) => {
            const bodyY = entity.transform.y;
            if (bodyY > this.bottomBounce || bodyY < this.topBounce)
            {
                ball.ySpeed *= -1;
            }
            entity.transform.x += ball.xSpeed;
            entity.transform.y += ball.ySpeed;
        });
    }

    types(): LagomType<Component>[]
    {
        return [BallMovement];
    }
}

class Ball extends Entity
{
    constructor(x: number, y: number)
    {
        super("ball", x, y);
    }

    onAdded(): void
    {
        super.onAdded();

        const rect = new RenderRect(0, 0, 10, 10, 0xffffff, 0xffffff);
        this.addComponent(rect);
        this.addComponent(new BallMovement());

        const collider = this.addComponent(
            new RectCollider(<CollisionSystem>this.getScene().getGlobalSystem<CollisionSystem>(CollisionSystem),
                             {
                                 xOff: 0, yOff: 0, layer: Layers.ball, rotation: 0,
                                 height: 10, width: 10
                             }));

        collider.onTriggerEnter.register(() => {
            const movement = this.getComponent<BallMovement>(BallMovement);
            if (movement !== null)
            {
                movement.xSpeed *= -1;
            }
        });
    }
}

class Scoreboard extends Entity
{
    score: Score;

    constructor(x: number, y: number)
    {
        super("scoreboard", x, y);
        this.score = new Score();
    }

    onAdded()
    {
        super.onAdded();

        const p1Label = new TextDisp(-30, 0, this.score.player1Score.toString(), {fill: 0x777777});
        this.addComponent(p1Label);
        this.score.onP1Score.register((_, num) => {
            p1Label.pixiObj.text = num.toString();
        });

        const p2Label = new TextDisp(30, 0, this.score.player2Score.toString(), {fill: 0x777777});
        this.addComponent(p2Label);
        this.score.onP2Score.register((_, num) => {
            p2Label.pixiObj.text = num.toString();
        });
    }
}

class Score extends Component
{
    private _player1Score: number;
    private _player2Score: number;

    constructor()
    {
        super();
        this._player1Score = 0;
        this._player2Score = 0;
    }

    player1Scored(): void
    {
        this._player1Score++;
        this.onP1Score.trigger(this, this._player1Score);
    }

    get player1Score(): number
    {
        return this._player1Score;
    }

    player2Scored(): void
    {
        this._player2Score++;
        this.onP2Score.trigger(this, this._player2Score);
    }

    get player2Score(): number
    {
        return this._player2Score;
    }

    readonly onP1Score: Observable<Score, number> = new Observable();
    readonly onP2Score: Observable<Score, number> = new Observable();

    onRemoved(): void
    {
        super.onRemoved();

        this.onP1Score.releaseAll();
        this.onP2Score.releaseAll();
    }
}

class ScoreSystem extends System
{
    constructor(private score: Score)
    {
        super();
    }

    types = () => [BallMovement];

    update(delta: number): void
    {
        this.runOnEntities((entity: Entity) => {
            if (entity.transform.x < 0)
            {
                this.score.player2Scored();
                entity.destroy();
                this.getScene().addEntity(new Ball(400, 200));
            }
            if (entity.transform.x > 800)
            {
                this.score.player1Scored();
                entity.destroy();
                this.getScene().addEntity(new Ball(400, 200));
            }
        });
    }
}

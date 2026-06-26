import { BallStatus } from "../../game/enums/BallStatus";
import { GameStatus } from "../../game/enums/GameStatus";
import { GameWorld } from "../../game/world/GameWorld";
import { GameConfigs } from "../../utils/GameConfigs";
import { RenderInterface } from "../RenderInterface";

export class BallRender implements RenderInterface {
    private readonly maxResizeFactor: number = 2;
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }

    public render(gameWorld: GameWorld): void {
        const ball = gameWorld.ball;
        this.gameContext.save();

        if (
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING ||
            ((gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL || 
                gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME) &&
                ball.movementPosition.getSpeed() > 0)
        ) {
            this.gameContext.translate(
                ball.movementPosition.position.x,
                ball.movementPosition.position.y,
            );

            this.gameContext.rotate(ball.movementPosition.getSpeedAngle());
            let resizeFactor = 1;
            if (ball.ballStatus !== BallStatus.ATTACHED) {
                resizeFactor =
                    (ball.movementPosition.getSpeed() / ball.maxSpeed) *
                        (this.maxResizeFactor - 1) +
                    1;
            }
            this.gameContext.scale(resizeFactor, 1);

            this.gameContext.shadowColor = "#000000";
            this.gameContext.shadowOffsetX = this.gameConfigs.ballSizeWithoutBorder * 0.5;
            this.gameContext.shadowOffsetY = this.gameConfigs.ballSizeWithoutBorder * 0.5;
            this.gameContext.shadowBlur = this.gameConfigs.ballSizeWithoutBorder;

            this.gameContext.beginPath();
            this.gameContext.arc(
                0,
                0,
                this.gameConfigs.ballSizeWithoutBorder,
                0,
                2 * Math.PI,
                false,
            );
            this.gameContext.closePath();

            this.gameContext.fillStyle = "#FF3333";
            this.gameContext.fill();
            this.gameContext.lineWidth = this.gameConfigs.ballBorder;
            this.gameContext.strokeStyle = "#330000";
            this.gameContext.stroke();
        }

        this.gameContext.restore();
    }
}

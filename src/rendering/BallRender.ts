import { GameStatus } from "../game/status/GameStatus";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";

export class BallRender {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }

    public render(gameWorld: GameWorld): void {
        this.gameContext.save();

        if (gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING) {
            this.gameContext.translate(
                gameWorld.ball.movementPosition.position.x,
                gameWorld.ball.movementPosition.position.y,
            );
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

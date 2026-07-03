import { Point } from "../../game/geometry/Point";
import { GameWorld } from "../../game/world/GameWorld";
import { GameConfigs } from "../../utils/GameConfigs";
import { RenderInterface } from "../RenderInterface";

export class BallTrajectoryRender implements RenderInterface {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private readonly trajectoryMaxDistance: number;

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
        this.trajectoryMaxDistance = gameConfigs.fieldHeight / 3;
    }

    public render(gameWorld: GameWorld): void {
        const ball = gameWorld.ball;

        this.gameContext.save();

        this.gameContext.fillStyle = "#111111";
        this.gameContext.strokeStyle = "#111111";

        ball.positionHistory.positions.forEach((position, index) => {
            if (index < ball.positionHistory.positions.length - 1) {
                const nextPosition = ball.positionHistory.positions[index + 1];

                if (
                    Point.getDistance(position.position, nextPosition.position) <
                    this.trajectoryMaxDistance
                ) {
                    this.gameContext.globalAlpha = 1 - ball.positionHistory.getFactor(index);
                    this.gameContext.lineWidth = this.gameConfigs.ballSizeWithBorder;
                    this.gameContext.beginPath();
                    this.gameContext.moveTo(position.position.x, position.position.y);
                    this.gameContext.lineTo(nextPosition.position.x, nextPosition.position.y);
                    this.gameContext.stroke();
                    this.gameContext.closePath();
                }
            }
        });

        this.gameContext.restore();
    }
}

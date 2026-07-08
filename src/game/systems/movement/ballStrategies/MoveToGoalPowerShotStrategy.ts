import { GameConfigs } from "../../../../utils/GameConfigs";
import { Ball } from "../../../entities/Ball";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { PowerShotUtilities } from "../../../enums/PowerShotType";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { BallStrategyInterface } from "./BallStrategyInterface";

export class MoveToGoalPowerShotStrategy implements BallStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private readonly minGoalDistance: number;
    private readonly ballRotateOffset: number = 250;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.minGoalDistance = gameConfigs.fieldHeight / 50;
    }

    public canBeApplied(ball: Ball, gameWorld: GameWorld): boolean {
        return (
            ball.ballStatus === BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            ball.ballPowerShot.shouldMoveToGoal()
        );
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        const distance = this.getDirectionDistance(ball, ball.movementPosition.getSpeedAngle());

        if (distance > this.minGoalDistance) {
            const distance1 = this.getDirectionDistance(
                ball,
                ball.movementPosition.getSpeedAngle() + Math.PI / this.ballRotateOffset,
            );
            const distance2 = this.getDirectionDistance(
                ball,
                ball.movementPosition.getSpeedAngle() - Math.PI / this.ballRotateOffset,
            );
            ball.movementPosition.setSpeed(
                ball.maxSpeed *
                    PowerShotUtilities.getSpeedFactor(ball.ballPowerShot.getPowerShotType()),
                distance1 < distance2
                    ? ball.movementPosition.getSpeedAngle() +
                          (Math.PI / this.ballRotateOffset) * deltaMs
                    : ball.movementPosition.getSpeedAngle() -
                          (Math.PI / this.ballRotateOffset) * deltaMs,
            );
        }
    }

    private getDirectionDistance(ball: Ball, ballSpeedAngle: number): number {
        const destinationX =
            this.gameConfigs.fieldXOffset +
            (ball.ballPowerShot.getPowerShotDestinationSide() === PlayerSide.LEFT
                ? 0
                : this.gameConfigs.fieldWidth);
        const destinationY = this.gameConfigs.fieldHeight / 2;
        let dist = Point.getDistance(
            ball.movementPosition.position,
            new Point(destinationX, destinationY),
        );
        const newX = ball.movementPosition.position.x + Math.cos(ballSpeedAngle) * dist;
        const newY = ball.movementPosition.position.y + Math.sin(ballSpeedAngle) * dist;
        return Point.getDistance(new Point(newX, newY), new Point(destinationX, destinationY));
    }
}

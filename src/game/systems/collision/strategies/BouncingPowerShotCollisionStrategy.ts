import { GameConfigs } from "../../../../utils/GameConfigs";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class BouncingPowerShotCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.ball.ballStatus === BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            !gameWorld.ball.shouldStopOnPlayerBounce()
        );
    }

    public apply(gameWorld: GameWorld): void {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
                if (
                    MovementPoint.areTouching(
                        gameWorld.ball.movementPosition,
                        player.movementPosition,
                    )
                ) {
                    const middlePoint = new Point(
                        (gameWorld.ball.movementPosition.position.x +
                            player.movementPosition.position.x) /
                            2,
                        (gameWorld.ball.movementPosition.position.y +
                            player.movementPosition.position.y) /
                            2,
                    );
                    const angle = Point.getAngleBetweenPoints(
                        middlePoint,
                        player.movementPosition.position,
                    );
                    player.movementPosition.setSpeed(
                        gameWorld.ball.movementPosition.getSpeed(),
                        angle,
                    );
                }
            });
    }
}

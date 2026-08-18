import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { Point } from "@/game/geometry/Point";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class BallGoalStakesCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            gameWorld.ball.ballStatus === BallStatus.FREE
        );
    }

    public apply(gameWorld: GameWorld): void {
        gameWorld.goalPosts.positions.forEach(position => {
            if (
                Point.getDistance(gameWorld.ball.movementPosition.position, position) <
                gameWorld.ball.movementPosition.size + gameWorld.goalPosts.radius
            ) {
                const angle =
                    Point.getAngleBetweenPoints(
                        gameWorld.ball.movementPosition.position,
                        position,
                    ) - Math.PI;
                gameWorld.ball.movementPosition.setSpeed(
                    gameWorld.ball.movementPosition.getSpeed(),
                    angle,
                );
                gameWorld.ball.movementPosition.position.x =
                    position.x + Math.cos(angle) * gameWorld.goalPosts.radius;
                gameWorld.ball.movementPosition.position.y =
                    position.y + Math.sin(angle) * gameWorld.goalPosts.radius;
            }
        });
    }
}

import { GameConfigs } from "../../../../utils/GameConfigs";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class BallGoalStakesCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING && 
            gameWorld.ball.ballStatus === BallStatus.FREE;
    }

    public apply(gameWorld: GameWorld): void {
        gameWorld.goalPosts.positions.forEach(position => {
            if (
                Point.getDistance(
                    gameWorld.ball.movementPosition.position,
                    position,
                ) < gameWorld.ball.movementPosition.size + gameWorld.goalPosts.radius
            ) {
                const angle = Point.getAngleBetweenPoints(
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

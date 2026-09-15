import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class AttachedBallOppositePlayerCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            gameWorld.ball.ballStatus === BallStatus.ATTACHED
        );
    }

    public apply(gameWorld: GameWorld): void {
        const ball = gameWorld.ball;
        const playerWithBall = ball.attachedPlayer;
        if (playerWithBall === null) {
            return;
        }
        const oppositePlayer = gameWorld.players.find(
            player => player !== playerWithBall && !player.isSubstitute,
        );
        if (oppositePlayer === undefined) {
            return;
        }

        if (
            MovementPoint.areTouching(ball.movementPosition, oppositePlayer.movementPosition) &&
            !MovementPoint.areTouching(
                playerWithBall.movementPosition,
                oppositePlayer.movementPosition,
            )
        ) {
            gameWorld.ball.attachToPlayer(oppositePlayer);
        }
    }
}

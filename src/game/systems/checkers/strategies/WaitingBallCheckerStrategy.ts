import { GameStatus } from "../../../enums/GameStatus";
import { GameWorld } from "../../../world/GameWorld";
import { CheckerStrategyInterface } from "./CheckerStrategyInterface";

export class WaitingBallCheckerStrategy implements CheckerStrategyInterface {
    public canBeApplied(gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL;
    }

    public apply(gameWorld: GameWorld): void {
        const areAllPlayersInPosition = gameWorld.players
            .filter(player => !player.isSubstitute)
            .every(player => {
                return player.reachedDestinationPosition();
            });
        const isBallStopped = gameWorld.ball.movementPosition.getSpeed() === 0;

        if (areAllPlayersInPosition && isBallStopped) {
            gameWorld.gameStatusManager.scheduleStatusChange(1500, GameStatus.PLAYING);
        }
    }
}

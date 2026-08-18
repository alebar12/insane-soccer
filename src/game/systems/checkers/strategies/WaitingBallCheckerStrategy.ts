import { GameStatus } from "@/game/enums/GameStatus";
import { CheckerStrategyInterface } from "@/game/systems/checkers/strategies/CheckerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

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

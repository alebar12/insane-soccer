import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class WaitingBallMovementStrategy implements PlayerMovementStrategyInterface {
    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            player.resetToStartGame();
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
        if (
            player.reachedDestinationPosition() &&
            gameWorld.ball.movementPosition.getSpeed() === 0
        ) {
            gameWorld.gameStatusManager.scheduleStatusChange(2000, GameStatus.PLAYING);
        }
    }
}

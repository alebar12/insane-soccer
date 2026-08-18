import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class WaitingBallPlayerStrategy implements PlayerStrategyInterface {
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
    }
}

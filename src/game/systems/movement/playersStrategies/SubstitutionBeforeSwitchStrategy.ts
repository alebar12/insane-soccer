import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class SubstitutionBeforeSwitchStrategy implements PlayerStrategyInterface {
    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            player.isSubstitute &&
            (gameWorld.score.isGoalBeforeSubstitution() ||
                gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION)
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            player.resetToStartGame();
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

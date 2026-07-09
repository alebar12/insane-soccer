import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

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

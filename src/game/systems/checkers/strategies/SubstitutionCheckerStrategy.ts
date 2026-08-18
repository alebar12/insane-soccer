import { GameStatus } from "@/game/enums/GameStatus";
import { Point } from "@/game/geometry/Point";
import { CheckerStrategyInterface } from "@/game/systems/checkers/strategies/CheckerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class SubstitutionCheckerStrategy implements CheckerStrategyInterface {
    public canBeApplied(gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION;
    }

    public apply(gameWorld: GameWorld): void {
        const areAllPlayersInInitialPosition = gameWorld.players.every(player => {
            return Point.arePointEquals(player.movementPosition.position, player.initialPosition);
        });
        if (areAllPlayersInInitialPosition) {
            gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        }
    }
}

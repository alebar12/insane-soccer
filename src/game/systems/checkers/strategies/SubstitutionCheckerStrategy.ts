import { GameStatus } from "../../../enums/GameStatus";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { CheckerStrategyInterface } from "./CheckerStrategyInterface";

export class SubstitutionCheckerStrategy implements CheckerStrategyInterface {
    public canBeApplied(gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITION;
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

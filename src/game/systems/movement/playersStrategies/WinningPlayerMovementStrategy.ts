import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class WinningPlayerMovementStrategy implements PlayerMovementStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME &&
            gameWorld.score.getWinningPlayerSide() === player.side
        );
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        if (player.reachedDestinationPosition()) {
            const x =
                this.gameConfigs.fieldXOffset +
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth;
            const y = (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition = new MovementPoint(new Point(x, y), new Point(0, 0), 0, 0);
            player.currentMaxSpeed =
                player.normalMaxSpeed * 2 * Math.random() + player.normalMaxSpeed;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

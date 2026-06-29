import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class SubstitutionMovementStrategy implements PlayerMovementStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(_player: Player, gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITION;
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        if (player.isSubstitute) {
        } else {
            let x = this.gameConfigs.substitutionOffsetX;
            if (player.side === PlayerSide.RIGHT) {
                x = this.gameConfigs.fieldWidth - this.gameConfigs.substitutionOffsetX;
            }
            player.destinationPosition.position = new Point(
                this.gameConfigs.fieldXOffset + x,
                this.gameConfigs.substituteStartPositionYOffset,
            );
            player.adjustSpeedToDestinationPoint(deltaMs);
        }
    }
}

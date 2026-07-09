import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { Point } from "../../../geometry/Point";
import { PositionStatus, PositionStatusMachine } from "../../../status/PositionStatusMachine";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class SubstitutePlayersStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private positionStatusMachines: Map<Player, PositionStatusMachine> = new Map();

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION &&
            !player.isSubstitute
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            this.positionStatusMachines.delete(player);
        }

        let positionStatusMachine = this.positionStatusMachines.get(player);
        if (positionStatusMachine === undefined) {
            const destinationList = this.getSubstitutionDestinations(player);
            positionStatusMachine = new PositionStatusMachine(destinationList, player, gameWorld);
            this.positionStatusMachines.set(player, positionStatusMachine);
        }
        positionStatusMachine.update(deltaMs);
    }

    private getSubstitutionDestinations(player: Player): Array<PositionStatus> {
        const x =
            this.gameConfigs.fieldXOffset +
            (player.side === PlayerSide.LEFT
                ? this.gameConfigs.substitutionOffsetX
                : this.gameConfigs.fieldWidth - this.gameConfigs.substitutionOffsetX);
        const speed = (player.normalMaxSpeed * 2) / 3;
        return [
            new PositionStatus(
                new Point(
                    x,
                    this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder / 2,
                ),
                () => {},
                speed,
            ),
            new PositionStatus(
                new Point(x, this.gameConfigs.substituteStartPositionYOffset),
                (player, gameWorld) => {
                    gameWorld.switchPlayerColor(player.side);
                },
                speed,
            ),
            new PositionStatus(
                new Point(x, this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder),
                () => {},
                speed,
            ),
            new PositionStatus(player.initialPosition, () => {}, speed),
        ];
    }
}

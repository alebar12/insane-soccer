import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class SubstitutePlayersMovementStrategy implements PlayerMovementStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private readonly subPositionsMap: Map<PlayerSide, Array<PointWithAction>>;
    private playerDestinationPointMap: Map<Player, PointWithAction> = new Map();

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.subPositionsMap = new Map();
        this.subPositionsMap.set(
            PlayerSide.LEFT,
            this.getSubstitutionDestinations(PlayerSide.LEFT),
        );
        this.subPositionsMap.set(
            PlayerSide.RIGHT,
            this.getSubstitutionDestinations(PlayerSide.RIGHT),
        );
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITION && !player.isSubstitute
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            this.playerDestinationPointMap.clear();
        }

        const destinationList = this.subPositionsMap.get(player.side);
        if (destinationList === undefined || destinationList.length === 0) {
            return;
        }

        let destinationPoint = this.playerDestinationPointMap.get(player);
        if (destinationPoint === undefined) {
            destinationPoint = destinationList[0];
            this.playerDestinationPointMap.set(player, destinationPoint);
        }
        player.destinationPosition.position = destinationPoint.point;
        player.adjustSpeedToDestinationPoint(deltaMs);

        if (player.reachedDestinationPosition()) {
            destinationPoint.action(player, gameWorld);
            const index = destinationList.findIndex(destinationPoint => {
                return Point.arePointEquals(
                    destinationPoint.point,
                    player.destinationPosition.position,
                );
            });
            if (index < 0) {
            } else if (index < destinationList.length - 1) {
                this.playerDestinationPointMap.set(player, destinationList[index + 1]);
            } else if (index >= destinationList.length - 1) {
                this.playerDestinationPointMap.set(
                    player,
                    new PointWithAction(player.initialPosition, () => {}),
                );
            }
        }
    }

    private getSubstitutionDestinations(playerSide: PlayerSide): Array<PointWithAction> {
        const x =
            this.gameConfigs.fieldXOffset +
            (playerSide === PlayerSide.LEFT
                ? this.gameConfigs.substitutionOffsetX
                : this.gameConfigs.fieldWidth - this.gameConfigs.substitutionOffsetX);
        return [
            new PointWithAction(
                new Point(
                    x,
                    this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder / 2,
                ),
                () => {},
            ),
            new PointWithAction(
                new Point(x, this.gameConfigs.substituteStartPositionYOffset),
                (player, gameWorld) => {
                    gameWorld.switchPlayerColor(player.side);
                },
            ),
            new PointWithAction(
                new Point(x, this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder),
                () => {},
            ),
        ];
    }
}

export interface Action {
    (player: Player, gameWorld: GameWorld): void;
}

export class PointWithAction {
    public constructor(
        public point: Point,
        public action: Action,
    ) {}
}

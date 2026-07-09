import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { Point } from "../../../geometry/Point";
import { PositionStatus, PositionStatusMachine } from "../../../status/PositionStatusMachine";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class SubstitutionTrainingStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private positionStatusMachines: Map<Player, PositionStatusMachine> = new Map();
    private readonly trainingPoints: Array<Array<RelativePosition>> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.initTraniningPoints();
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            player.isSubstitute &&
            !gameWorld.score.isGoalBeforeSubstitution() &&
            !(gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION)
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        let positionStatusMachine = this.positionStatusMachines.get(player);
        if (positionStatusMachine === undefined) {
            const destinationList = this.getRandomTrainingDestionations(player);
            positionStatusMachine = new PositionStatusMachine(destinationList, player, gameWorld);
            this.positionStatusMachines.set(player, positionStatusMachine);
        }
        positionStatusMachine.update(deltaMs);
        if (positionStatusMachine.isFinished()) {
            this.positionStatusMachines.delete(player);
        }
    }

    private getRandomTrainingDestionations(player: Player): Array<PositionStatus> {
        const heightForTraining = this.gameConfigs.athleticTrackHeight / 2;
        const yOffset =
            this.gameConfigs.fieldHeight +
            this.gameConfigs.athleticTrackYOffset +
            (this.gameConfigs.athleticTrackHeight - heightForTraining) / 2;

        const positions =
            this.trainingPoints[Math.floor(Math.random() * this.trainingPoints.length)];
        return positions.map(p => {
            const x = this.adjustXPosition(player.side, p.x);
            const y = yOffset + p.y * heightForTraining;
            return new PositionStatus(new Point(x, y), () => {}, p.speed * player.normalMaxSpeed);
        });
    }

    private adjustXPosition(playerSide: PlayerSide, x: number): number {
        const widthForTraining = (this.gameConfigs.fieldWidth * 4) / 10;
        const xOffset = (this.gameConfigs.fieldWidth / 2 - widthForTraining) / 2;
        const xPos = x * widthForTraining + xOffset;
        return (
            this.gameConfigs.fieldXOffset +
            (playerSide === PlayerSide.LEFT ? xPos : this.gameConfigs.fieldWidth - xPos)
        );
    }

    private initTraniningPoints(): void {
        this.trainingPoints.push([
            new RelativePosition(0, 1 / 2, 1 / 6),
            new RelativePosition(1, 1 / 2, 1 / 6),
            new RelativePosition(0, 1 / 2, 1 / 6),
            new RelativePosition(1, 1 / 2, 1 / 6),
            new RelativePosition(0, 1 / 2, 1 / 6),
        ]);

        this.trainingPoints.push([
            new RelativePosition(0, 1 / 2, 1),
            new RelativePosition(1, 1 / 2, 1),
            new RelativePosition(0, 1 / 2, 1),
        ]);

        this.trainingPoints.push([
            new RelativePosition(0, 0, 1),
            new RelativePosition(1 / 4, 1, 1),
            new RelativePosition(2 / 4, 0, 1),
            new RelativePosition(3 / 4, 1, 1),
            new RelativePosition(1, 0, 1),
            new RelativePosition(3 / 4, 1, 1),
            new RelativePosition(2 / 4, 0, 1),
            new RelativePosition(1 / 4, 1, 1),
            new RelativePosition(0, 0, 1),
        ]);

        this.trainingPoints.push([
            new RelativePosition(0, 1 / 2, 1 / 8),
            new RelativePosition(1 / 8, 1 / 2, 2),
            new RelativePosition(1 / 4, 1 / 2, 1 / 8),
            new RelativePosition(3 / 8, 1 / 2, 2),
            new RelativePosition(1 / 2, 1 / 2, 1 / 8),
            new RelativePosition(5 / 8, 1 / 2, 2),
            new RelativePosition(3 / 4, 1 / 2, 1 / 8),
            new RelativePosition(7 / 8, 1 / 2, 2),
            new RelativePosition(1, 1 / 2, 1 / 8),
        ]);

        this.trainingPoints.push([
            new RelativePosition(0, 0, 1 / 2),
            new RelativePosition(0, 1, 1 / 15),
            new RelativePosition(1, 1, 1 / 2),
            new RelativePosition(1, 0, 1 / 15),
        ]);
    }
}

class RelativePosition {
    public constructor(
        public x: number,
        public y: number,
        public speed: number,
    ) {}
}

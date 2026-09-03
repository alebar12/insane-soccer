import { Player } from "@/game/entities/Player";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { GameWorld } from "@/game/world/GameWorld";

export class PositionStatusMachine {
    private readonly positionStatuses: Array<PositionStatus>;
    private readonly player: Player;
    private readonly gameWorld: GameWorld;
    private index: number = 0;

    public constructor(
        positionStatuses: Array<PositionStatus>,
        player: Player,
        gameWorld: GameWorld,
    ) {
        this.positionStatuses = positionStatuses;
        this.player = player;
        this.gameWorld = gameWorld;
    }

    public update(deltaMs: number): void {
        if (this.index >= this.positionStatuses.length) {
            return;
        }

        const positionToReach = this.positionStatuses[this.index];
        this.player.currentMaxSpeed = positionToReach.speedToSet;
        this.player.destinationPosition = new MovementPoint(
            positionToReach.point,
            new Point(0, 0),
            0,
            0,
        );
        this.player.adjustSpeedToDestinationPoint(deltaMs);

        if (this.player.reachedDestinationPosition()) {
            positionToReach.actionToExecuteOnDestination(this.player, this.gameWorld);
            this.index++;
        }
    }

    public isFinished(): boolean {
        return this.index >= this.positionStatuses.length;
    }
}

export class PositionStatus {
    public constructor(
        public point: Point,
        public actionToExecuteOnDestination: Action,
        public speedToSet: number,
    ) {}
}

export interface Action {
    (player: Player, gameWorld: GameWorld): void;
}

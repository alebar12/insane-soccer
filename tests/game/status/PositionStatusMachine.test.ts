import { Player } from "@/game/entities/Player";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { PositionStatus, PositionStatusMachine } from "@/game/status/PositionStatusMachine";
import { GameWorld } from "@/game/world/GameWorld";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createPositionStatusMachine(
    positionStatuses: Array<PositionStatus>,
    player: Player,
    gameWorld: GameWorld,
): PositionStatusMachine {
    return new PositionStatusMachine(positionStatuses, player as Player, gameWorld);
}

describe("PositionStatusMachine", () => {
    let player: Pick<
        Player,
        | "movementPosition"
        | "destinationPosition"
        | "currentMaxSpeed"
        | "adjustSpeedToDestinationPoint"
        | "reachedDestinationPosition"
    >;
    let gameWorld: GameWorld;
    let destinationPosition = false;

    beforeEach(() => {
        destinationPosition = false;
        player = {
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
            destinationPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
            currentMaxSpeed: 0,
            adjustSpeedToDestinationPoint: vi.fn(),
            reachedDestinationPosition() {
                return destinationPosition;
            },
        };
        gameWorld = {} as GameWorld;
    });

    describe("update", () => {
        it("should do nothing if there are no position statuses", () => {
            const positionStatusMachine = createPositionStatusMachine(
                [],
                player as Player,
                gameWorld,
            );
            positionStatusMachine.update(16);
            expect(player.currentMaxSpeed).toBe(0);
        });

        it("should set speed and destination position", () => {
            const positionStatusMachine = createPositionStatusMachine(
                [new PositionStatus(new Point(1, 1), () => {}, 1)],
                player as Player,
                gameWorld,
            );
            positionStatusMachine.update(16);
            expect(player.currentMaxSpeed).toBe(1);
            expect(player.destinationPosition.position).toEqual(new Point(1, 1));
            expect(player.adjustSpeedToDestinationPoint).toHaveBeenCalledTimes(1);
            expect(player.adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
            expect(player.reachedDestinationPosition()).toBe(false);
            expect(positionStatusMachine.isFinished()).toBe(false);
        });

        it("should execute action on destination", () => {
            const action = vi.fn();
            const positionStatusMachine = createPositionStatusMachine(
                [new PositionStatus(new Point(1, 1), action, 1)],
                player as Player,
                gameWorld,
            );
            destinationPosition = true;
            positionStatusMachine.update(16);
            expect(action).toHaveBeenCalledTimes(1);
            expect(action).toHaveBeenCalledWith(player as Player, gameWorld);
            expect(positionStatusMachine.isFinished()).toBe(true);
        });
    });
});

import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { Point } from "@/game/geometry/Point";
import { CheckerSystem } from "@/game/systems/checkers/CheckerSystem";
import { CheckerSystemFactory } from "@/game/systems/checkers/CheckerSystemFactory";
import { GameWorld } from "@/game/world/GameWorld";
import { describe, expect, it, vi } from "vitest";

describe("CheckerSystemFactory", () => {
    it("should register the substitution checker", () => {
        const gameStatusManager = {
            gameStatus: GameStatus.SUBSTITUTION,
            changeStatus: vi.fn(),
        };
        const initialPosition = new Point(20, 30);
        const gameWorld = {
            gameStatusManager,
            players: [
                {
                    initialPosition,
                    movementPosition: { position: new Point(20, 30) },
                } as Player,
            ],
        } as unknown as GameWorld;

        const checkerSystem = CheckerSystemFactory.create();
        checkerSystem.update(gameWorld, 16);

        expect(checkerSystem).toBeInstanceOf(CheckerSystem);
        expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.WAITING_BALL);
    });

    it("should register the waiting-ball checker", () => {
        const gameStatusManager = {
            gameStatus: GameStatus.WAITING_BALL,
            scheduleStatusChange: vi.fn(),
        };
        const gameWorld = {
            gameStatusManager,
            players: [{ isSubstitute: false, reachedDestinationPosition: () => true } as Player],
            ball: { movementPosition: { getSpeed: () => 0 } },
        } as unknown as GameWorld;

        CheckerSystemFactory.create().update(gameWorld, 16);

        expect(gameStatusManager.scheduleStatusChange).toHaveBeenCalledWith(
            1500,
            GameStatus.PLAYING,
        );
    });
});

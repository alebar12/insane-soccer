import { GameStatus } from "@/game/enums/GameStatus";
import { Point } from "@/game/geometry/Point";
import { SubstitutionCheckerStrategy } from "@/game/systems/checkers/strategies/SubstitutionCheckerStrategy";
import { WaitingBallCheckerStrategy } from "@/game/systems/checkers/strategies/WaitingBallCheckerStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { describe, expect, it, vi } from "vitest";

describe("SubstitutionCheckerStrategy", () => {
    it("should advance to waiting for the ball when every player is at their initial position", () => {
        const gameStatusManager = { gameStatus: GameStatus.SUBSTITUTION, changeStatus: vi.fn() };
        const gameWorld = {
            gameStatusManager,
            players: [
                {
                    initialPosition: new Point(1, 1),
                    movementPosition: { position: new Point(1, 1) },
                },
            ],
        } as unknown as GameWorld;
        const strategy = new SubstitutionCheckerStrategy();

        expect(strategy.canBeApplied(gameWorld)).toBe(true);
        strategy.apply(gameWorld);

        expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.WAITING_BALL);
    });
});

describe("WaitingBallCheckerStrategy", () => {
    it("should schedule play once active players and the ball have stopped", () => {
        const gameStatusManager = {
            gameStatus: GameStatus.WAITING_BALL,
            scheduleStatusChange: vi.fn(),
        };
        const gameWorld = {
            gameStatusManager,
            players: [
                { isSubstitute: false, reachedDestinationPosition: vi.fn().mockReturnValue(true) },
                { isSubstitute: true, reachedDestinationPosition: vi.fn().mockReturnValue(false) },
            ],
            ball: { movementPosition: { getSpeed: () => 0 } },
        } as unknown as GameWorld;
        const strategy = new WaitingBallCheckerStrategy();

        expect(strategy.canBeApplied(gameWorld)).toBe(true);
        strategy.apply(gameWorld);

        expect(gameStatusManager.scheduleStatusChange).toHaveBeenCalledWith(
            1500,
            GameStatus.PLAYING,
        );
    });
});

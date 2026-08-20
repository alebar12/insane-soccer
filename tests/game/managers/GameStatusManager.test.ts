import { GameStatus } from "@/game/enums/GameStatus";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { EventBus } from "ts-bus";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GameStatusManager", () => {
    let bus: Pick<EventBus, "publish">;
    let gameStatusManager: GameStatusManager;

    beforeEach(() => {
        bus = {
            publish: vi.fn(),
        };
        gameStatusManager = new GameStatusManager(bus as EventBus);
    });

    describe("init", () => {
        it("should start with MENU status", () => {
            expect(gameStatusManager.gameStatus).toBe(GameStatus.MENU);
        });
    });

    describe("changeStatus", () => {
        it("should change status", () => {
            gameStatusManager.update(5000);
            expect(gameStatusManager.isStatusChangedRecently()).toBe(false);
            gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
            expect(gameStatusManager.gameStatus).toBe(GameStatus.WAITING_BALL);
            expect(gameStatusManager.isStatusChangedRecently()).toBe(true);
        });
    });

    describe("schedule status change twice", () => {
        it("should schedule status change", () => {
            gameStatusManager.scheduleStatusChange(1000, GameStatus.WAITING_BALL);
            gameStatusManager.update(100);
            gameStatusManager.scheduleStatusChange(1000, GameStatus.WAITING_BALL);
            expect(gameStatusManager.gameStatus).toBe(GameStatus.MENU);
            gameStatusManager.update(500);
            expect(gameStatusManager.gameStatus).toBe(GameStatus.MENU);
            gameStatusManager.update(500);
            expect(gameStatusManager.gameStatus).toBe(GameStatus.WAITING_BALL);
        });
    });
});

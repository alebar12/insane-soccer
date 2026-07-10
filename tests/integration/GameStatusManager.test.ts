/**
 * Integration test: GameStatusManager + ts-bus EventBus
 *
 * Exercises the real wiring between the status manager and the event bus —
 * no mocks, both components run as-is in production.
 */
import { EventBus } from "ts-bus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameStatus } from "../../src/game/enums/GameStatus";
import { GameStatusManager } from "../../src/game/managers/GameStatusManager";
import { EventBusUtilities } from "../../src/utils/EventBusUtilities";

describe("GameStatusManager (integration with EventBus)", () => {
    let bus: EventBus;
    let manager: GameStatusManager;

    beforeEach(() => {
        bus = new EventBus();
        manager = new GameStatusManager(bus);
    });

    describe("initial state", () => {
        it("should start with MENU status", () => {
            expect(manager.gameStatus).toBe(GameStatus.MENU);
        });

        it("should consider status changed recently at startup", () => {
            expect(manager.isStatusChangedRecently()).toBe(true);
        });
    });

    describe("changeStatus", () => {
        it("should switch to the requested status immediately", () => {
            manager.changeStatus(GameStatus.PLAYING);
            expect(manager.gameStatus).toBe(GameStatus.PLAYING);
        });

        it("should publish a statusChanged event on the bus", () => {
            const handler = vi.fn();
            bus.subscribe(EventBusUtilities.statusChangedEvent, handler);

            manager.changeStatus(GameStatus.PLAYING);

            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0].payload).toBe(GameStatus.PLAYING);
        });

        it("should mark status as recently changed", () => {
            manager.changeStatus(GameStatus.PLAYING);
            expect(manager.isStatusChangedRecently()).toBe(true);
        });
    });

    describe("update — time progression", () => {
        it("should still consider status recent before 300 ms have elapsed", () => {
            manager.changeStatus(GameStatus.PLAYING);
            manager.update(299);
            expect(manager.isStatusChangedRecently()).toBe(true);
        });

        it("should no longer consider status recent after 300 ms have elapsed", () => {
            manager.changeStatus(GameStatus.PLAYING);
            manager.update(300);
            expect(manager.isStatusChangedRecently()).toBe(false);
        });
    });

    describe("scheduleStatusChange", () => {
        it("should not change status before the scheduled delay", () => {
            manager.scheduleStatusChange(500, GameStatus.PLAYING);
            manager.update(499);
            expect(manager.gameStatus).toBe(GameStatus.MENU);
        });

        it("should change status once the delay has elapsed", () => {
            manager.scheduleStatusChange(500, GameStatus.PLAYING);
            manager.update(600);
            expect(manager.gameStatus).toBe(GameStatus.PLAYING);
        });

        it("should emit a statusChanged event when the scheduled change fires", () => {
            const receivedStatuses: GameStatus[] = [];
            bus.subscribe(EventBusUtilities.statusChangedEvent, event => {
                receivedStatuses.push(event.payload);
            });

            manager.scheduleStatusChange(500, GameStatus.PLAYING);
            manager.update(600);

            expect(receivedStatuses).toContain(GameStatus.PLAYING);
        });

        it("should ignore duplicate schedules for the same target status", () => {
            manager.scheduleStatusChange(100, GameStatus.PLAYING);
            manager.scheduleStatusChange(200, GameStatus.PLAYING); // duplicate — ignored

            // Advance enough to trigger only what was scheduled
            manager.update(50); // nothing yet
            expect(manager.gameStatus).toBe(GameStatus.MENU);

            manager.update(100); // now at total 150 ms, past the 100 ms threshold
            expect(manager.gameStatus).toBe(GameStatus.PLAYING);
        });

        it("should remove the event from the queue after it fires", () => {
            manager.scheduleStatusChange(100, GameStatus.PLAYING);
            manager.update(200); // fire

            // Reset status; re-scheduling MENU should be possible (queue is clean)
            manager.changeStatus(GameStatus.MENU);
            manager.scheduleStatusChange(100, GameStatus.PLAYING);
            manager.update(200);

            expect(manager.gameStatus).toBe(GameStatus.PLAYING);
        });
    });
});

import { GameStatus } from "@/game/enums/GameStatus";
import { GateSystem } from "@/game/systems/GateSystem";
import { GameWorld } from "@/game/world/GameWorld";
import { describe, expect, it, vi } from "vitest";

describe("GateSystem", () => {
    it.each([
        [GameStatus.SUBSTITUTION, true],
        [GameStatus.PLAYING, false],
    ])("should update gates with the substitution state", (gameStatus, shouldOpen) => {
        const gates = { update: vi.fn() };
        const gameWorld = { gates, gameStatusManager: { gameStatus } } as unknown as GameWorld;

        new GateSystem().update(gameWorld, 16);

        expect(gates.update).toHaveBeenCalledWith(16, shouldOpen);
    });
});

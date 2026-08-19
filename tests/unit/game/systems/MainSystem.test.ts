import { Keys } from "@/game/enums/Keys";
import { MainSystem } from "@/game/systems/MainSystem";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { describe, expect, it, vi } from "vitest";

describe("MainSystem", () => {
    describe("update", () => {
        it("should delegate to every registered system with the same gameWorld and deltaMs", () => {
            const systemA: SystemInterface = { update: vi.fn() };
            const systemB: SystemInterface = { update: vi.fn() };
            const keyboardInputManager = {} as KeyboardInputManager;
            const mainSystem = new MainSystem([systemA, systemB], keyboardInputManager);
            const gameWorld = {} as GameWorld;
            const deltaMs = 16;

            mainSystem.update(gameWorld, deltaMs);

            expect(systemA.update).toHaveBeenCalledWith(gameWorld, deltaMs);
            expect(systemB.update).toHaveBeenCalledWith(gameWorld, deltaMs);
        });
    });

    describe("forceKeyboardInput", () => {
        it("should forward the pressed keys to the KeyboardInputManager", () => {
            const keyboardInputManager = {
                setPressedKeys: vi.fn(),
            } as unknown as KeyboardInputManager;
            const mainSystem = new MainSystem([], keyboardInputManager);
            const keys = new Set<Keys>([Keys.ARROW_UP, Keys.SPACE]);

            mainSystem.forceKeyboardInput(keys);

            expect(keyboardInputManager.setPressedKeys).toHaveBeenCalledWith(keys);
        });
    });
});

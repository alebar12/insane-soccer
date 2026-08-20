import { Keys } from "@/game/enums/Keys";
import { MainSystem } from "@/game/systems/MainSystem";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("MainSystem", () => {
    let system1: Pick<SystemInterface, "update">;
    let system2: Pick<SystemInterface, "update">;
    let keyboardInputManager: Pick<KeyboardInputManager, "setPressedKeys">;
    let mainSystem: MainSystem;

    beforeEach(() => {
        system1 = { update: vi.fn() };
        system2 = { update: vi.fn() };
        keyboardInputManager = { setPressedKeys: vi.fn() };
        mainSystem = new MainSystem(
            [system1 as SystemInterface, system2 as SystemInterface],
            keyboardInputManager as KeyboardInputManager,
        );
    });

    describe("update", () => {
        it("should delegate to every registered system with the same gameWorld and deltaMs", () => {
            const gameWorld = {} as GameWorld;
            const deltaMs = 16;

            mainSystem.update(gameWorld, deltaMs);

            expect(system1.update).toHaveBeenCalledWith(gameWorld, deltaMs);
            expect(system2.update).toHaveBeenCalledWith(gameWorld, deltaMs);
        });
    });

    describe("forceKeyboardInput", () => {
        it("should forward the pressed keys to the KeyboardInputManager", () => {
            const keys = new Set<Keys>([Keys.ARROW_UP, Keys.SPACE]);
            mainSystem.forceKeyboardInput(keys);
            expect(keyboardInputManager.setPressedKeys).toHaveBeenCalledWith(keys);
        });
    });
});

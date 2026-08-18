import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { Keys } from "@/game/enums/Keys";
import { CheckerSystem } from "@/game/systems/checkers/CheckerSystem";
import { CollisionSystem } from "@/game/systems/collision/CollisionSystem";
import { GateSystem } from "@/game/systems/GateSystem";
import { MainSystem } from "@/game/systems/MainSystem";
import { MovementSystem } from "@/game/systems/movement/MovementSystem";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(import("@/game/systems/movement/MovementSystem"));
vi.mock(import("@/game/systems/collision/CollisionSystem"));
vi.mock(import("@/game/systems/GateSystem"));
vi.mock(import("@/game/systems/checkers/CheckerSystem"));
vi.mock(import("@/input/KeyboardInputManager"));

describe("MainSystem", () => {
    let gameConfigs: GameConfigs;
    let aiToolsWrapper: AiToolsWrapper;

    beforeEach(() => {
        vi.clearAllMocks();
        gameConfigs = {} as GameConfigs;
        aiToolsWrapper = {} as AiToolsWrapper;
    });

    describe("constructor", () => {
        it("should create a KeyboardInputManager and pass it to MovementSystem", () => {
            new MainSystem(gameConfigs, aiToolsWrapper);

            expect(KeyboardInputManager).toHaveBeenCalledTimes(1);
            const keyboardInputManagerInstance = vi.mocked(KeyboardInputManager).mock
                .instances[0];
            expect(MovementSystem).toHaveBeenCalledWith(
                gameConfigs,
                keyboardInputManagerInstance,
                aiToolsWrapper,
            );
        });

        it("should create CollisionSystem with gameConfigs", () => {
            new MainSystem(gameConfigs, aiToolsWrapper);
            expect(CollisionSystem).toHaveBeenCalledWith(gameConfigs);
        });

        it("should create GateSystem and CheckerSystem", () => {
            new MainSystem(gameConfigs, aiToolsWrapper);
            expect(GateSystem).toHaveBeenCalledTimes(1);
            expect(CheckerSystem).toHaveBeenCalledTimes(1);
        });
    });

    describe("update", () => {
        it("should delegate to every registered system with the same gameWorld and deltaMs", () => {
            const mainSystem = new MainSystem(gameConfigs, aiToolsWrapper);
            const gameWorld = {} as GameWorld;
            const deltaMs = 16;

            mainSystem.update(gameWorld, deltaMs);

            const movementInstance = vi.mocked(MovementSystem).mock.instances[0];
            const collisionInstance = vi.mocked(CollisionSystem).mock.instances[0];
            const gateInstance = vi.mocked(GateSystem).mock.instances[0];
            const checkerInstance = vi.mocked(CheckerSystem).mock.instances[0];

            expect(movementInstance.update).toHaveBeenCalledWith(gameWorld, deltaMs);
            expect(collisionInstance.update).toHaveBeenCalledWith(gameWorld, deltaMs);
            expect(gateInstance.update).toHaveBeenCalledWith(gameWorld, deltaMs);
            expect(checkerInstance.update).toHaveBeenCalledWith(gameWorld, deltaMs);
        });
    });

    describe("forceKeyboardInput", () => {
        it("should forward the pressed keys to the KeyboardInputManager", () => {
            const mainSystem = new MainSystem(gameConfigs, aiToolsWrapper);
            const keys = new Set<Keys>([Keys.ARROW_UP, Keys.SPACE]);

            mainSystem.forceKeyboardInput(keys);

            const keyboardInputManagerInstance = vi.mocked(KeyboardInputManager).mock
                .instances[0];
            expect(keyboardInputManagerInstance.setPressedKeys).toHaveBeenCalledWith(keys);
        });
    });
});

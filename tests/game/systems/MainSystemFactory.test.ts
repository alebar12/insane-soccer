import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { GateSystem } from "@/game/systems/GateSystem";
import { MainSystem } from "@/game/systems/MainSystem";
import { MainSystemFactory } from "@/game/systems/MainSystemFactory";
import { CheckerSystemFactory } from "@/game/systems/checkers/CheckerSystemFactory";
import { CollisionSystemFactory } from "@/game/systems/collision/CollisionSystemFactory";
import { MovementSystemFactory } from "@/game/systems/movement/MovementSystemFactory";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { afterEach, describe, expect, it, vi } from "vitest";

interface MainSystemDependencies {
    systems: ReadonlyArray<SystemInterface>;
    keyboardInputManager: KeyboardInputManager;
}

describe("MainSystemFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should compose the ordered system pipeline with one shared keyboard manager", () => {
        const gameConfigs = new GameConfigs(600, 800);
        const aiToolsWrapper = {} as AiToolsWrapper;
        const movementSystem = {} as ReturnType<typeof MovementSystemFactory.create>;
        const collisionSystem = {} as ReturnType<typeof CollisionSystemFactory.create>;
        const checkerSystem = {} as ReturnType<typeof CheckerSystemFactory.create>;

        vi.spyOn(MovementSystemFactory, "create").mockReturnValue(movementSystem);
        vi.spyOn(CollisionSystemFactory, "create").mockReturnValue(collisionSystem);
        vi.spyOn(CheckerSystemFactory, "create").mockReturnValue(checkerSystem);

        const mainSystem = MainSystemFactory.create(gameConfigs, aiToolsWrapper);
        const dependencies = mainSystem as unknown as MainSystemDependencies;

        expect(mainSystem).toBeInstanceOf(MainSystem);
        expect(MovementSystemFactory.create).toHaveBeenCalledWith(
            gameConfigs,
            dependencies.keyboardInputManager,
            aiToolsWrapper,
        );
        expect(CollisionSystemFactory.create).toHaveBeenCalledWith(gameConfigs);
        expect(dependencies.systems).toEqual([
            movementSystem,
            collisionSystem,
            expect.any(GateSystem),
            checkerSystem,
        ]);

        dependencies.keyboardInputManager.dispose();
    });
});

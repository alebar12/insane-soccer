import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { BallAttachedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedStrategy";
import { BallAttachedWithKeyPressedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedWithKeyPressedStrategy";
import { FreeBallStrategy } from "@/game/systems/movement/ballStrategies/FreeBallStrategy";
import { MoveToGoalPowerShotStrategy } from "@/game/systems/movement/ballStrategies/MoveToGoalPowerShotStrategy";
import { WaitingBallStrategy } from "@/game/systems/movement/ballStrategies/WaitingBallStrategy";
import { MovementSystem } from "@/game/systems/movement/MovementSystem";
import { MovementSystemFactory } from "@/game/systems/movement/MovementSystemFactory";
import { AiCpuStrategy } from "@/game/systems/movement/playersStrategies/AiCpuStrategy";
import { MenuStrategy } from "@/game/systems/movement/playersStrategies/MenuStrategy";
import { PlayerInputStrategy } from "@/game/systems/movement/playersStrategies/PlayerInputStrategy";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { ScriptedCpuStrategy } from "@/game/systems/movement/playersStrategies/ScriptedCpuStrategy";
import { StunnedPlayerStrategy } from "@/game/systems/movement/playersStrategies/StunnedPlayerStrategy";
import { SubstitutePlayersStrategy } from "@/game/systems/movement/playersStrategies/SubstitutePlayersStrategy";
import { SubstitutionBeforeSwitchStrategy } from "@/game/systems/movement/playersStrategies/SubstitutionBeforeSwitchStrategy";
import { SubstitutionTrainingStrategy } from "@/game/systems/movement/playersStrategies/SubstitutionTrainingStrategy";
import { WaitingBallPlayerStrategy } from "@/game/systems/movement/playersStrategies/WaitingBallPlayerStrategy";
import { WinningPlayerStrategy } from "@/game/systems/movement/playersStrategies/WinningPlayerStrategy";
import { describe, expect, it } from "vitest";

interface MovementSystemDependencies {
    playerStrategies: Array<PlayerStrategyInterface>;
    ballStrategies: Array<BallStrategyInterface>;
}

describe("MovementSystemFactory", () => {
    it("should register the complete ordered player and ball strategy pipelines", () => {
        const keyboardInputManager = new KeyboardInputManager();
        const movementSystem = MovementSystemFactory.create(
            new GameConfigs(600, 800),
            keyboardInputManager,
            {} as AiToolsWrapper,
        );
        const dependencies = movementSystem as unknown as MovementSystemDependencies;

        expect(movementSystem).toBeInstanceOf(MovementSystem);
        expect(dependencies.playerStrategies.map(strategy => strategy.constructor)).toEqual([
            MenuStrategy,
            WaitingBallPlayerStrategy,
            PlayerInputStrategy,
            ScriptedCpuStrategy,
            AiCpuStrategy,
            StunnedPlayerStrategy,
            WinningPlayerStrategy,
            SubstitutePlayersStrategy,
            SubstitutionTrainingStrategy,
            SubstitutionBeforeSwitchStrategy,
        ]);
        expect(dependencies.ballStrategies.map(strategy => strategy.constructor)).toEqual([
            WaitingBallStrategy,
            FreeBallStrategy,
            BallAttachedStrategy,
            BallAttachedWithKeyPressedStrategy,
            MoveToGoalPowerShotStrategy,
        ]);

        keyboardInputManager.dispose();
    });
});

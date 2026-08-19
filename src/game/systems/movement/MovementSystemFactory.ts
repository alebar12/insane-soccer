import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { MovementSystem } from "./MovementSystem";
import { BallAttachedStrategy } from "./ballStrategies/BallAttachedStrategy";
import { BallAttachedWithKeyPressedStrategy } from "./ballStrategies/BallAttachedWithKeyPressedStrategy";
import { FreeBallStrategy } from "./ballStrategies/FreeBallStrategy";
import { MoveToGoalPowerShotStrategy } from "./ballStrategies/MoveToGoalPowerShotStrategy";
import { WaitingBallStrategy } from "./ballStrategies/WaitingBallStrategy";
import { AiCpuStrategy } from "./playersStrategies/AiCpuStrategy";
import { MenuStrategy } from "./playersStrategies/MenuStrategy";
import { PlayerInputStrategy } from "./playersStrategies/PlayerInputStrategy";
import { ScriptedCpuStrategy } from "./playersStrategies/ScriptedCpuStrategy";
import { StunnedPlayerStrategy } from "./playersStrategies/StunnedPlayerStrategy";
import { SubstitutePlayersStrategy } from "./playersStrategies/SubstitutePlayersStrategy";
import { SubstitutionBeforeSwitchStrategy } from "./playersStrategies/SubstitutionBeforeSwitchStrategy";
import { SubstitutionTrainingStrategy } from "./playersStrategies/SubstitutionTrainingStrategy";
import { WaitingBallPlayerStrategy } from "./playersStrategies/WaitingBallPlayerStrategy";
import { WinningPlayerStrategy } from "./playersStrategies/WinningPlayerStrategy";

export class MovementSystemFactory {
    public static create(
        gameConfigs: GameConfigs,
        keyboardInputManager: KeyboardInputManager,
        aiToolsWrapper: AiToolsWrapper,
    ): MovementSystem {
        return new MovementSystem(
            [
                new MenuStrategy(gameConfigs),
                new WaitingBallPlayerStrategy(),
                new PlayerInputStrategy(keyboardInputManager),
                new ScriptedCpuStrategy(gameConfigs),
                new AiCpuStrategy(aiToolsWrapper),
                new StunnedPlayerStrategy(gameConfigs),
                new WinningPlayerStrategy(gameConfigs),
                new SubstitutePlayersStrategy(gameConfigs),
                new SubstitutionTrainingStrategy(gameConfigs),
                new SubstitutionBeforeSwitchStrategy(),
            ],
            [
                new WaitingBallStrategy(),
                new FreeBallStrategy(),
                new BallAttachedStrategy(),
                new BallAttachedWithKeyPressedStrategy(keyboardInputManager),
                new MoveToGoalPowerShotStrategy(gameConfigs),
            ],
        );
    }
}

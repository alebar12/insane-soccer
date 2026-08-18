import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { BallAttachedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedStrategy";
import { BallAttachedWithKeyPressedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedWithKeyPressedStrategy";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { FreeBallStrategy } from "@/game/systems/movement/ballStrategies/FreeBallStrategy";
import { MoveToGoalPowerShotStrategy } from "@/game/systems/movement/ballStrategies/MoveToGoalPowerShotStrategy";
import { WaitingBallStrategy } from "@/game/systems/movement/ballStrategies/WaitingBallStrategy";
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
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";

export class MovementSystem implements SystemInterface {
    private playerStrategies: Array<PlayerStrategyInterface> = [];
    private ballStrategies: Array<BallStrategyInterface> = [];

    public constructor(
        gameConfigs: GameConfigs,
        keyboardInputManager: KeyboardInputManager,
        aiToolsWrapper: AiToolsWrapper,
    ) {
        this.playerStrategies.push(new MenuStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallPlayerStrategy());
        this.playerStrategies.push(new PlayerInputStrategy(keyboardInputManager));
        this.playerStrategies.push(new ScriptedCpuStrategy(gameConfigs));
        this.playerStrategies.push(new AiCpuStrategy(aiToolsWrapper));
        this.playerStrategies.push(new StunnedPlayerStrategy(gameConfigs));
        this.playerStrategies.push(new WinningPlayerStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutePlayersStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutionTrainingStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutionBeforeSwitchStrategy());

        this.ballStrategies.push(new WaitingBallStrategy());
        this.ballStrategies.push(new FreeBallStrategy());
        this.ballStrategies.push(new BallAttachedStrategy());
        this.ballStrategies.push(new BallAttachedWithKeyPressedStrategy(keyboardInputManager));
        this.ballStrategies.push(new MoveToGoalPowerShotStrategy(gameConfigs));
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.updatePlayers(gameWorld, deltaMs);
        this.updateBall(gameWorld, deltaMs);
    }

    private updatePlayers(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.players.forEach(player => {
            this.playerStrategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.stunnedWrapper.decrementStunnedValue(deltaMs, player.movementPosition.position);
            player.updatePowerShot(deltaMs);
            player.bounceWrapper.update(deltaMs);
            player.move(deltaMs);
        });
    }

    private updateBall(gameWorld: GameWorld, deltaMs: number): void {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
        gameWorld.ball.updateTrajectory(deltaMs);
    }
}

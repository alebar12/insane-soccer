import { KeyboardInputManager } from "../../../input/KeyboardInputManager";
import { GameConfigs } from "../../../utils/GameConfigs";
import { GameWorld } from "../../world/GameWorld";
import { SystemInterface } from "../SystemInterface";
import { BallAttachedWithKeyPressedStrategy } from "./ballStrategies/BallAttachedWithKeyPressedStrategy";
import { BallAttachedWithoutKeyPressedStrategy } from "./ballStrategies/BallAttachedWithoutKeyPressedStrategy";
import { BallStrategyInterface } from "./ballStrategies/BallStrategyInterface";
import { FreeBallStrategy } from "./ballStrategies/FreeBallStrategy";
import { MoveToGoalPowerShotStrategy } from "./ballStrategies/MoveToGoalPowerShotStrategy";
import { WaitingBallStrategy } from "./ballStrategies/WaitingBallStrategy";
import { CpuStrategy } from "./playersStrategies/CpuStrategy";
import { MenuStrategy } from "./playersStrategies/MenuStrategy";
import { PlayerInputStrategy } from "./playersStrategies/PlayerInputStrategy";
import { PlayerStrategyInterface } from "./playersStrategies/PlayerStrategyInterface";
import { StunnedPlayerStrategy } from "./playersStrategies/StunnedPlayerStrategy";
import { SubstitutePlayersStrategy } from "./playersStrategies/SubstitutePlayersStrategy";
import { SubstitutionBeforeSwitchStrategy } from "./playersStrategies/SubstitutionBeforeSwitchStrategy";
import { SubstitutionTrainingStrategy } from "./playersStrategies/SubstitutionTrainingStrategy";
import { WaitingBallPlayerStrategy } from "./playersStrategies/WaitingBallPlayerStrategy";
import { WinningPlayerStrategy } from "./playersStrategies/WinningPlayerStrategy";

export class MovementSystem implements SystemInterface {
    private playerStrategies: Array<PlayerStrategyInterface> = [];
    private ballStrategies: Array<BallStrategyInterface> = [];

    public constructor(gameConfigs: GameConfigs, keyboardInputManager: KeyboardInputManager) {
        this.playerStrategies.push(new MenuStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallPlayerStrategy());
        this.playerStrategies.push(new PlayerInputStrategy(keyboardInputManager));
        this.playerStrategies.push(new CpuStrategy(gameConfigs));
        this.playerStrategies.push(new StunnedPlayerStrategy(gameConfigs));
        this.playerStrategies.push(new WinningPlayerStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutePlayersStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutionTrainingStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutionBeforeSwitchStrategy());

        this.ballStrategies.push(new WaitingBallStrategy());
        this.ballStrategies.push(new FreeBallStrategy());
        this.ballStrategies.push(new BallAttachedWithoutKeyPressedStrategy(keyboardInputManager));
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

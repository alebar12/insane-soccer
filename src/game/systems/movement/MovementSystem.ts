import { KeyboardInputManager } from "../../../input/KeyboardInputManager";
import { GameConfigs } from "../../../utils/GameConfigs";
import { GameWorld } from "../../world/GameWorld";
import { SystemInterface } from "../SystemInterface";
import { AttachedWithKeyPressedBallMovementStrategy } from "./ballStrategies/AttachedWithKeyPressedBallMovementStrategy";
import { AttachedWithoutKeyPressedBallMovementStrategy } from "./ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy";
import { BallMovementStrategyInterface } from "./ballStrategies/BallMovementStrategyInterface";
import { PlayingFreeBallMovementStrategy } from "./ballStrategies/PlayingFreeBallMovementStrategy";
import { WaitingBallBallMovementStrategy } from "./ballStrategies/WaitingBallBallMovementStrategy";
import { InputPlayerMovementStrategy } from "./playersStrategies/InputPlayerMovementStrategy";
import { MenuMovementStrategy } from "./playersStrategies/MenuMovementStrategy";
import { PlayerMovementStrategyInterface } from "./playersStrategies/PlayerMovementStrategyInterface";
import { StunnedPlayerMovementStrategy } from "./playersStrategies/StunnedPlayerMovementStrategy";
import { WaitingBallMovementStrategy } from "./playersStrategies/WaitingBallMovementStrategy";
import { WinningPlayerMovementStrategy } from "./playersStrategies/WinningPlayerMovementStrategy";

export class MovementSystem implements SystemInterface {
    private playerStrategies: Array<PlayerMovementStrategyInterface> = [];
    private ballStrategies: Array<BallMovementStrategyInterface> = [];

    public constructor(gameConfigs: GameConfigs, keyboardInputManager: KeyboardInputManager) {
        this.playerStrategies.push(new MenuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallMovementStrategy());
        this.playerStrategies.push(new InputPlayerMovementStrategy(keyboardInputManager));
        //this.playerStrategies.push(new CpuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new StunnedPlayerMovementStrategy());
        this.playerStrategies.push(new WinningPlayerMovementStrategy(gameConfigs));

        this.ballStrategies.push(new WaitingBallBallMovementStrategy());
        this.ballStrategies.push(new PlayingFreeBallMovementStrategy());
        this.ballStrategies.push(
            new AttachedWithoutKeyPressedBallMovementStrategy(keyboardInputManager),
        );
        this.ballStrategies.push(
            new AttachedWithKeyPressedBallMovementStrategy(keyboardInputManager),
        );
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
            player.decrementStunnedValue(deltaMs);
            player.move(deltaMs);
        });
    }

    private updateBall(gameWorld: GameWorld, deltaMs: number): void {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
    }
}

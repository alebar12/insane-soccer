import { KeyboardInputManager } from "../../input/KeyboardInputManager";
import { GameConfigs } from "../../utils/GameConfigs";
import { GameWorld } from "../world/GameWorld";
import { AbstractBallMovementStrategy } from "./ballMovementStrategies/AbstractBallMovementStrategy";
import { AttachedWithKeyPressedBallMovementStrategy } from "./ballMovementStrategies/AttachedWithKeyPressedBallMovementStrategy";
import { AttachedWithoutKeyPressedBallMovementStrategy } from "./ballMovementStrategies/AttachedWithoutKeyPressedBallMovementStrategy";
import { PlayingFreeBallMovementStrategy } from "./ballMovementStrategies/PlayingFreeBallMovementStrategy";
import { WaitingBallBallMovementStrategy } from "./ballMovementStrategies/WaitingBallBallMovementStrategy";
import { AbstractPlayerMovementStrategy } from "./playersMovementStrategies/AbstractPlayerMovementStrategy";
import { InputPlayerMovementStrategy } from "./playersMovementStrategies/InputPlayerMovementStrategy";
import { MenuMovementStrategy } from "./playersMovementStrategies/MenuMovementStrategy";
import { WaitingBallMovementStrategy } from "./playersMovementStrategies/WaitingBallMovementStrategy";

export class MovementSystem {
    private playerStrategies: Array<AbstractPlayerMovementStrategy> = [];
    private ballStrategies: Array<AbstractBallMovementStrategy> = [];

    public constructor(gameConfigs: GameConfigs, keyboardInputManager: KeyboardInputManager) {
        this.playerStrategies.push(new MenuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallMovementStrategy());
        this.playerStrategies.push(new InputPlayerMovementStrategy(keyboardInputManager));

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
            player.move(deltaMs);
        });
    }

    private updateBall(gameWorld: GameWorld, deltaMs: number): void {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
    }
}

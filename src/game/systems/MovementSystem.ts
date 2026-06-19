import { GameConfigs } from "../../utils/GameConfigs";
import { GameStatus } from "../status/GameStatus";
import { GameWorld } from "../world/GameWorld";
import { AbstractMovementStrategy } from "./playersMovementStrategies/AbstractPlayerMovementStrategy";
import { MenuMovementStrategy } from "./playersMovementStrategies/MenuMovementStrategy";
import { WaitingBallMovementStrategy } from "./playersMovementStrategies/WaitingBallMovementStrategy";

export class MovementSystem {
    private strategies: Array<AbstractMovementStrategy> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.strategies.push(new MenuMovementStrategy(gameConfigs));
        this.strategies.push(new WaitingBallMovementStrategy());
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.updatePlayers(gameWorld, deltaMs);
        this.updateBall(gameWorld, deltaMs);
    }

    private updatePlayers(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.players.forEach(player => {
            this.strategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.move(deltaMs);
        });
    }

    private updateBall(gameWorld: GameWorld, deltaMs: number): void {
        switch (gameWorld.gameStatusManager.gameStatus) {
            case GameStatus.WAITING_BALL:
                gameWorld.ball.setForStartGame();
                break;

            case GameStatus.PLAYING:
                gameWorld.ball.move(deltaMs);
                break;
        }
    }
}

import { KeyboardInputManager } from "../../input/KeyboardInputManager";
import { GameConfigs } from "../../utils/GameConfigs";
import { BallStatus } from "../enums/BallStatus";
import { GameStatus } from "../enums/GameStatus";
import { GameWorld } from "../world/GameWorld";
import { AbstractPlayerMovementStrategy } from "./playersMovementStrategies/AbstractPlayerMovementStrategy";
import { InputPlayerMovementStrategy } from "./playersMovementStrategies/InputPlayerMovementStrategy";
import { MenuMovementStrategy } from "./playersMovementStrategies/MenuMovementStrategy";
import { WaitingBallMovementStrategy } from "./playersMovementStrategies/WaitingBallMovementStrategy";

export class MovementSystem {
    private readonly angleTollerance: number = Math.PI / 30;
    private strategies: Array<AbstractPlayerMovementStrategy> = [];

    public constructor(gameConfigs: GameConfigs, keyboardInputManager: KeyboardInputManager) {
        this.strategies.push(new MenuMovementStrategy(gameConfigs));
        this.strategies.push(new WaitingBallMovementStrategy());
        this.strategies.push(new InputPlayerMovementStrategy(keyboardInputManager));
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
                this.updateBallDuringPlaying(gameWorld, deltaMs);
                break;
        }
    }

    private updateBallDuringPlaying(gameWorld: GameWorld, deltaMs: number): void {
        switch (gameWorld.ball.ballStatus) {
            case BallStatus.FREE:
                gameWorld.ball.move(deltaMs);
                break;

            case BallStatus.ATTACHED:
                const ball = gameWorld.ball;
                const player = ball.attachedPlayer;
                if (!player) {
                    break;
                }
                const combinedSize = player.movementPosition.size + ball.movementPosition.size;

                ball.movementPosition.position.x =
                    player.movementPosition.position.x + Math.cos(ball.angleWithPlayer) * combinedSize;
                ball.movementPosition.position.y =
                    player.movementPosition.position.y + Math.sin(ball.angleWithPlayer) * combinedSize;

                const speed = player.movementPosition.getSpeed();
                if (speed > 0) {
                    const targetAngle = player.movementPosition.getSpeedAngle() + Math.PI;
                    const angleDifference = this.normalizeAngle(targetAngle - ball.angleWithPlayer);
                    if (Math.abs(angleDifference) > this.angleTollerance) {
                        const step = (speed / player.maxSpeedWithBall) * 0.01 * deltaMs;
                        ball.angleWithPlayer += angleDifference > 0 ? step : -step;
                    }
                    ball.angleWithPlayer = this.normalizeAngle(ball.angleWithPlayer);
                }

                break;
        }
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }
}

import { Ball } from "../../../entities/Ball";
import { GameStatus } from "../../../enums/GameStatus";
import { GameWorld } from "../../../world/GameWorld";
import { BallMovementStrategyInterface } from "./BallMovementStrategyInterface";

export class WaitingBallBallMovementStrategy implements BallMovementStrategyInterface {
    public canBeApplied(_ball: Ball, gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL || 
            gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME;
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        if (ball.movementPosition.getSpeed() > 0) {
            ball.move(deltaMs);
        } else {
            ball.resetToStartGame();
        }
    }
}

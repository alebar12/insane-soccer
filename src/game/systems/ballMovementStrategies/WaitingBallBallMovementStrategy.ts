import { Ball } from "../../entities/Ball";
import { GameStatus } from "../../enums/GameStatus";
import { GameWorld } from "../../world/GameWorld";
import { AbstractBallMovementStrategy } from "./AbstractBallMovementStrategy";

export class WaitingBallBallMovementStrategy extends AbstractBallMovementStrategy {
    public canBeApplied(_ball: Ball, gameWorld: GameWorld): boolean {
        return gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL;
    }

    public apply(ball: Ball, _gameWorld: GameWorld, _deltaMs: number): void {
        ball.setForStartGame();
    }
}

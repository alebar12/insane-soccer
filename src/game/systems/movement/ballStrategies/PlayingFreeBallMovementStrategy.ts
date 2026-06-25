import { Ball } from "../../../entities/Ball";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { GameWorld } from "../../../world/GameWorld";
import { BallMovementStrategyInterface } from "./BallMovementStrategyInterface";

export class PlayingFreeBallMovementStrategy implements BallMovementStrategyInterface {
    public canBeApplied(ball: Ball, gameWorld: GameWorld): boolean {
        return (
            ball.ballStatus === BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING
        );
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        ball.setForStartGame();
        ball.move(deltaMs);
    }
}

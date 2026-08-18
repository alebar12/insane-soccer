import { Ball } from "@/game/entities/Ball";
import { GameStatus } from "@/game/enums/GameStatus";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class WaitingBallStrategy implements BallStrategyInterface {
    public canBeApplied(_ball: Ball, gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL ||
            gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME ||
            gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION
        );
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        if (ball.movementPosition.getSpeed() > 0) {
            ball.move(deltaMs);
        } else {
            ball.resetToStartGame();
        }
    }
}

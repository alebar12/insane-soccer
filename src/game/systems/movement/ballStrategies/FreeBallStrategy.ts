import { Ball } from "@/game/entities/Ball";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class FreeBallStrategy implements BallStrategyInterface {
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

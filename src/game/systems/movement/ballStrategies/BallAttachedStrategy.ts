import { Ball } from "@/game/entities/Ball";
import { Player } from "@/game/entities/Player";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class BallAttachedStrategy implements BallStrategyInterface {
    private readonly angleTollerance: number = Math.PI / 30;

    public canBeApplied(ball: Ball, gameWorld: GameWorld): boolean {
        return (
            ball.ballStatus === BallStatus.ATTACHED &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING
        );
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        const player = ball.attachedPlayer;
        if (player === null) {
            return;
        }
        this.adjustBallPositionAroundPlayer(ball, player, deltaMs);
    }

    private adjustBallPositionAroundPlayer(ball: Ball, player: Player, deltaMs: number): void {
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
                const step = (speed / player.normalMaxSpeed) * 0.01 * deltaMs;
                ball.angleWithPlayer += angleDifference > 0 ? step : -step;
            } else {
                ball.angleWithPlayer = targetAngle;
            }
            ball.angleWithPlayer = this.normalizeAngle(ball.angleWithPlayer);
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

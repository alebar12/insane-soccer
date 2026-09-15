import { Ball } from "@/game/entities/Ball";
import { Player } from "@/game/entities/Player";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class BallAttachedStrategy implements BallStrategyInterface {
    private readonly angleTollerance: number = Math.PI / 30;
    private readonly boundarySearchIterations: number = 24;

    public constructor(private readonly gameConfigs: GameConfigs) {}

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
        let targetAngle = ball.angleWithPlayer;
        let step = 0;
        const speed = player.movementPosition.getSpeed();
        if (speed > 0) {
            targetAngle = this.normalizeAngle(player.movementPosition.getSpeedAngle() + Math.PI);
            step = (speed / player.normalMaxSpeed) * 0.01 * deltaMs;
        }
        targetAngle = this.getTargetAngle(ball, player, targetAngle);
        const nextAngle = this.getNextAngle(ball.angleWithPlayer, targetAngle, step);

        const safeAngle = this.getSafeAngle(ball, player, targetAngle, nextAngle);
        if (safeAngle === null) {
            return;
        }

        ball.angleWithPlayer = safeAngle;
        this.setBallPosition(ball, player, safeAngle);
    }

    private getTargetAngle(ball: Ball, player: Player, desiredAngle: number): number {
        if (this.isInsideField(ball, player, desiredAngle)) {
            return desiredAngle;
        }

        const position = this.getBallPosition(ball, player, desiredAngle);
        const ballSize = ball.movementPosition.size;
        const left = this.gameConfigs.fieldXOffset + ballSize;
        const right = this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth - ballSize;
        const top = this.gameConfigs.fieldBorderSize + ballSize;
        const bottom = this.gameConfigs.fieldHeight - this.gameConfigs.fieldBorderSize - ballSize;
        const inwardX = position.x < left ? 1 : position.x > right ? -1 : 0;
        const inwardY = position.y < top ? 1 : position.y > bottom ? -1 : 0;

        return Math.atan2(inwardY, inwardX);
    }

    private getNextAngle(currentAngle: number, targetAngle: number, step: number): number {
        const angleDifference = this.normalizeAngle(targetAngle - currentAngle);
        if (Math.abs(angleDifference) <= this.angleTollerance) {
            return targetAngle;
        }
        return this.normalizeAngle(
            currentAngle + Math.sign(angleDifference) * Math.min(step, Math.abs(angleDifference)),
        );
    }

    private getSafeAngle(
        ball: Ball,
        player: Player,
        targetAngle: number,
        nextAngle: number,
    ): number | null {
        if (!this.isInsideField(ball, player, ball.angleWithPlayer)) {
            if (!this.isInsideField(ball, player, targetAngle)) {
                return null;
            }
            return this.findFirstInsideAngle(ball, player, ball.angleWithPlayer, targetAngle);
        }
        if (this.isInsideField(ball, player, nextAngle)) {
            return nextAngle;
        }

        const rotation = this.normalizeAngle(nextAngle - ball.angleWithPlayer);
        const oppositeAngle = this.normalizeAngle(ball.angleWithPlayer - rotation);
        if (this.isInsideField(ball, player, oppositeAngle)) {
            return oppositeAngle;
        }
        return ball.angleWithPlayer;
    }

    private findFirstInsideAngle(
        ball: Ball,
        player: Player,
        outsideAngle: number,
        insideAngle: number,
    ): number {
        const rotation = this.normalizeAngle(insideAngle - outsideAngle);
        let outsideRatio = 0;
        let insideRatio = 1;
        for (let i = 0; i < this.boundarySearchIterations; i++) {
            const ratio = (outsideRatio + insideRatio) / 2;
            const angle = this.normalizeAngle(outsideAngle + rotation * ratio);
            if (this.isInsideField(ball, player, angle)) {
                insideRatio = ratio;
            } else {
                outsideRatio = ratio;
            }
        }
        return this.normalizeAngle(outsideAngle + rotation * insideRatio);
    }

    private isInsideField(ball: Ball, player: Player, angle: number): boolean {
        const position = this.getBallPosition(ball, player, angle);
        const ballSize = ball.movementPosition.size;

        return (
            position.x >= this.gameConfigs.fieldXOffset + ballSize &&
            position.x <= this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth - ballSize &&
            position.y >= this.gameConfigs.fieldBorderSize + ballSize &&
            position.y <= this.gameConfigs.fieldHeight - this.gameConfigs.fieldBorderSize - ballSize
        );
    }

    private setBallPosition(ball: Ball, player: Player, angle: number): void {
        const position = this.getBallPosition(ball, player, angle);
        ball.movementPosition.position.x = position.x;
        ball.movementPosition.position.y = position.y;
    }

    private getBallPosition(ball: Ball, player: Player, angle: number): { x: number; y: number } {
        const combinedSize = player.movementPosition.size + ball.movementPosition.size;
        return {
            x: player.movementPosition.position.x + Math.cos(angle) * combinedSize,
            y: player.movementPosition.position.y + Math.sin(angle) * combinedSize,
        };
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

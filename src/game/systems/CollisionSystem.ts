import { GameConfigs } from "../../utils/GameConfigs";
import { Player } from "../entities/Player";
import { BallStatus } from "../enums/BallStatus";
import { BorderLimits } from "../geometry/BorderLimits";
import { MovementPoint } from "../geometry/MovementPoint";
import { Point } from "../geometry/Point";
import { GameWorld } from "../world/GameWorld";

export class CollisionSystem {
    public constructor(private gameConfigs: GameConfigs) {}

    public update(gameWorld: GameWorld): void {
        this.checkBallBorderCollisions(gameWorld);
        this.checkPlayerBorderCollisions(gameWorld);
        this.checkBallPlayerCollision(gameWorld);
        this.checkPlayerCollisions(gameWorld);
    }

    private checkBallBorderCollisions(gameWorld: GameWorld): void {
        // TODO to add handleGoalPostsCollision

        this.handleBorderCollision(
            gameWorld.ball.movementPosition,
            this.getFieldBorderLimits(gameWorld.ball.movementPosition.size),
            true,
        );
    }

    private checkPlayerBorderCollisions(gameWorld: GameWorld): void {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
                this.handleBorderCollision(
                    player.movementPosition,
                    this.getFieldBorderLimits(player.movementPosition.size),
                    false,
                );
            });
    }

    private getFieldBorderLimits(size: number): BorderLimits {
        const cfg = this.gameConfigs;
        return new BorderLimits(
            cfg.fieldXOffset + size,
            cfg.fieldXOffset + cfg.fieldWidth - size,
            cfg.fieldBorderSize + size,
            cfg.fieldHeight - cfg.fieldBorderSize - size,
        );
    }

    private handleBorderCollision(
        movementPoint: MovementPoint,
        borderLimits: BorderLimits,
        invertSpeed: boolean,
    ): void {
        if (movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            if (invertSpeed) {
                movementPoint.velocity.x = Math.abs(movementPoint.velocity.x);
            } else {
                movementPoint.velocity.x = Math.max(0, movementPoint.velocity.x);
            }
        }
        if (movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            if (invertSpeed) {
                movementPoint.velocity.x = -Math.abs(movementPoint.velocity.x);
            } else {
                movementPoint.velocity.x = Math.min(0, movementPoint.velocity.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            if (invertSpeed) {
                movementPoint.velocity.y = Math.abs(movementPoint.velocity.y);
            } else {
                movementPoint.velocity.y = Math.max(0, movementPoint.velocity.y);
            }
        }
        if (movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            if (invertSpeed) {
                movementPoint.velocity.y = -Math.abs(movementPoint.velocity.y);
            } else {
                movementPoint.velocity.y = Math.min(0, movementPoint.velocity.y);
            }
        }
    }

    private checkBallPlayerCollision(gameWorld: GameWorld): void {
        if (gameWorld.ball.ballStatus === BallStatus.FREE) {
            gameWorld.players
                .filter(player => !player.isSubstitute)
                .forEach(player => {
                    if (
                        MovementPoint.areTouching(
                            gameWorld.ball.movementPosition,
                            player.movementPosition,
                        )
                    ) {
                        gameWorld.ball.attachToPlayer(player);
                    }
                });
        }
    }

    private checkPlayerCollisions(gameWorld: GameWorld): void {
        const humanPlayer = gameWorld.players.find(player => !player.isSubstitute && !player.isCpu);
        const cpuPlayer = gameWorld.players.find(player => !player.isSubstitute && player.isCpu);

        if (humanPlayer === undefined || cpuPlayer === undefined) {
            return;
        }

        if (MovementPoint.areTouching(humanPlayer.movementPosition, cpuPlayer.movementPosition)) {
            const intersectionPoint = new Point(
                (humanPlayer.movementPosition.position.x + cpuPlayer.movementPosition.position.x) /
                    2,
                (humanPlayer.movementPosition.position.y + cpuPlayer.movementPosition.position.y) /
                    2,
            );
            const collisionSpeed =
                (humanPlayer.movementPosition.getSpeed() + cpuPlayer.movementPosition.getSpeed()) /
                2;
            this.bouncePlayers(humanPlayer, cpuPlayer, intersectionPoint, collisionSpeed);
            this.bouncePlayers(cpuPlayer, humanPlayer, intersectionPoint, collisionSpeed);

            const ball = gameWorld.ball;
            if (ball.ballStatus === BallStatus.ATTACHED) {
                ball.movementPosition.setSpeed(
                    collisionSpeed,
                    Point.getAngleBetweenPoints(intersectionPoint, ball.movementPosition.position),
                );
                ball.ballStatus = BallStatus.FREE;
            }
        }
    }

    private bouncePlayers(
        player1: Player,
        player2: Player,
        intersectionPoint: Point,
        collisionSpeed: number,
    ): void {
        const angle =
            Point.getAngleBetweenPoints(player1.movementPosition.position, intersectionPoint) -
            Math.PI;
        player1.movementPosition.setSpeed(collisionSpeed, angle);
        player1.movementPosition.position.x =
            intersectionPoint.x + Math.cos(angle) * player2.movementPosition.size;
        player1.movementPosition.position.y =
            intersectionPoint.y + Math.sin(angle) * player2.movementPosition.size;
    }
}

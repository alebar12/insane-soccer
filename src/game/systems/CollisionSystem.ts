import { GameConfigs } from "../../utils/GameConfigs";
import { Player } from "../entities/Player";
import { BallStatus } from "../enums/BallStatus";
import { GameStatus } from "../enums/GameStatus";
import { PlayerSide } from "../enums/PlayerSide";
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

        if (this.handleBallInsideGoalCollision(gameWorld, PlayerSide.LEFT)) {
            return;
        }

        if (this.handleBallInsideGoalCollision(gameWorld, PlayerSide.RIGHT)) {
            return;
        }

        this.handleBorderCollision(
            gameWorld.ball.movementPosition,
            this.getFieldBorderLimits(gameWorld.ball.movementPosition.size),
            true,
            false,
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
        avoidBounceOnGoal: boolean = true,
    ): void {
        const cfg = this.gameConfigs;
        const isInGoalYRange =
            !avoidBounceOnGoal &&
            movementPoint.position.y >= cfg.goalYOffset &&
            movementPoint.position.y <= cfg.goalYOffset + cfg.goalHeight;

        if (!isInGoalYRange && movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            if (invertSpeed) {
                movementPoint.velocity.x = Math.abs(movementPoint.velocity.x);
            } else {
                movementPoint.velocity.x = Math.max(0, movementPoint.velocity.x);
            }
        }
        if (!isInGoalYRange && movementPoint.position.x > borderLimits.right) {
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

    private handleBallInsideGoalCollision(gameWorld: GameWorld, playerSide: PlayerSide): boolean {
        const ballMovement = gameWorld.ball.movementPosition;

        if (!this.isBallInsideGoal(ballMovement, playerSide)) {
            return false;
        }

        if (gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING) {
            gameWorld.score.increaseScore(playerSide);
            gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        }

        this.handleBorderCollision(
            ballMovement,
            this.getGoalBorderLimits(ballMovement.size, playerSide),
            true,
            true,
        );

        return true;
    }

    private isBallInsideGoal(ballMovement: MovementPoint, playerSide: PlayerSide): boolean {
        const cfg = this.gameConfigs;
        const position = ballMovement.position;

        const insideGoalYRange =
            position.y >= cfg.goalYOffset && position.y <= cfg.goalYOffset + cfg.goalHeight;
        if (!insideGoalYRange) {
            return false;
        }

        if (playerSide === PlayerSide.LEFT) {
            return position.x < cfg.fieldXOffset;
        }

        return position.x > cfg.fieldXOffset + cfg.fieldWidth;
    }

    private getGoalBorderLimits(size: number, playerSide: PlayerSide): BorderLimits {
        const cfg = this.gameConfigs;
        const top = cfg.goalYOffset + size;
        const bottom = cfg.goalYOffset + cfg.goalHeight - size;

        if (playerSide === PlayerSide.LEFT) {
            return new BorderLimits(size, cfg.fieldXOffset - size, top, bottom);
        }

        return new BorderLimits(
            cfg.fieldXOffset + cfg.fieldWidth + size,
            cfg.width - size,
            top,
            bottom,
        );
    }
}

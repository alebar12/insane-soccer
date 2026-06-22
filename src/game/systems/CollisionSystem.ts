import { BorderLimits } from "../geometry/BorderLimits";
import { GameConfigs } from "../../utils/GameConfigs";
import { GameWorld } from "../world/GameWorld";
import { MovementPoint } from "../geometry/MovementPoint";
import { BallStatus } from "../enums/BallStatus";

export class CollisionSystem {
    public constructor(private gameConfigs: GameConfigs) {}
    
    public update(gameWorld: GameWorld): void {
        this.checkBallBorderCollisions(gameWorld);
        this.checkPlayerBorderCollisions(gameWorld);
        this.checkBallPlayerCollision(gameWorld);
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
                if (MovementPoint.areTouching(
                    gameWorld.ball.movementPosition,
                    player.movementPosition,
                )) {
                    gameWorld.ball.attachToPlayer(player);
                }
            });
        }
        
    }
}

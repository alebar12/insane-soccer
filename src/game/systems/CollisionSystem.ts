import { BorderLimits } from "../../utils/BorderLimits";
import { GameConfigs } from "../../utils/GameConfigs";
import { MovementPoint } from "../../utils/MovementPoint";
import { GameWorld } from "../world/GameWorld";

export class CollisionSystem {
    public constructor(private gameConfigs: GameConfigs) {}

    public update(gameWorld: GameWorld): void {
        this.checkBallCollisions(gameWorld);
        //this.checkPlayerCollisions(gameWorld);
    }

    private checkBallCollisions(gameWorld: GameWorld): void {
        // TODO to add handleGoalPostsCollision

        this.handleBorderCollision(
            gameWorld.ball.movementPosition,
            this.getFieldBorderLimits(gameWorld.ball.movementPosition.size),
            true,
        );
    }

    /*private checkPlayerCollisions(gameWorld: GameWorld): void {
        
    }*/

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
                movementPoint.speed.x = Math.abs(movementPoint.speed.x);
            }
        }
        if (movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            if (invertSpeed) {
                movementPoint.speed.x = -Math.abs(movementPoint.speed.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            if (invertSpeed) {
                movementPoint.speed.y = Math.abs(movementPoint.speed.y);
            }
        }
        if (movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            if (invertSpeed) {
                movementPoint.speed.y = -Math.abs(movementPoint.speed.y);
            }
        }
    }
}

import { GameConfigs } from "../../../../utils/GameConfigs";
import { PlayerSide } from "../../../enums/PlayerSide";
import { BorderLimits } from "../../../geometry/BorderLimits";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { GameWorld } from "../../../world/GameWorld";

export abstract class AbstractCollisionStrategy {
    protected constructor(protected gameConfigs: GameConfigs) {}

    abstract canBeApplied(gameWorld: GameWorld): boolean;

    abstract apply(gameWorld: GameWorld): void;

    protected getFieldBorderLimits(size: number): BorderLimits {
        const cfg = this.gameConfigs;
        return new BorderLimits(
            cfg.fieldXOffset + size,
            cfg.fieldXOffset + cfg.fieldWidth - size,
            cfg.fieldBorderSize + size,
            cfg.fieldHeight - cfg.fieldBorderSize - size,
        );
    }

    protected handleBorderCollision(
        movementPoint: MovementPoint,
        borderLimits: BorderLimits,
        invertSpeed: boolean,
        avoidBounceOnGoal: boolean = true,
        avoidBounceOnSubstitution: boolean = false,
    ): boolean {
        const cfg = this.gameConfigs;
        const isInGoalYRange =
            !avoidBounceOnGoal &&
            movementPoint.position.y >= cfg.goalYOffset &&
            movementPoint.position.y <= cfg.goalYOffset + cfg.goalHeight;
        const isInSubstitutionYRange =
            avoidBounceOnSubstitution &&
            ((movementPoint.position.x >= cfg.playerSubstitutionX - cfg.gatesLength / 2 &&
                movementPoint.position.x <= cfg.playerSubstitutionX + cfg.gatesLength / 2) ||
                (movementPoint.position.x >= cfg.cpuSubstitutionX - cfg.gatesLength / 2 &&
                    movementPoint.position.x <= cfg.cpuSubstitutionX + cfg.gatesLength / 2));
        let hasCollided = false;

        if (!isInGoalYRange && movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.x = Math.abs(movementPoint.velocity.x);
            } else {
                movementPoint.velocity.x = Math.max(0, movementPoint.velocity.x);
            }
        }
        if (!isInGoalYRange && movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.x = -Math.abs(movementPoint.velocity.x);
            } else {
                movementPoint.velocity.x = Math.min(0, movementPoint.velocity.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.y = Math.abs(movementPoint.velocity.y);
            } else {
                movementPoint.velocity.y = Math.max(0, movementPoint.velocity.y);
            }
        }
        if (!isInSubstitutionYRange && movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.y = -Math.abs(movementPoint.velocity.y);
            } else {
                movementPoint.velocity.y = Math.min(0, movementPoint.velocity.y);
            }
        }
        return hasCollided;
    }

    protected getGoalBorderLimits(size: number, playerSide: PlayerSide): BorderLimits {
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

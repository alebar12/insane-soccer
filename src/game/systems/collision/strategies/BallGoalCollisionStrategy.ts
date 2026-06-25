import { GameConfigs } from "../../../../utils/GameConfigs";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class BallGoalCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL &&
            gameWorld.ball.movementPosition.getSpeed() > 0
        );
    }

    public apply(gameWorld: GameWorld): void {
        const ballMovement = gameWorld.ball.movementPosition;
        let side = PlayerSide.LEFT;
        if (
            ballMovement.position.x >
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2
        ) {
            side = PlayerSide.RIGHT;
        }

        const goalBorder = this.getGoalBorderLimits(ballMovement.size, side);
        this.handleBorderCollision(ballMovement, goalBorder, true, true);
    }
}

import { GameConfigs } from "../../../../utils/GameConfigs";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class BallBorderCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            gameWorld.ball.ballStatus === BallStatus.FREE
        );
    }

    public apply(gameWorld: GameWorld): void {
        const ballMovement = gameWorld.ball.movementPosition;
        this.handleBorderCollision(
            ballMovement,
            this.getFieldBorderLimits(ballMovement.size),
            true,
            false,
        );
        this.checkIfBallInsideGoal(gameWorld);
    }

    private checkIfBallInsideGoal(gameWorld: GameWorld): void {
        const ballMovement = gameWorld.ball.movementPosition;
        if (ballMovement.position.x < this.gameConfigs.fieldXOffset) {
            gameWorld.increaseScore(PlayerSide.RIGHT);
        } else if (
            ballMovement.position.x >
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth
        ) {
            gameWorld.increaseScore(PlayerSide.LEFT);
        }
    }
}

import { GameConfigs } from "../../../../utils/GameConfigs";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class BallPlayerCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(gameWorld: GameWorld): boolean {
        return (
            gameWorld.ball.ballStatus === BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            gameWorld.ball.ballPowerShot.shouldStopOnPlayerBounce()
        );
    }

    public apply(gameWorld: GameWorld): void {
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

import { GameStatus } from "@/game/enums/GameStatus";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class PlayerBorderCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(_gameWorld: GameWorld): boolean {
        return true;
    }

    public apply(gameWorld: GameWorld): void {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
                const avoidBounceOnSubstitution =
                    gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION;

                const hasCollided = this.handleBorderCollision(
                    player.movementPosition,
                    this.getFieldBorderLimits(player.movementPosition.size),
                    false,
                    true,
                    avoidBounceOnSubstitution,
                );
                if (hasCollided) {
                    player.startBouncing();
                }
            });
    }
}

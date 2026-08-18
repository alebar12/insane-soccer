import { SystemInterface } from "@/game/systems/SystemInterface";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { BallBorderCollisionStrategy } from "@/game/systems/collision/strategies/BallBorderCollisionStrategy";
import { BallGoalCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalCollisionStrategy";
import { BallGoalStakesCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalStakesCollisionStrategy";
import { BallPlayerCollisionStrategy } from "@/game/systems/collision/strategies/BallPlayerCollisionStrategy";
import { BouncingPowerShotCollisionStrategy } from "@/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy";
import { PlayerBorderCollisionStrategy } from "@/game/systems/collision/strategies/PlayerBorderCollisionStrategy";
import { PlayerCollisionStrategy } from "@/game/systems/collision/strategies/PlayerCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class CollisionSystem implements SystemInterface {
    private strategies: AbstractCollisionStrategy[] = [];

    public constructor(gameConfigs: GameConfigs) {
        this.strategies.push(new BallPlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalCollisionStrategy(gameConfigs));
        this.strategies.push(new BallBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalStakesCollisionStrategy(gameConfigs));
        this.strategies.push(new BouncingPowerShotCollisionStrategy(gameConfigs));
    }

    public update(gameWorld: GameWorld): void {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}

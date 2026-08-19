import { GameConfigs } from "@/utils/GameConfigs";
import { CollisionSystem } from "./CollisionSystem";
import { BallBorderCollisionStrategy } from "./strategies/BallBorderCollisionStrategy";
import { BallGoalCollisionStrategy } from "./strategies/BallGoalCollisionStrategy";
import { BallGoalStakesCollisionStrategy } from "./strategies/BallGoalStakesCollisionStrategy";
import { BallPlayerCollisionStrategy } from "./strategies/BallPlayerCollisionStrategy";
import { BouncingPowerShotCollisionStrategy } from "./strategies/BouncingPowerShotCollisionStrategy";
import { PlayerBorderCollisionStrategy } from "./strategies/PlayerBorderCollisionStrategy";
import { PlayerCollisionStrategy } from "./strategies/PlayerCollisionStrategy";

export class CollisionSystemFactory {
    public static create(gameConfigs: GameConfigs): CollisionSystem {
        return new CollisionSystem([
            new BallPlayerCollisionStrategy(gameConfigs),
            new PlayerBorderCollisionStrategy(gameConfigs),
            new PlayerCollisionStrategy(gameConfigs),
            new BallGoalCollisionStrategy(gameConfigs),
            new BallBorderCollisionStrategy(gameConfigs),
            new BallGoalStakesCollisionStrategy(gameConfigs),
            new BouncingPowerShotCollisionStrategy(gameConfigs),
        ]);
    }
}

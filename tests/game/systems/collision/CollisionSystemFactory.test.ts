import { CollisionSystem } from "@/game/systems/collision/CollisionSystem";
import { CollisionSystemFactory } from "@/game/systems/collision/CollisionSystemFactory";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { BallBorderCollisionStrategy } from "@/game/systems/collision/strategies/BallBorderCollisionStrategy";
import { BallGoalCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalCollisionStrategy";
import { BallGoalStakesCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalStakesCollisionStrategy";
import { BallPlayerCollisionStrategy } from "@/game/systems/collision/strategies/BallPlayerCollisionStrategy";
import { BouncingPowerShotCollisionStrategy } from "@/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy";
import { PlayerBorderCollisionStrategy } from "@/game/systems/collision/strategies/PlayerBorderCollisionStrategy";
import { PlayerCollisionStrategy } from "@/game/systems/collision/strategies/PlayerCollisionStrategy";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it } from "vitest";

interface CollisionSystemDependencies {
    strategies: Array<AbstractCollisionStrategy>;
}

describe("CollisionSystemFactory", () => {
    it("should register all collision strategies in processing order", () => {
        const collisionSystem = CollisionSystemFactory.create(new GameConfigs(600, 800));
        const dependencies = collisionSystem as unknown as CollisionSystemDependencies;

        expect(collisionSystem).toBeInstanceOf(CollisionSystem);
        expect(dependencies.strategies.map(strategy => strategy.constructor)).toEqual([
            BallPlayerCollisionStrategy,
            PlayerBorderCollisionStrategy,
            PlayerCollisionStrategy,
            BallGoalCollisionStrategy,
            BallBorderCollisionStrategy,
            BallGoalStakesCollisionStrategy,
            BouncingPowerShotCollisionStrategy,
        ]);
    });
});

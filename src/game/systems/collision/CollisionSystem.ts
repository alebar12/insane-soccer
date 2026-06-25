import { GameConfigs } from "../../../utils/GameConfigs";
import { GameWorld } from "../../world/GameWorld";
import { SystemInterface } from "../SystemInterface";
import { AbstractCollisionStrategy } from "./strategies/AbstractCollisionStrategy";
import { BallBorderCollisionStrategy } from "./strategies/BallBorderCollisionStrategy";
import { BallGoalCollisionStrategy } from "./strategies/BallGoalCollisionStrategy";
import { BallGoalStakesCollisionStrategy } from "./strategies/BallGoalStakesCollisionStrategy";
import { BallPlayerCollisionStrategy } from "./strategies/BallPlayerCollisionStrategy";
import { PlayerBorderCollisionStrategy } from "./strategies/PlayerBorderCollisionStrategy";
import { PlayerCollisionStrategy } from "./strategies/PlayerCollisionStrategy";

export class CollisionSystem implements SystemInterface {
    private strategies: AbstractCollisionStrategy[] = [];

    public constructor(gameConfigs: GameConfigs) {
        this.strategies.push(new BallPlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalCollisionStrategy(gameConfigs));
        this.strategies.push(new BallBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalStakesCollisionStrategy(gameConfigs));
    }

    public update(gameWorld: GameWorld): void {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}

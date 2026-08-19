import { SystemInterface } from "@/game/systems/SystemInterface";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";

export class CollisionSystem implements SystemInterface {
    public constructor(private strategies: AbstractCollisionStrategy[]) {}

    public update(gameWorld: GameWorld): void {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}

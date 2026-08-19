import { SystemInterface } from "@/game/systems/SystemInterface";
import { CheckerStrategyInterface } from "@/game/systems/checkers/strategies/CheckerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class CheckerSystem implements SystemInterface {
    public constructor(private readonly strategies: CheckerStrategyInterface[]) {}

    public update(gameWorld: GameWorld, _deltaMs: number): void {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}

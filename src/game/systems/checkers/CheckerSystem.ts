import { SystemInterface } from "@/game/systems/SystemInterface";
import { CheckerStrategyInterface } from "@/game/systems/checkers/strategies/CheckerStrategyInterface";
import { SubstitutionCheckerStrategy } from "@/game/systems/checkers/strategies/SubstitutionCheckerStrategy";
import { WaitingBallCheckerStrategy } from "@/game/systems/checkers/strategies/WaitingBallCheckerStrategy";
import { GameWorld } from "@/game/world/GameWorld";

export class CheckerSystem implements SystemInterface {
    private strategies: CheckerStrategyInterface[] = [];

    public constructor() {
        this.strategies.push(new SubstitutionCheckerStrategy());
        this.strategies.push(new WaitingBallCheckerStrategy());
    }

    public update(gameWorld: GameWorld, _deltaMs: number): void {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}

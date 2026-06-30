import { GameWorld } from "../../world/GameWorld";
import { SystemInterface } from "../SystemInterface";
import { CheckerStrategyInterface } from "./strategies/CheckerStrategyInterface";
import { SubstitutionCheckerStrategy } from "./strategies/SubstitutionCheckerStrategy";
import { WaitingBallCheckerStrategy } from "./strategies/WaitingBallCheckerStrategy";

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

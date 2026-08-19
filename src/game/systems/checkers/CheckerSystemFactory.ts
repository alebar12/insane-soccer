import { CheckerSystem } from "./CheckerSystem";
import { SubstitutionCheckerStrategy } from "./strategies/SubstitutionCheckerStrategy";
import { WaitingBallCheckerStrategy } from "./strategies/WaitingBallCheckerStrategy";

export class CheckerSystemFactory {
    public static create(): CheckerSystem {
        return new CheckerSystem([
            new SubstitutionCheckerStrategy(),
            new WaitingBallCheckerStrategy(),
        ]);
    }
}

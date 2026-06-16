import { Point } from "../../utils/Point";
import { Player } from "./Player";

export class Substitute2Player extends Player {
    getInitialPosition(): Point {
        return new Point(
            this.gameConfigs.cpuSubstitutionX,
            this.gameConfigs.substituteStartPositionYOffset,
        );
    }
    isCpu(): boolean {
        return true;
    }
    isSubstitute(): boolean {
        return true;
    }
}

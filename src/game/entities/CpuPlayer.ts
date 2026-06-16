import { Point } from "../../utils/Point";
import { Player } from "./Player";

export class CpuPlayer extends Player {
    getInitialPosition(): Point {
        return new Point(
            this.gameConfigs.fieldXOffset +
                this.gameConfigs.fieldWidth -
                this.gameConfigs.playerStartPositionXOffset,
            this.gameConfigs.playerStartPositionYOffset,
        );
    }
    isCpu(): boolean {
        return true;
    }
    isSubstitute(): boolean {
        return false;
    }
}

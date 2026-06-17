import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";
import { Player } from "./Player";

export class HumanPlayer extends Player {
    getInitialPosition(): Point {
        return new Point(
            this.gameConfigs.playerStartPositionXOffset + this.gameConfigs.fieldXOffset,
            this.gameConfigs.playerStartPositionYOffset,
        );
    }

    isCpu(): boolean {
        return false;
    }

    isSubstitute(): boolean {
        return false;
    }

    getSide(): PlayerSide {
        return PlayerSide.LEFT;
    }
}

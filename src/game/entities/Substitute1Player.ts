import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";
import { Player } from "./Player";

export class Substitute1Player extends Player {
    getInitialPosition(): Point {
        return new Point(
            this.gameConfigs.playerSubstitutionX,
            this.gameConfigs.substituteStartPositionYOffset,
        );
    }
    isCpu(): boolean {
        return false;
    }
    isSubstitute(): boolean {
        return true;
    }

    getSide(): PlayerSide {
        return PlayerSide.LEFT;
    }
}

import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";

export abstract class Player {
    public position: Point;
    public isStunned: boolean = false;
    public radius: number;
    protected gameConfigs: GameConfigs;

    abstract getInitialPosition(): Point;

    abstract isCpu(): boolean;

    abstract isSubstitute(): boolean;
    
    abstract getSide(): PlayerSide;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.position = this.getInitialPosition();
        this.radius = gameConfigs.playerSizeWithBorder;
    }
}

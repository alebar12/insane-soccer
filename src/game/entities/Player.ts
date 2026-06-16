import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";

export abstract class Player {
    private _position: Point;
    private _isStunned: boolean = false;
    protected gameConfigs: GameConfigs;

    abstract getInitialPosition(): Point;

    abstract isCpu(): boolean;

    abstract isSubstitute(): boolean;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this._position = this.getInitialPosition();
    }

    public get position(): Point {
        return this._position;
    }

    public get isStunned(): boolean {
        return this._isStunned;
    }
}

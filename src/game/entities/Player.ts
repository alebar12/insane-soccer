import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";

export class Player {
    private _position: Point;
    private _isCpu: boolean;
    private _isSubstitute: boolean;
    private _isStunned: boolean;

    public constructor(gameConfigs: GameConfigs, isCpu: boolean, isSubstitute: boolean) {
        this._isCpu = isCpu;
        this._isSubstitute = isSubstitute;
        this._isStunned = false;

        if (!this.isSubstitute) {
            this._position = new Point(
                gameConfigs.fieldXOffset +
                    (this.isCpu
                        ? gameConfigs.fieldWidth - gameConfigs.playerStartPositionXOffset
                        : gameConfigs.playerStartPositionXOffset),
                gameConfigs.playerStartPositionYOffset,
            );
        } else {
            this._position = new Point(
                this.isCpu ? gameConfigs.cpuSubstitutionX : gameConfigs.playerSubstitutionX,
                gameConfigs.substituteStartPositionYOffset,
            );
        }
    }

    public static initHuman(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, false);
    }

    public static initCpu(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, true, false);
    }

    public static initSubstitue1(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, true);
    }

    public static initSubstitue2(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, true, true);
    }

    public get position(): Point {
        return this._position;
    }

    public get isCpu(): boolean {
        return this._isCpu;
    }

    public get isSubstitute(): boolean {
        return this._isSubstitute;
    }

    public get isStunned(): boolean {
        return this._isStunned;
    }
}

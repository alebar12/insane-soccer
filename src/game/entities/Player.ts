import { GameConfigs } from "../../utils/GameConfigs";

export class Player {
    private _x: number;
    private _y: number;
    private _isCpu: boolean;
    private _isSubstitute: boolean;
    private _isStunned: boolean;

    public constructor(gameConfigs: GameConfigs, isCpu: boolean, isSubstitute: boolean) {
        this._isCpu = isCpu;
        this._isSubstitute = isSubstitute;
        this._isStunned = false;

        if (!this.isSubstitute) {
            this._x =
                gameConfigs.fieldXOffset +
                (this.isCpu
                    ? gameConfigs.fieldWidth - gameConfigs.playerStartPositionXOffset
                    : gameConfigs.playerStartPositionXOffset);
            this._y = gameConfigs.playerStartPositionYOffset;
        } else {
            this._x = this.isCpu ? gameConfigs.cpuSubstitutionX : gameConfigs.playerSubstitutionX;
            this._y = gameConfigs.substituteStartPositionYOffset;
        }
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
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

import { GameStatus } from "./GameStatus";

export class GameStatusManager {
    private _gameStatus: GameStatus = GameStatus.MENU;
    private statusStartTime: number = 0;

    public changeStatus(gameStatus: GameStatus): void {
        this._gameStatus = gameStatus;
        this.statusStartTime = Date.now();
    }

    public get gameStatus(): GameStatus {
        return this._gameStatus;
    }

    public isStatusChangedRecently(): boolean {
        return Date.now() - this.statusStartTime < 1000;
    }
}

import { GameStatus } from "./GameStatus";

export class GameStatusManager {
    public gameStatus: GameStatus = GameStatus.MENU;
    private statusStartTime: number = 0;

    public constructor() {}

    public changeStatus(gameStatus: GameStatus): void {
        this.gameStatus = gameStatus;
        this.statusStartTime = Date.now();
    }

    public isStatusChangedRecently(): boolean {
        return Date.now() - this.statusStartTime < 1000;
    }
}

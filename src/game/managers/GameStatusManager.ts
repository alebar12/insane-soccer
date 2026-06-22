import { GameStatus } from "../enums/GameStatus";

export class GameStatusManager {
    private _gameStatus: GameStatus = GameStatus.MENU;
    private statusStartTime: number = 0;
    private scheduledEvents: Array<{ time: number; gameStatus: GameStatus }> = [];
    private time: number = 0;

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

    public scheduleStatusChange(delay: number, gameStatus: GameStatus): void {
        const existingEvent = this.scheduledEvents.find(e => e.gameStatus === gameStatus);
        if (!existingEvent) {
            this.scheduledEvents.push({
                time: this.time + delay,
                gameStatus: gameStatus,
            });
        }
    }

    public update(delta: number): void {
        this.time += delta;
        for (const e of this.scheduledEvents) {
            if (this.time >= e.time) {
                this.changeStatus(e.gameStatus);
            }
        }
        this.scheduledEvents = this.scheduledEvents.filter(e => this.time < e.time);
    }
}

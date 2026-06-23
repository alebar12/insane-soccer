import { PlayerSide } from "../enums/PlayerSide";

export class ScoreManager {
    public leftScore: number = 0;
    public rightScore: number = 0;
    private lastUpdateTime: number = 0;
    private lastSideUpdated: PlayerSide = PlayerSide.LEFT;

    public constructor() {}

    public increaseScore(playerSide: PlayerSide): void {
        if (playerSide === PlayerSide.LEFT) {
            this.rightScore++;
        } else {
            this.leftScore++;
        }
        this.lastUpdateTime = Date.now();
        this.lastSideUpdated = playerSide;
    }

    public reset(): void {
        this.leftScore = 0;
        this.rightScore = 0;
    }

    public getScoreAsArray(): Array<number> {
        const outputString = String(this.leftScore).padStart(2, '0') + String(this.rightScore).padStart(2, '0');
        return outputString.split('').map(Number);
    }

    public shouldAnimateIndex (index: number): boolean {
        if (this.lastSideUpdated === PlayerSide.RIGHT) {
            return index < 2;
        } else {
            return index >= 2;
        }
    }

    public get lastUpdate(): number {
        return this.lastUpdateTime;
    }

    public get lastSide(): PlayerSide {
        return this.lastSideUpdated;
    }
}

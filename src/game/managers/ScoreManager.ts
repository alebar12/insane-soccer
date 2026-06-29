import { PlayerSide } from "../enums/PlayerSide";

export class ScoreManager {
    public leftScore: number = 0;
    public rightScore: number = 0;
    private lastUpdateTime: number = 0;
    private lastSideUpdated: PlayerSide = PlayerSide.LEFT;
    private readonly maxScore: number = 5;
    private readonly substitutionGoals: number = 2;

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
        this.lastUpdateTime = Date.now();
    }

    public getScoreAsArray(): Array<number> {
        const outputString =
            String(this.leftScore).padStart(2, "0") + String(this.rightScore).padStart(2, "0");
        return outputString.split("").map(Number);
    }

    public shouldAnimateIndex(index: number): boolean {
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

    public get isGameOver(): boolean {
        return this.leftScore === this.maxScore || this.rightScore === this.maxScore;
    }

    public getWinningPlayerSide(): PlayerSide | null {
        if (this.leftScore === this.maxScore) {
            return PlayerSide.LEFT;
        } else if (this.rightScore === this.maxScore) {
            return PlayerSide.RIGHT;
        } else {
            return null;
        }
    }

    public isSubstitutionTime(): boolean {
        const totalScore = this.leftScore + this.rightScore;
        return totalScore > 0 && totalScore % this.substitutionGoals === 0;
    }
}

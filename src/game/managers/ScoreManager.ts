import { PlayerSide } from "../enums/PlayerSide";

export class ScoreManager {
    public leftScore: number = 0;
    public rightScore: number = 0;
    private lastUpdateDuration: number = 0;
    private lastSideUpdated: PlayerSide = PlayerSide.LEFT;
    private readonly maxScore: number = 10;
    private readonly substitutionGoals: number = 3;

    public increaseScore(playerSide: PlayerSide): void {
        if (playerSide === PlayerSide.RIGHT) {
            this.rightScore++;
        } else {
            this.leftScore++;
        }
        this.lastUpdateDuration = 0;
        this.lastSideUpdated = playerSide;
    }

    public update(delta: number): void {
        this.lastUpdateDuration += delta;
    }

    public reset(): void {
        this.leftScore = 0;
        this.rightScore = 0;
        this.lastUpdateDuration = 0;
        this.lastSideUpdated = PlayerSide.LEFT;
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

    public getLastUpdateDuration(): number {
        return this.lastUpdateDuration;
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

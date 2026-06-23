import { PlayerSide } from "../enums/PlayerSide";

export class Score {
    public leftScore: number = 0;
    public rightScore: number = 0;

    public constructor() {}

    public increaseScore(playerSide: PlayerSide): void {
        if (playerSide === PlayerSide.LEFT) {
            this.rightScore++;
        } else {
            this.leftScore++;
        }
        console.log(this.leftScore, this.rightScore);
    }
}

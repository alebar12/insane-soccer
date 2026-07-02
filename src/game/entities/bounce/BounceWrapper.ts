import { PlayerStatus } from "../../enums/PlayerStatus";
import { Player } from "../Player";

export class BounceWrapper {
    private bouncingStartTime: number = 0;
    private readonly bounceTime: number = 2000;
    private readonly bounceMaxAmplitude: number = 0.5;
    private readonly bounceExponentialFactor: number = 0.00346;
    private readonly bounceNumber: number = 5;
    private readonly player: Player;

    public constructor(player: Player) {
        this.player = player;
    }

    public startBouncing(): void {
        if (
            this.getBouncingProgress() > this.bounceTime / 2 &&
            this.player.playerStatus === PlayerStatus.NORMAL
        ) {
            this.bouncingStartTime = Date.now();
        }
    }

    public getBouncingAmplitude(): number {
        if (!this.isBouncing()) {
            return 0;
        }

        return (
            this.bounceMaxAmplitude *
            Math.pow(Math.E, -this.getBouncingProgress() * this.bounceExponentialFactor) *
            Math.sin(this.getBouncingProgress() / (2 * Math.PI * this.bounceNumber))
        );
    }

    public reset(): void {
        this.bouncingStartTime = 0;
    }

    private getBouncingProgress(): number {
        return Date.now() - this.bouncingStartTime;
    }

    private isBouncing(): boolean {
        return this.getBouncingProgress() <= this.bounceTime;
    }
}

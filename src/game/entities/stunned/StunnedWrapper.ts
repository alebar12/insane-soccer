import { PlayerStatus } from "../../enums/PlayerStatus";
import { Player } from "../Player";
import { StunnedStars } from "./StunnedStars";

export class StunnedWrapper {
    private stunnedValue: number = 0;
    private stunnedStartTime: number = 0;
    public stunnedStars: StunnedStars = new StunnedStars();
    private readonly stunnedMaxValue: number = 2000;
    private readonly stunnedStep: number = 1000;
    private readonly stunnedTime: number = 3000;
    private readonly player: Player;

    public constructor(player: Player) {
        this.player = player;
    }

    public updateStunnedValue(otherPlayerSpeed: number): void {
        if (this.player.playerStatus !== PlayerStatus.STUNNED) {
            const speed = this.player.movementPosition.getSpeed();
            if (speed > otherPlayerSpeed) {
                this.stunnedValue = Math.max(0, this.stunnedValue - this.stunnedStep);
            } else if (speed < otherPlayerSpeed) {
                this.stunnedValue += this.stunnedStep;
            }

            if (this.stunnedValue > this.stunnedMaxValue) {
                this.player.playerStatus = PlayerStatus.STUNNED;
                this.stunnedStartTime = Date.now();
            }
        }
    }

    public forceStunned(): void {
        this.player.playerStatus = PlayerStatus.STUNNED;
        this.stunnedStartTime = Date.now();
    }

    public decrementStunnedValue(deltaMs: number): void {
        if (this.player.playerStatus === PlayerStatus.NORMAL) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        } else if (this.player.playerStatus === PlayerStatus.STUNNED) {
            this.stunnedStars.update(deltaMs, this.player.movementPosition.position);
            if (Date.now() - this.stunnedStartTime > this.stunnedTime) {
                this.player.playerStatus = PlayerStatus.NORMAL;
                this.stunnedValue = 0;
                this.stunnedStars.stars = [];
            }
        }
    }

    public reset(): void {
        this.stunnedValue = 0;
        this.stunnedStars.stars = [];
    }
}

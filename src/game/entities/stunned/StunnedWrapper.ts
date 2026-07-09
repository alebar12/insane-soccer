import { Point } from "../../geometry/Point";
import { StunnedStars } from "./StunnedStars";

export class StunnedWrapper {
    private readonly stunnedMaxValue: number = 2000;
    private readonly stunnedStep: number = 1000;
    private readonly stunnedDuration: number = 3000;

    private stunned: boolean = false;
    private stunnedValue: number = 0;
    private stunnedTime: number = 0;

    public stunnedStars: StunnedStars = new StunnedStars();
    public isInitialAngleSet: boolean = false;

    public isStunned(): boolean {
        return this.stunned;
    }

    public updateStunnedValue(ownSpeed: number, otherPlayerSpeed: number): void {
        if (!this.stunned) {
            if (ownSpeed > otherPlayerSpeed) {
                this.stunnedValue = Math.max(0, this.stunnedValue - this.stunnedStep);
            } else if (ownSpeed < otherPlayerSpeed) {
                this.stunnedValue += this.stunnedStep;
            }

            if (this.stunnedValue > this.stunnedMaxValue) {
                this.stunned = true;
                this.stunnedTime = 0;
                this.isInitialAngleSet = false;
            }
        }
    }

    public forceStunned(): void {
        this.stunned = true;
        this.stunnedTime = 0;
    }

    public decrementStunnedValue(deltaMs: number, position: Point): void {
        if (!this.stunned) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        } else {
            this.stunnedTime += deltaMs;
            this.stunnedStars.update(deltaMs, position);
            if (this.stunnedTime > this.stunnedDuration) {
                this.reset();
            }
        }
    }

    public reset(): void {
        this.stunned = false;
        this.stunnedValue = 0;
        this.stunnedStars.stars = [];
        this.isInitialAngleSet = false;
    }
}

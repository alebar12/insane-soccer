export class BounceWrapper {
    private readonly bouncingDuration: number = 2000;
    private readonly bounceMaxAmplitude: number = 0.5;
    private readonly bounceExponentialFactor: number = 0.00346;
    private readonly bounceNumber: number = 5;

    private bouncingTime: number = this.bouncingDuration;

    public startBouncing(): void {
        if (this.bouncingTime > this.bouncingDuration / 2) {
            this.bouncingTime = 0;
        }
    }

    public update(deltaMs: number): void {
        this.bouncingTime += deltaMs;
    }

    public getBouncingAmplitude(): number {
        if (!this.isBouncing()) {
            return 0;
        }

        return (
            this.bounceMaxAmplitude *
            Math.pow(Math.E, -this.bouncingTime * this.bounceExponentialFactor) *
            Math.sin(this.bouncingTime / (2 * Math.PI * this.bounceNumber))
        );
    }

    public reset(): void {
        this.bouncingTime = this.bouncingDuration;
    }

    private isBouncing(): boolean {
        return this.bouncingTime < this.bouncingDuration;
    }
}

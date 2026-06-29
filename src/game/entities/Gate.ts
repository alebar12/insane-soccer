export class Gate {
    private angle: number = 0;
    private readonly maxAngle: number = Math.PI / 2;
    private readonly openTime: number = 300;
    private step: number = this.maxAngle / this.openTime;

    public update(delta: number, isOpen: boolean): void {
        if (isOpen) {
            this.angle += this.step * delta;
        } else {
            this.angle -= this.step * delta;
        }
        this.angle = Math.max(0, Math.min(this.maxAngle, this.angle));
    }

    public get currentAngle(): number {
        return this.angle;
    }
}

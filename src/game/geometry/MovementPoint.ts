import { Point } from "./Point";


export class MovementPoint {
    public constructor(
        public position: Point,
        public speed: Point,
        public acceleration: number,
        public size: number,
    ) {}

    public updatePosition(deltaMs: number): void {
        this.position.x += this.speed.x * deltaMs;
        this.position.y += this.speed.y * deltaMs;
    }

    public projectToFinalPosition(): Point {
        return new Point(
            this.calculateDestinationPosition(this.position.x, this.speed.x),
            this.calculateDestinationPosition(this.position.y, this.speed.y),
        );
    }

    public getSpeed(): number {
        return Math.sqrt(Math.pow(this.speed.x, 2) + Math.pow(this.speed.y, 2));
    }

    public getSpeedAngle(): number {
        return Math.atan2(this.speed.y, this.speed.x);
    }

    public adjustToMaxSpeed(maxSpeed: number): void {
        const speed = Math.min(this.getSpeed(), maxSpeed);
        const angle = this.getSpeedAngle();
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }

    public setSpeed(speed: number, angle: number): void {
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }

    public decrementSpeed(deltaMs: number): void {
        const currentSpeed = this.getSpeed();
        if (currentSpeed > 0) {
            const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
            const ratio = newSpeed / currentSpeed;
            this.speed.x *= ratio;
            this.speed.y *= ratio;
        }
    }

    private calculateDestinationPosition(position: number, speed: number): number {
        while (Math.abs(speed) > 0) {
            position += speed;
            speed = Math.sign(speed) * Math.max(Math.abs(speed) - this.acceleration, 0);
            if (Math.abs(speed) <= this.acceleration) {
                speed = 0;
            }
        }
        return position;
    }
}

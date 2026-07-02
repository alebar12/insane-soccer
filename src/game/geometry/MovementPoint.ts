import { Point } from "./Point";

export class MovementPoint {
    public static areTouching(point1: MovementPoint, point2: MovementPoint): boolean {
        return Point.getDistance(point1.position, point2.position) < point1.size + point2.size;
    }

    public constructor(
        public position: Point,
        public velocity: Point,
        public acceleration: number,
        public size: number,
    ) {}

    public updatePosition(deltaMs: number): void {
        this.position.x += this.velocity.x * deltaMs;
        this.position.y += this.velocity.y * deltaMs;
    }

    public projectToFinalPosition(): Point {
        return new Point(
            this.calculateDestinationPosition(this.position.x, this.velocity.x),
            this.calculateDestinationPosition(this.position.y, this.velocity.y),
        );
    }

    public getSpeed(): number {
        return Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
    }

    public getSpeedAngle(): number {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }

    public adjustToMaxSpeed(maxSpeed: number): void {
        const speed = Math.min(this.getSpeed(), maxSpeed);
        const angle = this.getSpeedAngle();
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    }

    public setSpeed(speed: number, angle: number): void {
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    }

    public decrementSpeed(deltaMs: number): void {
        const currentSpeed = this.getSpeed();
        if (currentSpeed > 0) {
            const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
            const ratio = newSpeed / currentSpeed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
        }
    }

    public clone(): MovementPoint {
        return new MovementPoint(
            new Point(this.position.x, this.position.y),
            new Point(this.velocity.x, this.velocity.y),
            this.acceleration,
            this.size,
        );
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

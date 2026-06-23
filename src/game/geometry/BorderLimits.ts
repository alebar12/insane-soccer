import { Point } from "./Point";

export class BorderLimits {
    public constructor(
        public readonly left: number,
        public readonly right: number,
        public readonly top: number,
        public readonly bottom: number,
    ) {}

    public isPointInside(point: Point): boolean {
        return (
            point.x >= this.left &&
            point.x <= this.right &&
            point.y >= this.top &&
            point.y <= this.bottom
        );
    }
}

export class Point {
    public constructor(
        public x: number,
        public y: number,
    ) {}

    public static getDistance(point1: Point, point2: Point): number {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }

    public static getAngleBetweenPoints(point1: Point, point2: Point): number {
        return Math.atan2(point2.y - point1.y, point2.x - point1.x);
    }

    public static arePointEquals(point1: Point, point2: Point): boolean {
        return point1.x === point2.x && point1.y === point2.y;
    }
}

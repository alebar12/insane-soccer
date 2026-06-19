import { Point } from "./Point";

export class MovementPoint {
    public constructor(
        public position: Point,
        public speed: Point,
        public acceleration: number
    ) {}
}

import { Point } from "../geometry/Point";

export abstract class HoverableEntity {
    public hovered: boolean = false;
    public hoverProgress: number = 0;

    abstract contains(point: Point): boolean;

    abstract getTransitionTime(): number;
}

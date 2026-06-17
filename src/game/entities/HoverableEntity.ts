import { Point } from "../../utils/Point";

export abstract class HoverableEntity {
    public hovered: boolean = false;

    abstract contains(point: Point): boolean;
}

import { Point } from "@/game/geometry/Point";
import { describe, expect, it } from "vitest";

describe("Point", () => {
    it("should create point", () => {
        const point = new Point(0, 0);
        expect(point.x).toBe(0);
        expect(point.y).toBe(0);
    });

    it("should get distance", () => {
        const point1 = new Point(0, 0);
        const point2 = new Point(1, 1);
        expect(Point.getDistance(point1, point2)).toBeCloseTo(Math.sqrt(2));
    });

    it("should get angle between points", () => {
        const point1 = new Point(0, 0);
        const point2 = new Point(1, 1);
        expect(Point.getAngleBetweenPoints(point1, point2)).toBeCloseTo(Math.PI / 4);
    });

    it("should check if points are equals", () => {
        const point1 = new Point(0, 0);
        const point2 = new Point(0, 0);
        expect(Point.arePointEquals(point1, point2)).toBe(true);
    });

    it("should not check if points are equals", () => {
        const point1 = new Point(0, 0);
        const point2 = new Point(1, 1);
        expect(Point.arePointEquals(point1, point2)).toBe(false);
    });
});

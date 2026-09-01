import { BorderLimits } from "@/game/geometry/BorderLimits";
import { Point } from "@/game/geometry/Point";
import { describe, it, expect } from "vitest";

describe("BorderLimits", () => {
    it("should create border limits", () => {
        const borderLimits = new BorderLimits(0, 100, 0, 100);
        expect(borderLimits.left).toBe(0);
        expect(borderLimits.right).toBe(100);
        expect(borderLimits.top).toBe(0);
        expect(borderLimits.bottom).toBe(100);
    });

    it("should check if point is inside", () => {
        const borderLimits = new BorderLimits(0, 100, 0, 100);
        expect(borderLimits.isPointInside(new Point(0, 0))).toBe(true);
        expect(borderLimits.isPointInside(new Point(50, 50))).toBe(true);
        expect(borderLimits.isPointInside(new Point(100, 100))).toBe(true);
        expect(borderLimits.isPointInside(new Point(-1, 0))).toBe(false);
        expect(borderLimits.isPointInside(new Point(0, -1))).toBe(false);
        expect(borderLimits.isPointInside(new Point(101, 0))).toBe(false);
        expect(borderLimits.isPointInside(new Point(0, 101))).toBe(false);
    });
});

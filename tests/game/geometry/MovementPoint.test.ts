import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { describe, expect, it } from "vitest";

describe("MovementPoint", () => {
    it("should create movement point", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0);
        expect(movementPoint.position.x).toBe(0);
        expect(movementPoint.position.y).toBe(0);
        expect(movementPoint.velocity.x).toBe(0);
        expect(movementPoint.velocity.y).toBe(0);
        expect(movementPoint.acceleration).toBe(0);
        expect(movementPoint.size).toBe(0);
    });

    it("should update position", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 0, 0);
        movementPoint.updatePosition(10);
        expect(movementPoint.position.x).toBe(10);
        expect(movementPoint.position.y).toBe(10);
    });

    it("should project to final position", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 1, 0);
        const finalPosition = movementPoint.projectToFinalPosition();
        expect(finalPosition.x).toBe(1);
        expect(finalPosition.y).toBe(1);
    });

    it("should get speed", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 0, 0);
        expect(movementPoint.getSpeed()).toBe(Math.sqrt(2));
    });

    it("should get speed angle", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 0, 0);
        expect(movementPoint.getSpeedAngle()).toBe(Math.PI / 4);
    });

    it("should adjust to max speed", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 0, 0);
        movementPoint.adjustToMaxSpeed(1);
        expect(movementPoint.velocity.x).toBeCloseTo(0.707);
        expect(movementPoint.velocity.y).toBeCloseTo(0.707);
    });

    it("should set speed", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0);
        movementPoint.setSpeed(1, Math.PI / 4);
        expect(movementPoint.velocity.x).toBeCloseTo(0.707);
        expect(movementPoint.velocity.y).toBeCloseTo(0.707);
    });

    it("should decrement speed", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 1, 0);
        movementPoint.decrementSpeed(10);
        expect(movementPoint.velocity.x).toBeCloseTo(0);
        expect(movementPoint.velocity.y).toBeCloseTo(0);
    });

    it("should clone", () => {
        const movementPoint = new MovementPoint(new Point(0, 0), new Point(1, 1), 1, 0);
        const clonedPoint = movementPoint.clone();
        expect(clonedPoint.position.x).toBe(0);
        expect(clonedPoint.position.y).toBe(0);
        expect(clonedPoint.velocity.x).toBe(1);
        expect(clonedPoint.velocity.y).toBe(1);
        expect(clonedPoint.acceleration).toBe(1);
        expect(clonedPoint.size).toBe(0);
    });

    it("should check if touching", () => {
        const movementPoint1 = new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 5);
        const movementPoint2 = new MovementPoint(new Point(2, 0), new Point(0, 0), 0, 5);
        expect(MovementPoint.areTouching(movementPoint1, movementPoint2)).toBe(true);
    });

    it("should not check if touching", () => {
        const movementPoint1 = new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 5);
        const movementPoint2 = new MovementPoint(new Point(10, 0), new Point(0, 0), 0, 5);
        expect(MovementPoint.areTouching(movementPoint1, movementPoint2)).toBe(false);
    });
});

import { Point } from "@/game/geometry/Point";
import { PositionHistory } from "@/game/geometry/PositionHistory";
import { beforeEach, describe, expect, it } from "vitest";

describe("PositionHistory", () => {
    let positionHistory: PositionHistory;

    beforeEach(() => {
        positionHistory = new PositionHistory(1000);
    });

    it("should create position history", () => {
        expect(positionHistory.retentionTime).toBe(1000);
        expect(positionHistory.positions).toHaveLength(0);
    });

    it("should add position", () => {
        positionHistory.addPosition(new Point(0, 0));
        expect(positionHistory.positions).toHaveLength(1);
    });

    it("should update positions", () => {
        positionHistory.addPosition(new Point(0, 0));
        positionHistory.addPosition(new Point(1, 1));
        positionHistory.update(100);
        expect(positionHistory.positions[0].delta).toBe(100);
        expect(positionHistory.positions[1].delta).toBe(100);
    });

    it("should remove old positions", () => {
        positionHistory.addPosition(new Point(0, 0));
        positionHistory.update(100);
        positionHistory.addPosition(new Point(1, 1));
        positionHistory.update(100);
        expect(positionHistory.positions).toHaveLength(2);
        positionHistory.update(800);
        expect(positionHistory.positions).toHaveLength(1);
        positionHistory.update(100);
        expect(positionHistory.positions).toHaveLength(0);
    });

    it("should get factor", () => {
        positionHistory.addPosition(new Point(0, 0));
        expect(positionHistory.getFactor(0)).toBe(0);
    });
});

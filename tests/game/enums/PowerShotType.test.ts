import { PowerShotType, PowerShotUtilities } from "@/game/enums/PowerShotType";
import { describe, expect, it } from "vitest";

describe("PowerShotType", () => {
    it("should return correct power shot type", () => {
        expect(PowerShotUtilities.getPowerShotType(0)).toBe(PowerShotType.FIRE);
        expect(PowerShotUtilities.getPowerShotType(1)).toBe(PowerShotType.ELECTRIC);
        expect(PowerShotUtilities.getPowerShotType(2)).toBe(PowerShotType.FIRE);
    });

    it("should return correct speed factor", () => {
        expect(PowerShotUtilities.getSpeedFactor(PowerShotType.FIRE)).toBe(2);
        expect(PowerShotUtilities.getSpeedFactor(PowerShotType.ELECTRIC)).toBe(1.2);
        expect(PowerShotUtilities.getSpeedFactor(null)).toBe(1);
    });

    it("should return correct should stop on player bounce", () => {
        expect(PowerShotUtilities.shouldStopOnPlayerBounce(PowerShotType.FIRE)).toBe(false);
        expect(PowerShotUtilities.shouldStopOnPlayerBounce(PowerShotType.ELECTRIC)).toBe(true);
    });

    it("should return correct should move to goal", () => {
        expect(PowerShotUtilities.shouldMoveToGoal(PowerShotType.FIRE)).toBe(false);
        expect(PowerShotUtilities.shouldMoveToGoal(PowerShotType.ELECTRIC)).toBe(true);
    });
});

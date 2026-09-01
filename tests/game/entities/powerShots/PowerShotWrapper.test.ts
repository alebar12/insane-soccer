import { Player } from "@/game/entities/Player";
import { PowerShotInterface } from "@/game/entities/powerShots/PowerShotInterface";
import { PowerShotWrapper } from "@/game/entities/powerShots/PowerShotWrapper";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("PowerShotWrapper", () => {
    const side = PlayerSide.LEFT;
    let powerShot1: Pick<PowerShotInterface, "update">;
    let powerShot2: Pick<PowerShotInterface, "update">;
    let powerShotWrapper: PowerShotWrapper;

    beforeEach(() => {
        powerShot1 = { update: vi.fn() };
        powerShot2 = { update: vi.fn() };
        powerShotWrapper = new PowerShotWrapper(side, [powerShot1 as PowerShotInterface, powerShot2 as PowerShotInterface]);
    });

    it("should update power shots", () => {
        powerShotWrapper.update(10, {} as Player);
        expect(powerShot1.update).toHaveBeenCalledWith(10, {} as Player);
        expect(powerShot2.update).toHaveBeenCalledWith(10, {} as Player);
    });

    it("should return power shot entities", () => {
        expect(powerShotWrapper.powerShotEntities).toStrictEqual([
            powerShot1 as PowerShotInterface,
            powerShot2 as PowerShotInterface,
        ]);
    });

    it("should update scored goal", () => {
        powerShotWrapper.updateScoredGoal(side);
        expect(powerShotWrapper.getPowerShot()).toBe(false);
        powerShotWrapper.updateScoredGoal(side);
        expect(powerShotWrapper.getPowerShot()).toBe(true);
    });

    it("should not update scored goal for other side", () => {
        powerShotWrapper.updateScoredGoal(side);
        expect(powerShotWrapper.getPowerShot()).toBe(false);
        powerShotWrapper.updateScoredGoal(PlayerSide.RIGHT);
        expect(powerShotWrapper.getPowerShot()).toBe(false);
    });

    it("should reset power shot", () => {
        powerShotWrapper.updateScoredGoal(side);
        powerShotWrapper.updateScoredGoal(side);
        expect(powerShotWrapper.getPowerShot()).toBe(true);
        powerShotWrapper.resetPowerShot();
        expect(powerShotWrapper.getPowerShot()).toBe(false);
    });

});

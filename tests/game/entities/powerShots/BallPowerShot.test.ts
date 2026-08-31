import { Player } from "@/game/entities/Player";
import { BallPowerShot } from "@/game/entities/powerShots/BallPowerShot";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { PowerShotType } from "@/game/enums/PowerShotType";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it } from "vitest";

describe("BallPowerShot", () => {
    let ballPowerShot: BallPowerShot;

    beforeEach(() => {
        ballPowerShot = new BallPowerShot();
    });

    it.each([
        [0, false, false, PlayerSide.LEFT, PlayerSide.RIGHT, PowerShotType.FIRE],
        [1, true, true, PlayerSide.RIGHT, PlayerSide.LEFT, PowerShotType.ELECTRIC],
    ])(
        "should enable power shot",
        (colorIndex, shouldStop, shouldMoveToGoal, playerSide, destinationSide, powerShotType) => {
            expect(ballPowerShot.isPowerShot).toBe(false);
            expect(ballPowerShot.shouldStopOnPlayerBounce()).toBe(true);
            expect(ballPowerShot.shouldMoveToGoal()).toBe(false);
            expect(ballPowerShot.getPowerShotDestinationSide()).toBeNull();
            expect(ballPowerShot.getPowerShotType()).toBeNull();

            let player: Pick<Player, "colorIndex" | "side">;
            player = {
                colorIndex: colorIndex,
                side: playerSide,
            };
            ballPowerShot.enablePowerShot(player as Player);

            expect(ballPowerShot.isPowerShot).toBe(true);
            expect(ballPowerShot.shouldStopOnPlayerBounce()).toBe(shouldStop);
            expect(ballPowerShot.shouldMoveToGoal()).toBe(shouldMoveToGoal);
            expect(ballPowerShot.getPowerShotDestinationSide()).toBe(destinationSide);
            expect(ballPowerShot.getPowerShotType()).toBe(powerShotType);
        },
    );

    it("should reset power shot", () => {
        expect(ballPowerShot.isPowerShot).toBe(false);
        const player = Player.createHumanPlayer(new GameConfigs(600, 800), PlayerSide.LEFT);
        ballPowerShot.enablePowerShot(player);
        expect(ballPowerShot.isPowerShot).toBe(true);
        ballPowerShot.resetPowerShot();
        expect(ballPowerShot.isPowerShot).toBe(false);
        expect(ballPowerShot.getPowerShotType()).toBeNull();
        expect(ballPowerShot.getPowerShotDestinationSide()).toBeNull();
    });
});

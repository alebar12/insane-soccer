import { Player } from "@/game/entities/Player";
import { ElectricPowerShot } from "@/game/entities/powerShots/ElectricPowerShot";
import { PowerShotWrapper } from "@/game/entities/powerShots/PowerShotWrapper";
import { PlayerStatus } from "@/game/enums/PlayerStatus";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ElectricPowerShot", () => {
    const gameConfigs = new GameConfigs(600, 800);
    let electricPowerShot: ElectricPowerShot;

    beforeEach(() => {
        electricPowerShot = new ElectricPowerShot(gameConfigs);
    });

    it("should create electric power shot", () => {
        expect(electricPowerShot.interval).toBe(50);
        expect(electricPowerShot.lightningBoltSize).toBe(10);
    });

    it("should update electric power shot", () => {
        expect(electricPowerShot.angleOffset).toBe(0);

        let spliceSpy = vi.spyOn(electricPowerShot.lightningBoltPointArray, "splice");
        electricPowerShot.update(10);
        expect(electricPowerShot.angleOffset).toBeGreaterThan(0);
        expect(electricPowerShot.whiteLineVisible).toBe(false);
        expect(spliceSpy).toHaveBeenCalledOnce();

        spliceSpy.mockClear();
        electricPowerShot.update(10);
        expect(electricPowerShot.angleOffset).toBeGreaterThan(0);
        expect(electricPowerShot.whiteLineVisible).toBe(true);
        expect(spliceSpy).not.toHaveBeenCalled();

        spliceSpy.mockClear();
        electricPowerShot.update(40);
        expect(electricPowerShot.angleOffset).toBeGreaterThan(0);
        expect(electricPowerShot.whiteLineVisible).toBe(false);
        expect(spliceSpy).toHaveBeenCalledOnce();
    });

    it("should render", () => {
        const player = createPlayer(1, true, PlayerStatus.NORMAL);
        expect(electricPowerShot.shouldRender(player)).toBe(true);
    });

    it("should not render for other color index", () => {
        const player = createPlayer(0, true, PlayerStatus.NORMAL);
        expect(electricPowerShot.shouldRender(player)).toBe(false);
    });

    it("should not render for no power shot", () => {
        const player = createPlayer(1, false, PlayerStatus.NORMAL);
        expect(electricPowerShot.shouldRender(player)).toBe(false);
    });

    it("should not render for stunned player", () => {
        const player = createPlayer(1, true, PlayerStatus.STUNNED);
        expect(electricPowerShot.shouldRender(player)).toBe(false);
    });

    function createPlayer(
        colorIndex: number,
        powerShot: boolean,
        playerStatus: PlayerStatus,
    ): Player {
        let player: Pick<Player, "colorIndex" | "playerStatus" | "powerShotWrapper">;
        player = {
            colorIndex: colorIndex,
            playerStatus: playerStatus,
            powerShotWrapper: {
                getPowerShot: () => powerShot,
            } as PowerShotWrapper,
        };

        return player as Player;
    }
});

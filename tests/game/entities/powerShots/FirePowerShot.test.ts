import { Player } from "@/game/entities/Player";
import { FirePowerShot } from "@/game/entities/powerShots/FirePowerShot";
import { PowerShotWrapper } from "@/game/entities/powerShots/PowerShotWrapper";
import { PlayerStatus } from "@/game/enums/PlayerStatus";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("FirePowerShot", () => {
    const gameConfigs = new GameConfigs(600, 800);
    let firePowerShot: FirePowerShot;

    beforeEach(() => {
        firePowerShot = new FirePowerShot(gameConfigs);
    });

    it("should update fire power shot", () => {
        expect(firePowerShot.flames).toHaveLength(0);

        firePowerShot.update(10, createPlayer(0, true, PlayerStatus.NORMAL));
        expect(firePowerShot.flames).toHaveLength(1);
        expect(firePowerShot.flames[0].position).toEqual(new Point(0, 0));
        expect(firePowerShot.flames[0].getDurationFactor()).toBe(0);
        expect(firePowerShot.flames[0].isFinished()).toBe(false);

        const updateSpies = firePowerShot.flames.map(flame => vi.spyOn(flame, "update"));
        firePowerShot.update(10, createPlayer(0, true, PlayerStatus.NORMAL));
        updateSpies.forEach(spy => expect(spy).toHaveBeenCalledWith(10));
        expect(firePowerShot.flames[0].getDurationFactor()).toBeGreaterThan(0);
        expect(firePowerShot.flames[0].isFinished()).toBe(false);

        firePowerShot.update(1000, createPlayer(0, true, PlayerStatus.NORMAL));
        expect(firePowerShot.flames).toHaveLength(1);
    });

    it("should render", () => {
        expect(firePowerShot.shouldRender(createPlayer(0, true, PlayerStatus.NORMAL))).toBe(true);
    });

    function createPlayer(
        colorIndex: number,
        powerShot: boolean,
        playerStatus: PlayerStatus,
    ): Player {
        let player: Pick<
            Player,
            "colorIndex" | "playerStatus" | "powerShotWrapper" | "movementPosition"
        >;
        player = {
            colorIndex: colorIndex,
            playerStatus: playerStatus,
            powerShotWrapper: {
                getPowerShot: () => powerShot,
            } as PowerShotWrapper,
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
        };

        return player as Player;
    }
});

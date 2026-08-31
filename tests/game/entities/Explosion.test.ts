import { Explosion } from "@/game/entities/Explosion";
import { PowerShotType } from "@/game/enums/PowerShotType";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Explosion", () => {
    let gameConfigs: GameConfigs;
    let explosion: Explosion;

    beforeEach(() => {
        gameConfigs = new GameConfigs(600, 800);
        explosion = new Explosion(gameConfigs);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("addExplosion", () => {
        it.each([
            [PowerShotType.FIRE, "red"],
            [PowerShotType.ELECTRIC, "blue"],
        ])("should add explosion", (powerShotType, targetColor) => {
            mockRandomFunction();
            expect(explosion.components).toHaveLength(0);
            explosion.addExplosion(new Point(0, 0), powerShotType);
            expect(explosion.components).toHaveLength(40);
            expect(explosion.position).toEqual(new Point(0, 0));
            expect(explosion.components.some(component => component.duration === 1000)).toBe(true);
            expect(explosion.components.every(component => component.angle === Math.PI * 2)).toBe(
                true,
            );
            expect(explosion.components.every(component => component.getFactor() === 0)).toBe(true);
            expect(explosion.components.every(component => component.isFinished() === false)).toBe(
                true,
            );
            expect(
                explosion.components.every(component =>
                    isCloseToColor(component.color, targetColor),
                ),
            ).toBe(true);
        });
    });

    describe("update", () => {
        it("should update components", () => {
            explosion.addExplosion(new Point(0, 0), PowerShotType.FIRE);
            const updateSpies = explosion.components.map(component =>
                vi.spyOn(component, "update"),
            );
            explosion.update(100);
            updateSpies.forEach(spy => expect(spy).toHaveBeenCalledWith(100));
            explosion.update(10000);
            expect(explosion.components).toHaveLength(0);
        });
    });

    function isCloseToColor(color: string, targetColor: string, threshold = 150): boolean {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const targetRgb = {
            red: [255, 0, 0],
            green: [0, 255, 0],
            blue: [0, 0, 255],
        }[targetColor];
        if (targetRgb === undefined) {
            throw new Error(`Invalid target color: ${targetColor}`);
        }
        const distance = Math.sqrt(
            (r - targetRgb[0]) ** 2 + (g - targetRgb[1]) ** 2 + (b - targetRgb[2]) ** 2,
        );

        return distance <= threshold;
    }

    function mockRandomFunction(): void {
        vi.spyOn(Math, "random").mockReturnValueOnce(1);

        for (let i = 0; i < 40; i++) {
            vi.spyOn(Math, "random")
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(1);
        }
    }
});

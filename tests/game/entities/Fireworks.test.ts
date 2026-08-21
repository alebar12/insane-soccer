import { FireworkDto, Fireworks } from "@/game/entities/Fireworks";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it } from "vitest";

describe("Fireworks", () => {
    let gameConfigs: GameConfigs;
    let fireworks: Fireworks;

    beforeEach(() => {
        gameConfigs = new GameConfigs(600, 800);
        fireworks = new Fireworks(gameConfigs);
    });

    describe("initFireworks", () => {
        it("should init fireworks", () => {
            expect(fireworks.fireworks).toHaveLength(0);
            fireworks.initFireworks();
            expect(fireworks.fireworks).toHaveLength(50);

            fireworks.fireworks.forEach(firework => {
                expect(firework.components.length).toBeGreaterThan(10);
                expect(firework.components.length).toBeLessThan(21);
                firework.components.forEach(component => {
                    expect(component.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
                    firework.components.forEach(otherComponent => {
                        expect(isCloseToColor(component.color, otherComponent.color)).toBe(true);
                    });
                });

                const index = fireworks.fireworks.indexOf(firework);
                if (index < fireworks.fireworks.length - 1) {
                    expect(firework.startTime).toBeGreaterThan(
                        fireworks.fireworks[index + 1].startTime,
                    );
                }
            });
        });
    });

    describe("update", () => {
        it("should update fireworks", () => {
            fireworks.initFireworks();
            const initialStartTimes = fireworks.fireworks.map(firework => firework.startTime);
            fireworks.update(100);
            fireworks.fireworks.forEach((firework, index) => {
                expect(firework.startTime).toBe(initialStartTimes[index] + 100);
            });
        });
    });

    describe("reset", () => {
        it("should reset fireworks", () => {
            fireworks.initFireworks();
            expect(fireworks.fireworks).toHaveLength(50);
            fireworks.reset();
            expect(fireworks.fireworks).toHaveLength(0);
        });
    });

    describe("isFiring", () => {
        it("should return true if firework is firing", () => {
            const firework = new FireworkDto(new Point(0, 0), 0);
            expect(firework.isFiring()).toBe(true);
            firework.startTime = 800;
            expect(firework.isFiring()).toBe(false);
        });
    });

    describe("getLength", () => {
        it("should return length", () => {
            const firework = new FireworkDto(new Point(0, 0), 0);
            expect(firework.getLength()).toBe(0);
            firework.startTime = 350;
            expect(firework.getLength()).toBe(0.3);
            firework.startTime = 700;
            expect(firework.getLength()).toBe(0);
        });
    });

    describe("getTimeFactor", () => {
        it("should return time factor", () => {
            const firework = new FireworkDto(new Point(0, 0), 0);
            expect(firework.getTimeFactor()).toBe(0);
            firework.startTime = 350;
            expect(firework.getTimeFactor()).toBe(0.5);
            firework.startTime = 700;
            expect(firework.getTimeFactor()).toBe(1);
        });
    });

    function isCloseToColor(color: string, targetColor: string, threshold = 90): boolean {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const r2 = parseInt(targetColor.slice(1, 3), 16);
        const g2 = parseInt(targetColor.slice(3, 5), 16);
        const b2 = parseInt(targetColor.slice(5, 7), 16);
        const distance = Math.sqrt((r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2);

        return distance <= threshold;
    }
});

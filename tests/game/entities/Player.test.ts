import { Player } from "@/game/entities/Player";
import { CpuType } from "@/game/enums/CpuType";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Player", () => {
    let gameConfigs: GameConfigs;
    let player: Player;

    beforeEach(() => {
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        gameConfigs = new GameConfigs(600, 800);
        player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
        player.resetToStartGame();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should set correct properties for human player", () => {
            const player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            expect(player.isCpu).toBe(false);
            expect(player.isSubstitute).toBe(false);
            expect(player.side).toBe(PlayerSide.LEFT);
            expect(player.colorIndex).toBe(0);
            expect(player.cpuType).toBeNull();
        });

        it("should set correct properties for scripted cpu player", () => {
            const player = Player.createScriptedCpuPlayer(gameConfigs, PlayerSide.RIGHT, 0.8);
            expect(player.isCpu).toBe(true);
            expect(player.isSubstitute).toBe(false);
            expect(player.side).toBe(PlayerSide.RIGHT);
            expect(player.colorIndex).toBe(0);
            expect(player.cpuType).toBe(CpuType.SCRIPTED);
            expect(player.normalMaxSpeed).toBeCloseTo(0.548);
        });

        it("should set correct properties for ai cpu player", () => {
            const player = Player.createAiCpuPlayer(gameConfigs, PlayerSide.LEFT);
            expect(player.isCpu).toBe(true);
            expect(player.isSubstitute).toBe(false);
            expect(player.side).toBe(PlayerSide.LEFT);
            expect(player.colorIndex).toBe(0);
            expect(player.cpuType).toBe(CpuType.AI);
        });

        it.each([
            [PlayerSide.LEFT, Player.createLeftSubstitutePlayer],
            [PlayerSide.RIGHT, Player.createRightSubstitutePlayer],
        ])("should set correct properties for substitute player", (playerSide, createPlayer) => {
            const player = createPlayer(gameConfigs);
            expect(player.isCpu).toBe(false);
            expect(player.isSubstitute).toBe(true);
            expect(player.side).toBe(playerSide);
            expect(player.colorIndex).toBe(1);
            expect(player.cpuType).toBeNull();
        });
    });

    describe("reachedDestinationPosition", () => {
        it("should return true if reached destination position", () => {
            player.movementPosition.position = new Point(0, 0);
            player.destinationPosition.position = new Point(0, 0);
            expect(player.reachedDestinationPosition()).toBe(true);
        });

        it("should return false if not reached destination position", () => {
            player.movementPosition.position = new Point(0, 0);
            player.destinationPosition.position = new Point(100, 100);
            expect(player.reachedDestinationPosition()).toBe(false);
        });
    });

    describe("move", () => {
        it("should move player", () => {
            player.movementPosition.position = new Point(0, 0);
            player.movementPosition.velocity = new Point(1, 1);
            player.move(10);
            expect(player.movementPosition.position.x).toBe(10);
            expect(player.movementPosition.position.y).toBe(10);
        });
    });

    describe("adjustSpeedToDestinationPoint", () => {
        it("should adjust speed to destination point", () => {
            player.movementPosition.position = new Point(0, 0);
            player.movementPosition.velocity = new Point(0, 0);
            player.destinationPosition.position = new Point(100, 100);
            player.destinationPosition.velocity = new Point(0, 0);
            player.adjustSpeedToDestinationPoint(16);
            expect(player.movementPosition.velocity.x).toBeGreaterThan(0);
            expect(player.movementPosition.velocity.y).toBeGreaterThan(0);
        });

        it("should stop player when reached destination position", () => {
            player.movementPosition.position = new Point(0, 0);
            player.movementPosition.velocity = new Point(0.1, 0.1);
            player.destinationPosition.position = new Point(0, 0);
            player.destinationPosition.velocity = new Point(0, 0);
            player.adjustSpeedToDestinationPoint(16);
            expect(player.movementPosition.velocity.x).toBe(0);
            expect(player.movementPosition.velocity.y).toBe(0);
        });

        it("should slow down player when close to destination position", () => {
            player.movementPosition.position = new Point(80, 80);
            player.movementPosition.velocity = new Point(0.34, 0.34);
            player.destinationPosition.position = new Point(100, 100);
            player.destinationPosition.velocity = new Point(0, 0);
            player.adjustSpeedToDestinationPoint(16);
            expect(player.movementPosition.velocity.x).toBeGreaterThan(0);
            expect(player.movementPosition.velocity.x).toBeLessThan(0.34);
            expect(player.movementPosition.velocity.y).toBeGreaterThan(0);
            expect(player.movementPosition.velocity.y).toBeLessThan(0.34);
        });
    });

    describe("resetToStartGame", () => {
        it("should reset player to start game", () => {
            player.currentMaxSpeed = 10;
            player.resetToStartGame();
            expect(player.currentMaxSpeed).toBe(player.normalMaxSpeed);
        });
    });

    describe("switchColorIndex", () => {
        it("should switch color index", () => {
            player.colorIndex = 0;
            player.switchColorIndex();
            expect(player.colorIndex).toBe(1);
            player.switchColorIndex();
            expect(player.colorIndex).toBe(0);
        });
    });

    describe("updatePowerShot", () => {
        it("should update power shot", () => {
            const updateSpies = player.powerShotWrapper.powerShotEntities.map(powerShot =>
                vi.spyOn(powerShot, "update"),
            );
            player.updatePowerShot(16);
            updateSpies.forEach(spy => expect(spy).toHaveBeenCalledWith(16, player));
        });
    });

    describe("resetOnGoal", () => {
        it("should reset player on goal", () => {
            player.bounceWrapper.startBouncing();
            player.stunnedWrapper.forceStunned();
            player.bounceWrapper.update(16);
            player.stunnedWrapper.decrementStunnedValue(16, new Point(0, 0));
            player.currentMaxSpeed = 10;
            player.resetOnGoal();
            expect(player.bounceWrapper.getBouncingAmplitude()).toBe(0);
            expect(player.stunnedWrapper.isStunned()).toBe(false);
            expect(player.currentMaxSpeed).toBe(player.normalMaxSpeed);
        });
    });

    describe("startBouncing", () => {
        it("should start bouncing", () => {
            player.startBouncing();
            player.bounceWrapper.update(16);
            expect(player.bounceWrapper.getBouncingAmplitude()).toBeGreaterThan(0);
        });
    });
});

import { Ball } from "@/game/entities/Ball";
import { Player } from "@/game/entities/Player";
import { BallStatus } from "@/game/enums/BallStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Ball", () => {
    let gameConfigs: GameConfigs;
    let ball: Ball;

    beforeEach(() => {
        gameConfigs = new GameConfigs(600, 800);
        ball = new Ball(gameConfigs);
    });

    describe("setForStartGame", () => {
        it("should set ball for start game", () => {
            ball.setForStartGame();

            expect(ball.movementPosition.position).toEqual(
                new Point(
                    gameConfigs.fieldXOffset + gameConfigs.fieldWidth / 2,
                    gameConfigs.fieldBorderSize + gameConfigs.ballSizeWithBorder,
                ),
            );
            expect(ball.movementPosition.getSpeed()).toBeGreaterThan(0);
            const prevSpeed = ball.movementPosition.getSpeed();
            ball.setForStartGame();
            expect(ball.movementPosition.getSpeed()).toBe(prevSpeed);
        });
    });

    describe("resetToStartGame", () => {
        it("should reset ball to start game", () => {
            ball.setForStartGame();
            ball.attachToPlayer(Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT));
            ball.resetToStartGame();
            expect(ball.movementPosition.getSpeed()).toBe(0);
            expect(ball.ballStatus).toBe(BallStatus.FREE);
            expect(ball.attachedPlayer).toBeNull();
            ball.setForStartGame();
            expect(ball.movementPosition.getSpeed()).toBeGreaterThan(0);
        });
    });

    describe("move", () => {
        it("should move ball", () => {
            ball.movementPosition.position = new Point(0, 0);
            ball.movementPosition.velocity = new Point(1, 1);
            const prevSpeed = ball.movementPosition.getSpeed();
            ball.move(10);
            expect(ball.movementPosition.position.x).toBe(10);
            expect(ball.movementPosition.position.y).toBe(10);
            expect(ball.movementPosition.getSpeed()).toBeLessThan(prevSpeed);
        });

        it("should reset power shot when speed is low", () => {
            ball.ballPowerShot.enablePowerShot(
                Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT),
            );
            ball.movementPosition.setSpeed(ball.maxSpeed, 0);
            expect(ball.ballPowerShot.isPowerShot).toBe(true);

            ball.move(900);
            expect(ball.ballPowerShot.isPowerShot).toBe(true);

            ball.move(200);
            expect(ball.ballPowerShot.isPowerShot).toBe(false);
            expect(ball.positionHistory.positions).toHaveLength(2);
        });
    });

    describe("updateTrajectory", () => {
        it("should update trajectory", () => {
            const updateSpy = vi.spyOn(ball.positionHistory, "update");
            ball.updateTrajectory(16);
            expect(updateSpy).toHaveBeenCalledWith(16);
        });
    });

    describe("attachToPlayer", () => {
        it("should attach ball to player", () => {
            const resetPowerShotSpy = vi.spyOn(ball.ballPowerShot, "resetPowerShot");
            const player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            player.movementPosition.position = new Point(50, 50);
            ball.movementPosition.position = new Point(100, 100);

            ball.attachToPlayer(player);

            expect(ball.ballStatus).toBe(BallStatus.ATTACHED);
            expect(ball.attachedPlayer).toBe(player);
            expect(ball.angleWithPlayer).toBeCloseTo(Math.PI / 4);
            expect(resetPowerShotSpy).toHaveBeenCalledOnce();
        });
    });

    describe("kick", () => {
        it("should kick ball", () => {
            const kickSpy = vi.spyOn(ball.ballPowerShot, "resetPowerShot");
            const player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            ball.attachToPlayer(player);
            expect(ball.ballStatus).toBe(BallStatus.ATTACHED);
            ball.kick();
            expect(ball.ballStatus).toBe(BallStatus.FREE);
            expect(ball.attachedPlayer).toBeNull();
            expect(ball.movementPosition.getSpeed()).toBeGreaterThan(0);
            expect(kickSpy).toHaveBeenCalledOnce();
            expect(ball.lastAttachedPlayer).toBe(player);
        });

        it("should not kick ball if not attached", () => {
            const kickSpy = vi.spyOn(ball.ballPowerShot, "resetPowerShot");
            ball.kick();
            expect(kickSpy).not.toHaveBeenCalled();
        });

        it("should use power shot if player has one", () => {
            const player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            player.powerShotWrapper.updateScoredGoal(PlayerSide.LEFT);
            player.powerShotWrapper.updateScoredGoal(PlayerSide.LEFT);
            expect(player.powerShotWrapper.getPowerShot()).toBe(true);
            ball.attachToPlayer(player);
            ball.kick();
            expect(ball.ballPowerShot.isPowerShot).toBe(true);
            expect(player.powerShotWrapper.getPowerShot()).toBe(false);
            expect(ball.movementPosition.getSpeed()).toBeGreaterThan(ball.maxSpeed);
        });
    });

    describe("isKickDirectedToGoal", () => {
        it("should return true if kick is directed to goal", () => {
            ball.movementPosition.position = new Point(
                gameConfigs.fieldXOffset + 50,
                gameConfigs.fieldHeight / 2,
            );
            ball.movementPosition.velocity = new Point(-1, 0);
            expect(ball.isKickDirectedToGoal(PlayerSide.RIGHT)).toBe(true);
        });

        it("should handle kick angles that wrap around pi", () => {
            ball.movementPosition.position = new Point(
                gameConfigs.fieldXOffset + 50,
                gameConfigs.fieldHeight / 2,
            );
            ball.movementPosition.setSpeed(1, -Math.PI + 0.01);

            expect(ball.isKickDirectedToGoal(PlayerSide.RIGHT)).toBe(true);
        });

        it("should return false if kick is not directed to goal", () => {
            ball.movementPosition.position = new Point(0, 0);
            ball.movementPosition.setSpeed(1, 0);
            expect(ball.isKickDirectedToGoal(PlayerSide.LEFT)).toBe(false);
        });
    });

    describe("releaseFromPlayer", () => {
        it("should release ball from player", () => {
            const player = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            ball.attachToPlayer(player);
            ball.releaseFromPlayer();
            expect(ball.ballStatus).toBe(BallStatus.FREE);
            expect(ball.attachedPlayer).toBeNull();
            expect(ball.lastAttachedPlayer).toBe(player);
        });
    });

    describe("resetOnGoal", () => {
        it("should reset ball on goal", () => {
            const resetPowerShotSpy = vi.spyOn(ball.ballPowerShot, "resetPowerShot");
            ball.attachToPlayer(Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT));
            ball.resetOnGoal();
            expect(ball.ballStatus).toBe(BallStatus.FREE);
            expect(ball.attachedPlayer).toBeNull();
            expect(ball.lastAttachedPlayer).toBeNull();
            expect(resetPowerShotSpy).toHaveBeenCalledTimes(2);
        });
    });
});

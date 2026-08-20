import { Ball } from "@/game/entities/Ball";
import { Explosion } from "@/game/entities/Explosion";
import { Fireworks } from "@/game/entities/Fireworks";
import { Gate } from "@/game/entities/Gate";
import { GoalPosts } from "@/game/entities/GoalPosts";
import { MenuButton } from "@/game/entities/MenuButton";
import { Player } from "@/game/entities/Player";
import { BallPowerShot } from "@/game/entities/powerShots/BallPowerShot";
import { PowerShotWrapper } from "@/game/entities/powerShots/PowerShotWrapper";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { PowerShotType } from "@/game/enums/PowerShotType";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { ScoreManager } from "@/game/managers/ScoreManager";
import { GameWorld } from "@/game/world/GameWorld";
import { EventBusUtilities } from "@/utils/EventBusUtilities";
import { EventBus } from "ts-bus";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GameWorld", () => {
    let isSubstitutionTime = false;
    let isBallPowerShot = false;
    let isGameOver = false;
    let powerShotType: PowerShotType | null = PowerShotType.ELECTRIC;
    const playerSides = [PlayerSide.LEFT, PlayerSide.RIGHT];

    let bus: Pick<EventBus, "subscribe">;
    let score: Pick<
        ScoreManager,
        "isSubstitutionTime" | "increaseScore" | "isGameOver" | "update" | "reset"
    >;
    let gameStatusManager: Pick<
        GameStatusManager,
        "changeStatus" | "scheduleStatusChange" | "update"
    >;
    let players: Array<
        Pick<
            Player,
            "isSubstitute" | "resetOnGoal" | "powerShotWrapper" | "side" | "switchColorIndex"
        >
    >;
    let substitutePlayers: Array<
        Pick<Player, "isSubstitute" | "side" | "switchColorIndex" | "resetOnGoal">
    >;
    let powerShotWrappers: Array<Pick<PowerShotWrapper, "updateScoredGoal" | "resetPowerShot">>;
    let ballPowerShot: Pick<BallPowerShot, "isPowerShot" | "getPowerShotType">;
    let ball: Pick<Ball, "ballPowerShot" | "resetOnGoal" | "movementPosition">;
    let explosion: Pick<Explosion, "addExplosion" | "update">;
    let fireworks: Pick<Fireworks, "initFireworks" | "update">;

    let gameWorld: GameWorld;

    beforeEach(() => {
        isSubstitutionTime = false;
        isBallPowerShot = false;
        isGameOver = false;

        bus = {
            subscribe: vi.fn(),
        };
        score = {
            increaseScore: vi.fn(),
            isSubstitutionTime: () => isSubstitutionTime,
            get isGameOver() {
                return isGameOver;
            },
            update: vi.fn(),
            reset: vi.fn(),
        };
        gameStatusManager = {
            changeStatus: vi.fn(),
            scheduleStatusChange: vi.fn(),
            update: vi.fn(),
        };

        players = [];
        powerShotWrappers = [];
        for (let i = 0; i < 2; i++) {
            let powerShotWrapper: Pick<PowerShotWrapper, "updateScoredGoal" | "resetPowerShot"> = {
                updateScoredGoal: vi.fn(),
                resetPowerShot: vi.fn(),
            };
            let player: Pick<
                Player,
                "isSubstitute" | "resetOnGoal" | "powerShotWrapper" | "side" | "switchColorIndex"
            > = {
                isSubstitute: false,
                resetOnGoal: vi.fn(),
                powerShotWrapper: powerShotWrapper as PowerShotWrapper,
                side: playerSides[i],
                switchColorIndex: vi.fn(),
            };
            players.push(player);
            powerShotWrappers.push(powerShotWrapper);
        }

        substitutePlayers = [];
        for (let i = 0; i < 2; i++) {
            let player: Pick<Player, "isSubstitute" | "side" | "switchColorIndex" | "resetOnGoal"> =
                {
                    isSubstitute: true,
                    side: playerSides[i],
                    switchColorIndex: vi.fn(),
                    resetOnGoal: vi.fn(),
                };
            substitutePlayers.push(player);
        }
        ballPowerShot = {
            get isPowerShot() {
                return isBallPowerShot;
            },
            getPowerShotType() {
                return powerShotType;
            },
        };
        ball = {
            ballPowerShot: ballPowerShot as BallPowerShot,
            resetOnGoal: vi.fn(),
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
        };
        explosion = {
            addExplosion: vi.fn(),
            update: vi.fn(),
        };
        fireworks = {
            initFireworks: vi.fn(),
            update: vi.fn(),
        };

        gameWorld = new GameWorld(
            {} as GoalPosts,
            [...players, ...substitutePlayers] as Array<Player>,
            ball as Ball,
            fireworks as Fireworks,
            {} as Gate,
            explosion as Explosion,
            {} as MenuButton,
            gameStatusManager as GameStatusManager,
            score as ScoreManager,
            bus as EventBus,
        );
    });

    describe("init", () => {
        it("should subscribe to status changed event", () => {
            expect(bus.subscribe).toHaveBeenCalledWith(
                EventBusUtilities.statusChangedEvent,
                expect.any(Function),
            );
        });
    });

    describe("increaseScore", () => {
        it("should increase score, no substitution, no power shot, no game over", () => {
            gameWorld.increaseScore(PlayerSide.LEFT);
            expect(score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
            expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.WAITING_BALL);
            for (let i = 0; i < 2; i++) {
                expect(players[i].resetOnGoal).toHaveBeenCalled();
                expect(powerShotWrappers[i].updateScoredGoal).toHaveBeenCalledWith(PlayerSide.LEFT);
                expect(powerShotWrappers[i].resetPowerShot).not.toHaveBeenCalled();
            }
            expect(ball.resetOnGoal).toHaveBeenCalled();

            expect(explosion.addExplosion).not.toHaveBeenCalled();
            expect(gameStatusManager.changeStatus).not.toHaveBeenCalledWith(GameStatus.END_GAME);
            expect(gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
            expect(fireworks.initFireworks).not.toHaveBeenCalled();
        });

        it("should increase score, substitution, no power shot, no game over", () => {
            isSubstitutionTime = true;
            gameWorld.increaseScore(PlayerSide.LEFT);
            expect(score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
            expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.SUBSTITUTION);
            for (let i = 0; i < 2; i++) {
                expect(players[i].resetOnGoal).toHaveBeenCalled();
                expect(powerShotWrappers[i].updateScoredGoal).toHaveBeenCalledWith(PlayerSide.LEFT);
                expect(powerShotWrappers[i].resetPowerShot).not.toHaveBeenCalled();
            }
            expect(ball.resetOnGoal).toHaveBeenCalled();

            expect(explosion.addExplosion).not.toHaveBeenCalled();
            expect(gameStatusManager.changeStatus).not.toHaveBeenCalledWith(GameStatus.END_GAME);
            expect(gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
            expect(fireworks.initFireworks).not.toHaveBeenCalled();
        });

        it.each([
            [PowerShotType.FIRE, PowerShotType.FIRE],
            [PowerShotType.ELECTRIC, PowerShotType.ELECTRIC],
            [null, PowerShotType.FIRE],
        ])(
            "should increase score, no substitution, power shot, no game over",
            (sourcePowerShotType, usedPowerShotType) => {
                powerShotType = sourcePowerShotType;
                isBallPowerShot = true;
                gameWorld.increaseScore(PlayerSide.LEFT);
                expect(score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
                expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(
                    GameStatus.WAITING_BALL,
                );
                for (let i = 0; i < 2; i++) {
                    expect(players[i].resetOnGoal).toHaveBeenCalled();
                    expect(powerShotWrappers[i].updateScoredGoal).toHaveBeenCalledWith(
                        PlayerSide.LEFT,
                    );
                    expect(powerShotWrappers[i].resetPowerShot).not.toHaveBeenCalled();
                }
                expect(ball.resetOnGoal).toHaveBeenCalled();

                expect(explosion.addExplosion).toHaveBeenCalledWith(
                    ball.movementPosition.position,
                    usedPowerShotType,
                );
                expect(gameStatusManager.changeStatus).not.toHaveBeenCalledWith(
                    GameStatus.END_GAME,
                );
                expect(gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
                expect(fireworks.initFireworks).not.toHaveBeenCalled();
            },
        );

        it("should increase score, no substitution, no power shot, game over", () => {
            isGameOver = true;
            gameWorld.increaseScore(PlayerSide.RIGHT);
            expect(score.increaseScore).toHaveBeenCalledWith(PlayerSide.RIGHT);
            expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.WAITING_BALL);
            for (let i = 0; i < 2; i++) {
                expect(players[i].resetOnGoal).toHaveBeenCalled();
                expect(powerShotWrappers[i].updateScoredGoal).toHaveBeenCalledWith(
                    PlayerSide.RIGHT,
                );
                expect(powerShotWrappers[i].resetPowerShot).toHaveBeenCalledTimes(1);
            }
            expect(ball.resetOnGoal).toHaveBeenCalled();
            expect(explosion.addExplosion).not.toHaveBeenCalled();

            expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.END_GAME);
            expect(gameStatusManager.scheduleStatusChange).toHaveBeenCalledWith(
                Fireworks.animationTime,
                GameStatus.MENU,
            );
            expect(fireworks.initFireworks).toHaveBeenCalled();
        });
    });

    describe("switchPlayerColor", () => {
        it("should switch player color", () => {
            gameWorld.switchPlayerColor(PlayerSide.LEFT);
            expect(players[0].switchColorIndex).toHaveBeenCalledOnce();
            expect(players[1].switchColorIndex).not.toHaveBeenCalled();
            expect(substitutePlayers[0].switchColorIndex).toHaveBeenCalledOnce();
            expect(substitutePlayers[1].switchColorIndex).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update game status manager, fireworks and explosion", () => {
            gameWorld.update(10);
            expect(gameStatusManager.update).toHaveBeenCalledWith(10);
            expect(fireworks.update).toHaveBeenCalledWith(10);
            expect(explosion.update).toHaveBeenCalledWith(10);
        });
    });

    describe("resetEndGame", () => {
        it("should reset players, ball and score", () => {
            gameWorld.resetEndGame();
            for (let i = 0; i < 2; i++) {
                expect(players[i].resetOnGoal).toHaveBeenCalled();
                expect(substitutePlayers[i].resetOnGoal).toHaveBeenCalled();
            }
            expect(ball.resetOnGoal).toHaveBeenCalled();
            expect(score.reset).toHaveBeenCalled();
        });
    });
});

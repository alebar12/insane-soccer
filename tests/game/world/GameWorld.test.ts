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

type ActivePlayerFake = Pick<
    Player,
    "isSubstitute" | "resetOnGoal" | "powerShotWrapper" | "side" | "switchColorIndex"
>;
type SubstitutePlayerFake = Pick<
    Player,
    "isSubstitute" | "side" | "switchColorIndex" | "resetOnGoal"
>;
type PowerShotWrapperFake = Pick<PowerShotWrapper, "updateScoredGoal" | "resetPowerShot">;
type BallFake = Pick<Ball, "ballPowerShot" | "resetOnGoal" | "movementPosition">;

interface GameWorldHarness {
    state: {
        isSubstitutionTime: boolean;
        isBallPowerShot: boolean;
        isGameOver: boolean;
        powerShotType: PowerShotType | null;
    };
    bus: Pick<EventBus, "subscribe">;
    emitStatusChange: (status: GameStatus) => void;
    score: Pick<
        ScoreManager,
        "isSubstitutionTime" | "increaseScore" | "isGameOver" | "update" | "reset"
    >;
    gameStatusManager: Pick<GameStatusManager, "changeStatus" | "scheduleStatusChange" | "update">;
    leftPlayer: ActivePlayerFake;
    rightPlayer: ActivePlayerFake;
    leftSubstitute: SubstitutePlayerFake;
    rightSubstitute: SubstitutePlayerFake;
    leftPowerShotWrapper: PowerShotWrapperFake;
    rightPowerShotWrapper: PowerShotWrapperFake;
    ball: BallFake;
    explosion: Pick<Explosion, "addExplosion" | "update">;
    fireworks: Pick<Fireworks, "initFireworks" | "update">;
    gameWorld: GameWorld;
}

function createGameWorldHarness(): GameWorldHarness {
    const state = {
        isSubstitutionTime: false,
        isBallPowerShot: false,
        isGameOver: false,
        powerShotType: PowerShotType.ELECTRIC as PowerShotType | null,
    };
    let statusChangedHandler: ((event: { payload: GameStatus }) => void) | undefined;
    const bus: Pick<EventBus, "subscribe"> = {
        subscribe: vi.fn((_event, handler) => {
            statusChangedHandler = handler as typeof statusChangedHandler;
            return () => {};
        }),
    };
    const emitStatusChange = (status: GameStatus): void => {
        if (statusChangedHandler === undefined) {
            throw new Error("GameWorld did not subscribe to status changes");
        }
        statusChangedHandler({ payload: status });
    };
    const score: GameWorldHarness["score"] = {
        increaseScore: vi.fn(),
        isSubstitutionTime: () => state.isSubstitutionTime,
        get isGameOver() {
            return state.isGameOver;
        },
        update: vi.fn(),
        reset: vi.fn(),
    };
    const gameStatusManager: GameWorldHarness["gameStatusManager"] = {
        changeStatus: vi.fn(),
        scheduleStatusChange: vi.fn(),
        update: vi.fn(),
    };
    const leftPowerShotWrapper: PowerShotWrapperFake = {
        updateScoredGoal: vi.fn(),
        resetPowerShot: vi.fn(),
    };
    const rightPowerShotWrapper: PowerShotWrapperFake = {
        updateScoredGoal: vi.fn(),
        resetPowerShot: vi.fn(),
    };
    const leftPlayer: ActivePlayerFake = {
        isSubstitute: false,
        resetOnGoal: vi.fn(),
        powerShotWrapper: leftPowerShotWrapper as PowerShotWrapper,
        side: PlayerSide.LEFT,
        switchColorIndex: vi.fn(),
    };
    const rightPlayer: ActivePlayerFake = {
        isSubstitute: false,
        resetOnGoal: vi.fn(),
        powerShotWrapper: rightPowerShotWrapper as PowerShotWrapper,
        side: PlayerSide.RIGHT,
        switchColorIndex: vi.fn(),
    };
    const leftSubstitute: SubstitutePlayerFake = {
        isSubstitute: true,
        side: PlayerSide.LEFT,
        switchColorIndex: vi.fn(),
        resetOnGoal: vi.fn(),
    };
    const rightSubstitute: SubstitutePlayerFake = {
        isSubstitute: true,
        side: PlayerSide.RIGHT,
        switchColorIndex: vi.fn(),
        resetOnGoal: vi.fn(),
    };
    const ballPowerShot: Pick<BallPowerShot, "isPowerShot" | "getPowerShotType"> = {
        get isPowerShot() {
            return state.isBallPowerShot;
        },
        getPowerShotType() {
            return state.powerShotType;
        },
    };
    const ball: BallFake = {
        ballPowerShot: ballPowerShot as BallPowerShot,
        resetOnGoal: vi.fn(),
        movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
    };
    const explosion: GameWorldHarness["explosion"] = { addExplosion: vi.fn(), update: vi.fn() };
    const fireworks: GameWorldHarness["fireworks"] = { initFireworks: vi.fn(), update: vi.fn() };
    const gameWorld = new GameWorld(
        {} as GoalPosts,
        [leftPlayer, rightPlayer, leftSubstitute, rightSubstitute] as Array<Player>,
        ball as Ball,
        fireworks as Fireworks,
        {} as Gate,
        explosion as Explosion,
        {} as MenuButton,
        gameStatusManager as GameStatusManager,
        score as ScoreManager,
        bus as EventBus,
    );

    return {
        state,
        bus,
        emitStatusChange,
        score,
        gameStatusManager,
        leftPlayer,
        rightPlayer,
        leftSubstitute,
        rightSubstitute,
        leftPowerShotWrapper,
        rightPowerShotWrapper,
        ball,
        explosion,
        fireworks,
        gameWorld,
    };
}

describe("GameWorld", () => {
    let harness: GameWorldHarness;

    beforeEach(() => {
        harness = createGameWorldHarness();
    });

    describe("init", () => {
        it("should subscribe to status changed event", () => {
            expect(harness.bus.subscribe).toHaveBeenCalledWith(
                EventBusUtilities.statusChangedEvent,
                expect.any(Function),
            );
        });

        it("should reset the game when the status changes to menu", () => {
            harness.emitStatusChange(GameStatus.MENU);

            expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.leftSubstitute.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightSubstitute.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.score.reset).toHaveBeenCalledOnce();
        });

        it("should not reset the game for a non-menu status change", () => {
            harness.emitStatusChange(GameStatus.PLAYING);

            expect(harness.leftPlayer.resetOnGoal).not.toHaveBeenCalled();
            expect(harness.rightPlayer.resetOnGoal).not.toHaveBeenCalled();
            expect(harness.leftSubstitute.resetOnGoal).not.toHaveBeenCalled();
            expect(harness.rightSubstitute.resetOnGoal).not.toHaveBeenCalled();
            expect(harness.ball.resetOnGoal).not.toHaveBeenCalled();
            expect(harness.score.reset).not.toHaveBeenCalled();
        });
    });

    describe("increaseScore", () => {
        it("should increase score, no substitution, no power shot, no game over", () => {
            harness.gameWorld.increaseScore(PlayerSide.LEFT);
            expect(harness.score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
            expect(harness.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                GameStatus.WAITING_BALL,
            );
            expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.leftPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.LEFT,
            );
            expect(harness.rightPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.LEFT,
            );
            expect(harness.leftPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
            expect(harness.rightPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
            expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();

            expect(harness.explosion.addExplosion).not.toHaveBeenCalled();
            expect(harness.gameStatusManager.changeStatus).not.toHaveBeenCalledWith(
                GameStatus.END_GAME,
            );
            expect(harness.gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
            expect(harness.fireworks.initFireworks).not.toHaveBeenCalled();
        });

        it("should increase score, substitution, no power shot, no game over", () => {
            harness.state.isSubstitutionTime = true;
            harness.gameWorld.increaseScore(PlayerSide.LEFT);
            expect(harness.score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
            expect(harness.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                GameStatus.SUBSTITUTION,
            );
            expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.leftPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.LEFT,
            );
            expect(harness.rightPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.LEFT,
            );
            expect(harness.leftPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
            expect(harness.rightPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
            expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();

            expect(harness.explosion.addExplosion).not.toHaveBeenCalled();
            expect(harness.gameStatusManager.changeStatus).not.toHaveBeenCalledWith(
                GameStatus.END_GAME,
            );
            expect(harness.gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
            expect(harness.fireworks.initFireworks).not.toHaveBeenCalled();
        });

        it.each([
            [PowerShotType.FIRE, PowerShotType.FIRE],
            [PowerShotType.ELECTRIC, PowerShotType.ELECTRIC],
            [null, PowerShotType.FIRE],
        ])(
            "should increase score, no substitution, power shot, no game over",
            (sourcePowerShotType, usedPowerShotType) => {
                harness.state.powerShotType = sourcePowerShotType;
                harness.state.isBallPowerShot = true;
                harness.gameWorld.increaseScore(PlayerSide.LEFT);
                expect(harness.score.increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
                expect(harness.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                    GameStatus.WAITING_BALL,
                );
                expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
                expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
                expect(harness.leftPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                    PlayerSide.LEFT,
                );
                expect(harness.rightPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                    PlayerSide.LEFT,
                );
                expect(harness.leftPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
                expect(harness.rightPowerShotWrapper.resetPowerShot).not.toHaveBeenCalled();
                expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();

                expect(harness.explosion.addExplosion).toHaveBeenCalledWith(
                    harness.ball.movementPosition.position,
                    usedPowerShotType,
                );
                expect(harness.gameStatusManager.changeStatus).not.toHaveBeenCalledWith(
                    GameStatus.END_GAME,
                );
                expect(harness.gameStatusManager.scheduleStatusChange).not.toHaveBeenCalled();
                expect(harness.fireworks.initFireworks).not.toHaveBeenCalled();
            },
        );

        it("should increase score, no substitution, no power shot, game over", () => {
            harness.state.isGameOver = true;
            harness.gameWorld.increaseScore(PlayerSide.RIGHT);
            expect(harness.score.increaseScore).toHaveBeenCalledWith(PlayerSide.RIGHT);
            expect(harness.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                GameStatus.WAITING_BALL,
            );
            expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.leftPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.RIGHT,
            );
            expect(harness.rightPowerShotWrapper.updateScoredGoal).toHaveBeenCalledWith(
                PlayerSide.RIGHT,
            );
            expect(harness.leftPowerShotWrapper.resetPowerShot).toHaveBeenCalledOnce();
            expect(harness.rightPowerShotWrapper.resetPowerShot).toHaveBeenCalledOnce();
            expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.explosion.addExplosion).not.toHaveBeenCalled();

            expect(harness.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                GameStatus.END_GAME,
            );
            expect(harness.gameStatusManager.scheduleStatusChange).toHaveBeenCalledWith(
                Fireworks.animationTime,
                GameStatus.MENU,
            );
            expect(harness.fireworks.initFireworks).toHaveBeenCalledOnce();
        });
    });

    describe("switchPlayerColor", () => {
        it("should switch player color", () => {
            harness.gameWorld.switchPlayerColor(PlayerSide.LEFT);
            expect(harness.leftPlayer.switchColorIndex).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.switchColorIndex).not.toHaveBeenCalled();
            expect(harness.leftSubstitute.switchColorIndex).toHaveBeenCalledOnce();
            expect(harness.rightSubstitute.switchColorIndex).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update every time-dependent collaborator", () => {
            harness.gameWorld.update(10);
            expect(harness.gameStatusManager.update).toHaveBeenCalledWith(10);
            expect(harness.fireworks.update).toHaveBeenCalledWith(10);
            expect(harness.explosion.update).toHaveBeenCalledWith(10);
            expect(harness.score.update).toHaveBeenCalledWith(10);
        });
    });

    describe("resetEndGame", () => {
        it("should reset players, ball and score", () => {
            harness.gameWorld.resetEndGame();
            expect(harness.leftPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightPlayer.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.leftSubstitute.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.rightSubstitute.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.ball.resetOnGoal).toHaveBeenCalledOnce();
            expect(harness.score.reset).toHaveBeenCalledOnce();
        });
    });
});

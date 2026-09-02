import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { Point } from "@/game/geometry/Point";
import { BallAttachedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedStrategy";
import { BallAttachedWithKeyPressedStrategy } from "@/game/systems/movement/ballStrategies/BallAttachedWithKeyPressedStrategy";
import { FreeBallStrategy } from "@/game/systems/movement/ballStrategies/FreeBallStrategy";
import { MoveToGoalPowerShotStrategy } from "@/game/systems/movement/ballStrategies/MoveToGoalPowerShotStrategy";
import { WaitingBallStrategy } from "@/game/systems/movement/ballStrategies/WaitingBallStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it, vi } from "vitest";

const gameConfigs = new GameConfigs(600, 800);
const playingWorld = { gameStatusManager: { gameStatus: GameStatus.PLAYING } } as GameWorld;

describe("BallAttachedStrategy", () => {
    it("should position an attached ball around its player", () => {
        const ball = {
            ballStatus: BallStatus.ATTACHED,
            attachedPlayer: {
                movementPosition: {
                    position: new Point(10, 20),
                    size: 5,
                    getSpeed: (): number => 0,
                },
                normalMaxSpeed: 1,
            },
            angleWithPlayer: 0,
            movementPosition: { position: new Point(0, 0), size: 2 },
        };
        const strategy = new BallAttachedStrategy();

        expect(strategy.canBeApplied(ball as never, playingWorld)).toBe(true);
        strategy.apply(ball as never, playingWorld, 16);

        expect(ball.movementPosition.position).toMatchObject({ x: 17, y: 20 });
    });

    it("should safely ignore an attached ball without a player and rotate around a moving player", () => {
        const strategy = new BallAttachedStrategy();
        const unattachedBall = { attachedPlayer: null };
        const ball = {
            attachedPlayer: {
                movementPosition: {
                    position: new Point(10, 20),
                    size: 5,
                    getSpeed: (): number => 1,
                    getSpeedAngle: (): number => 0,
                },
                normalMaxSpeed: 1,
            },
            angleWithPlayer: 1,
            movementPosition: { position: new Point(0, 0), size: 2 },
        };

        strategy.apply(unattachedBall as never, playingWorld, 16);
        strategy.apply(ball as never, playingWorld, 16);

        expect(ball.angleWithPlayer).toBeGreaterThan(1);
        expect(ball.angleWithPlayer).toBeLessThanOrEqual(Math.PI);
    });

    it("should snap to the player direction and normalize out-of-range angles", () => {
        const strategy = new BallAttachedStrategy();
        const ball = {
            attachedPlayer: {
                movementPosition: {
                    position: new Point(10, 20),
                    size: 5,
                    getSpeed: (): number => 1,
                    getSpeedAngle: (): number => 0,
                },
                normalMaxSpeed: 1,
            },
            angleWithPlayer: Math.PI - 0.01,
            movementPosition: { position: new Point(0, 0), size: 2 },
        };
        const internals = strategy as unknown as { normalizeAngle: (angle: number) => number };

        strategy.apply(ball as never, playingWorld, 16);

        expect(ball.angleWithPlayer).toBe(Math.PI);
        expect(internals.normalizeAngle(2 * Math.PI)).toBe(0);
        expect(internals.normalizeAngle(-2 * Math.PI)).toBe(0);
    });
});

describe("BallAttachedWithKeyPressedStrategy", () => {
    it("should kick and move an attached human ball when space is pressed", () => {
        const keyboard = { isKeyPressed: vi.fn().mockReturnValue(true) };
        const ball = {
            ballStatus: BallStatus.ATTACHED,
            attachedPlayer: { isCpu: false },
            kick: vi.fn(),
            move: vi.fn(),
        };
        const strategy = new BallAttachedWithKeyPressedStrategy(
            keyboard as unknown as KeyboardInputManager,
        );

        expect(strategy.canBeApplied(ball as never, playingWorld)).toBe(true);
        strategy.apply(ball as never, playingWorld, 16);

        expect(ball.kick).toHaveBeenCalled();
        expect(ball.move).toHaveBeenCalledWith(16);
    });
});

describe("FreeBallStrategy", () => {
    it("should prepare and move a free ball while playing", () => {
        const ball = { ballStatus: BallStatus.FREE, setForStartGame: vi.fn(), move: vi.fn() };
        const strategy = new FreeBallStrategy();

        expect(strategy.canBeApplied(ball as never, playingWorld)).toBe(true);
        strategy.apply(ball as never, playingWorld, 16);

        expect(ball.setForStartGame).toHaveBeenCalled();
        expect(ball.move).toHaveBeenCalledWith(16);
    });
});

describe("MoveToGoalPowerShotStrategy", () => {
    it("should steer a moving power shot toward its destination goal", () => {
        const setSpeed = vi.fn();
        const ball = {
            ballStatus: BallStatus.FREE,
            maxSpeed: 1,
            ballPowerShot: {
                shouldMoveToGoal: (): boolean => true,
                getPowerShotType: (): null => null,
                getPowerShotDestinationSide: (): PlayerSide => PlayerSide.RIGHT,
            },
            movementPosition: {
                position: new Point(100, 100),
                getSpeedAngle: (): number => 0,
                setSpeed,
            },
        };
        const strategy = new MoveToGoalPowerShotStrategy(gameConfigs);

        expect(strategy.canBeApplied(ball as never, playingWorld)).toBe(true);
        strategy.apply(ball as never, playingWorld, 16);

        expect(setSpeed).toHaveBeenCalledWith(1, expect.any(Number));
    });
});

describe("WaitingBallStrategy", () => {
    it("should move a rolling ball and reset a stopped ball", () => {
        const strategy = new WaitingBallStrategy();
        const world = { gameStatusManager: { gameStatus: GameStatus.WAITING_BALL } } as GameWorld;
        const rollingBall = {
            movementPosition: { getSpeed: (): number => 1 },
            move: vi.fn(),
            resetToStartGame: vi.fn(),
        };
        const stoppedBall = {
            movementPosition: { getSpeed: (): number => 0 },
            move: vi.fn(),
            resetToStartGame: vi.fn(),
        };

        expect(strategy.canBeApplied(rollingBall as never, world)).toBe(true);
        strategy.apply(rollingBall as never, world, 16);
        strategy.apply(stoppedBall as never, world, 16);

        expect(rollingBall.move).toHaveBeenCalledWith(16);
        expect(stoppedBall.resetToStartGame).toHaveBeenCalled();
    });
});

import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { BorderLimits } from "@/game/geometry/BorderLimits";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { CollisionSystem } from "@/game/systems/collision/CollisionSystem";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { BallBorderCollisionStrategy } from "@/game/systems/collision/strategies/BallBorderCollisionStrategy";
import { BallGoalCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalCollisionStrategy";
import { BallGoalStakesCollisionStrategy } from "@/game/systems/collision/strategies/BallGoalStakesCollisionStrategy";
import { BallPlayerCollisionStrategy } from "@/game/systems/collision/strategies/BallPlayerCollisionStrategy";
import { BouncingPowerShotCollisionStrategy } from "@/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy";
import { PlayerBorderCollisionStrategy } from "@/game/systems/collision/strategies/PlayerBorderCollisionStrategy";
import { PlayerCollisionStrategy } from "@/game/systems/collision/strategies/PlayerCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it, vi } from "vitest";

const gameConfigs = new GameConfigs(600, 800);

class TestCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(): boolean {
        return true;
    }
    public apply(): void {}
    public fieldLimits(size: number): BorderLimits {
        return this.getFieldBorderLimits(size);
    }

    public goalLimits(size: number, side: PlayerSide): BorderLimits {
        return this.getGoalBorderLimits(size, side);
    }

    public handleCollision(
        movementPoint: MovementPoint,
        borderLimits: BorderLimits,
        invertSpeed: boolean,
        avoidBounceOnGoal: boolean = true,
        avoidBounceOnSubstitution: boolean = false,
    ): boolean {
        return this.handleBorderCollision(
            movementPoint,
            borderLimits,
            invertSpeed,
            avoidBounceOnGoal,
            avoidBounceOnSubstitution,
        );
    }
}

describe("CollisionSystem", () => {
    it("should apply only eligible collision strategies", () => {
        const eligible = { canBeApplied: vi.fn().mockReturnValue(true), apply: vi.fn() };
        const ineligible = { canBeApplied: vi.fn().mockReturnValue(false), apply: vi.fn() };
        const gameWorld = {} as GameWorld;

        new CollisionSystem([
            eligible,
            ineligible,
        ] as unknown as AbstractCollisionStrategy[]).update(gameWorld);

        expect(eligible.apply).toHaveBeenCalledWith(gameWorld);
        expect(ineligible.apply).not.toHaveBeenCalled();
    });
});

describe("AbstractCollisionStrategy", () => {
    it("should derive field limits from the game configuration", () => {
        const limits = new TestCollisionStrategy(gameConfigs).fieldLimits(5);

        expect(limits).toMatchObject({ left: 43, right: 557, top: 11, bottom: 589 });
    });

    it("should clamp every field edge and expose both goal limits", () => {
        const strategy = new TestCollisionStrategy(gameConfigs);
        const limits = new BorderLimits(10, 20, 30, 40);
        const movement = new MovementPoint(new Point(0, 0), new Point(-1, -1), 0, 0);

        expect(strategy.handleCollision(movement, limits, true)).toBe(true);
        movement.position = new Point(30, 50);
        movement.velocity = new Point(1, 1);
        strategy.handleCollision(movement, limits, true);

        expect(movement.position).toMatchObject({ x: 20, y: 40 });
        expect(movement.velocity).toMatchObject({ x: -1, y: -1 });
        expect(strategy.goalLimits(5, PlayerSide.LEFT)).toMatchObject({ left: 5, right: 33 });
        expect(strategy.goalLimits(5, PlayerSide.RIGHT)).toMatchObject({ left: 567, right: 595 });
    });
});

describe("BallBorderCollisionStrategy", () => {
    it("should score when a free playing ball enters the left goal", () => {
        const strategy = new BallBorderCollisionStrategy(gameConfigs);
        const increaseScore = vi.fn();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            increaseScore,
            ball: {
                ballStatus: BallStatus.FREE,
                ballPowerShot: { shouldStopOnPlayerBounce: () => true },
                movementPosition: new MovementPoint(
                    new Point(0, gameConfigs.goalYOffset),
                    new Point(-1, 0),
                    0,
                    5,
                ),
            },
        } as unknown as GameWorld;

        expect(strategy.canBeApplied(gameWorld)).toBe(true);
        strategy.apply(gameWorld);

        expect(increaseScore).toHaveBeenCalledWith(PlayerSide.RIGHT);
    });

    it("should score for the left player when the ball enters the right goal", () => {
        const increaseScore = vi.fn();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            increaseScore,
            ball: {
                ballStatus: BallStatus.FREE,
                movementPosition: new MovementPoint(
                    new Point(gameConfigs.width, gameConfigs.goalYOffset),
                    new Point(1, 0),
                    0,
                    5,
                ),
            },
        } as unknown as GameWorld;

        new BallBorderCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(increaseScore).toHaveBeenCalledWith(PlayerSide.LEFT);
    });
});

describe("BallGoalCollisionStrategy", () => {
    it("should bounce a moving ball inside the right goal area", () => {
        const strategy = new BallGoalCollisionStrategy(gameConfigs);
        const movementPosition = new MovementPoint(
            new Point(gameConfigs.width + 10, gameConfigs.goalYOffset + 10),
            new Point(1, 0),
            0,
            5,
        );
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.WAITING_BALL },
            ball: { movementPosition },
        } as unknown as GameWorld;

        expect(strategy.canBeApplied(gameWorld)).toBe(true);
        strategy.apply(gameWorld);

        expect(movementPosition.position.x).toBe(gameConfigs.width - 5);
        expect(movementPosition.velocity.x).toBeLessThan(0);
    });

    it("should not apply when the ball is stopped outside a waiting state", () => {
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            ball: { movementPosition: { getSpeed: (): number => 0 } },
        } as unknown as GameWorld;

        expect(new BallGoalCollisionStrategy(gameConfigs).canBeApplied(gameWorld)).toBe(false);
    });
});

describe("BallGoalStakesCollisionStrategy", () => {
    it("should redirect a free playing ball that touches a goal post", () => {
        const setSpeed = vi.fn();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            goalPosts: { positions: [new Point(10, 10)], radius: 5 },
            ball: {
                ballStatus: BallStatus.FREE,
                movementPosition: {
                    position: new Point(10, 10),
                    size: 2,
                    getSpeed: () => 3,
                    setSpeed,
                },
            },
        } as unknown as GameWorld;

        new BallGoalStakesCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(setSpeed).toHaveBeenCalledWith(3, expect.any(Number));
    });

    it("should apply only to free balls while playing", () => {
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            ball: { ballStatus: BallStatus.FREE },
        } as unknown as GameWorld;

        expect(new BallGoalStakesCollisionStrategy(gameConfigs).canBeApplied(gameWorld)).toBe(true);
    });
});

describe("BallPlayerCollisionStrategy", () => {
    it("should attach a free ball to a touched active player", () => {
        const player = {
            isSubstitute: false,
            movementPosition: new MovementPoint(new Point(1, 0), new Point(0, 0), 0, 5),
        };
        const attachToPlayer = vi.fn();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            players: [player],
            ball: {
                ballStatus: BallStatus.FREE,
                ballPowerShot: { shouldStopOnPlayerBounce: () => true },
                movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 5),
                attachToPlayer,
            },
        } as unknown as GameWorld;

        new BallPlayerCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(attachToPlayer).toHaveBeenCalledWith(player);
    });

    it("should be eligible only for player-stopping power shots", () => {
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            ball: {
                ballStatus: BallStatus.FREE,
                ballPowerShot: { shouldStopOnPlayerBounce: (): boolean => true },
            },
        } as unknown as GameWorld;

        expect(new BallPlayerCollisionStrategy(gameConfigs).canBeApplied(gameWorld)).toBe(true);
    });
});

describe("BouncingPowerShotCollisionStrategy", () => {
    it("should transfer the ball speed to a touched active player", () => {
        const setSpeed = vi.fn();
        const player = {
            isSubstitute: false,
            movementPosition: { position: new Point(1, 0), size: 5, setSpeed },
        };
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            players: [player],
            ball: {
                ballStatus: BallStatus.FREE,
                ballPowerShot: { shouldStopOnPlayerBounce: () => false },
                movementPosition: { position: new Point(0, 0), size: 5, getSpeed: () => 4 },
            },
        } as unknown as GameWorld;

        new BouncingPowerShotCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(setSpeed).toHaveBeenCalledWith(4, expect.any(Number));
    });

    it("should be eligible only for bouncing power shots", () => {
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            ball: {
                ballStatus: BallStatus.FREE,
                ballPowerShot: { shouldStopOnPlayerBounce: (): boolean => false },
            },
        } as unknown as GameWorld;

        expect(new BouncingPowerShotCollisionStrategy(gameConfigs).canBeApplied(gameWorld)).toBe(
            true,
        );
    });
});

describe("PlayerBorderCollisionStrategy", () => {
    it("should clamp an active player at the border and start its bounce", () => {
        const startBouncing = vi.fn();
        const player = {
            isSubstitute: false,
            startBouncing,
            movementPosition: new MovementPoint(new Point(0, 50), new Point(-1, 0), 0, 5),
        };
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            players: [player],
        } as unknown as GameWorld;

        new PlayerBorderCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(player.movementPosition.position.x).toBe(gameConfigs.fieldXOffset + 5);
        expect(startBouncing).toHaveBeenCalled();
    });

    it("should always be eligible", () => {
        expect(new PlayerBorderCollisionStrategy(gameConfigs).canBeApplied({} as GameWorld)).toBe(
            true,
        );
    });
});

describe("PlayerCollisionStrategy", () => {
    it("should bounce touching players and release an attached ball", () => {
        const player1 = createPlayer(PlayerSide.LEFT, 0);
        const player2 = createPlayer(PlayerSide.RIGHT, 1);
        const releaseFromPlayer = vi.fn();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            players: [player1, player2],
            ball: {
                ballStatus: BallStatus.ATTACHED,
                movementPosition: createMovement(0.5),
                releaseFromPlayer,
            },
        } as unknown as GameWorld;

        new PlayerCollisionStrategy(gameConfigs).apply(gameWorld);

        expect(player1.startBouncing).toHaveBeenCalled();
        expect(player2.stunnedWrapper.updateStunnedValue).toHaveBeenCalled();
        expect(releaseFromPlayer).toHaveBeenCalled();
    });

    it("should always be eligible and ignore a world without both active sides", () => {
        const strategy = new PlayerCollisionStrategy(gameConfigs);
        const gameWorld = { players: [], gameStatusManager: {} } as unknown as GameWorld;

        expect(strategy.canBeApplied(gameWorld)).toBe(true);
        expect(() => strategy.apply(gameWorld)).not.toThrow();
    });
});

function createMovement(x: number): MovementPoint {
    return new MovementPoint(new Point(x, 0), new Point(1, 0), 0, 5);
}

function createPlayer(
    side: PlayerSide,
    x: number,
): {
    side: PlayerSide;
    movementPosition: MovementPoint;
    stunnedWrapper: { updateStunnedValue: ReturnType<typeof vi.fn> };
    startBouncing: ReturnType<typeof vi.fn>;
} {
    return {
        side,
        movementPosition: createMovement(x),
        stunnedWrapper: { updateStunnedValue: vi.fn() },
        startBouncing: vi.fn(),
    };
}

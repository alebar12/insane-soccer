import { BallStatus } from "@/game/enums/BallStatus";
import { CpuType } from "@/game/enums/CpuType";
import { GameStatus } from "@/game/enums/GameStatus";
import { Keys, KeysDirection } from "@/game/enums/Keys";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { PlayerStatus } from "@/game/enums/PlayerStatus";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { AiCpuStrategy } from "@/game/systems/movement/playersStrategies/AiCpuStrategy";
import { MenuStrategy } from "@/game/systems/movement/playersStrategies/MenuStrategy";
import { PlayerInputStrategy } from "@/game/systems/movement/playersStrategies/PlayerInputStrategy";
import { ScriptedCpuStrategy } from "@/game/systems/movement/playersStrategies/ScriptedCpuStrategy";
import { StunnedPlayerStrategy } from "@/game/systems/movement/playersStrategies/StunnedPlayerStrategy";
import { SubstitutePlayersStrategy } from "@/game/systems/movement/playersStrategies/SubstitutePlayersStrategy";
import { SubstitutionBeforeSwitchStrategy } from "@/game/systems/movement/playersStrategies/SubstitutionBeforeSwitchStrategy";
import { SubstitutionTrainingStrategy } from "@/game/systems/movement/playersStrategies/SubstitutionTrainingStrategy";
import { WaitingBallPlayerStrategy } from "@/game/systems/movement/playersStrategies/WaitingBallPlayerStrategy";
import { WinningPlayerStrategy } from "@/game/systems/movement/playersStrategies/WinningPlayerStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it, vi } from "vitest";

const gameConfigs = new GameConfigs(600, 800);
type TestPlayer = {
    isSubstitute: boolean;
    isCpu: boolean;
    cpuType: CpuType | null;
    side: PlayerSide;
    playerStatus: PlayerStatus;
    normalMaxSpeed: number;
    currentMaxSpeed: number;
    destinationPosition: MovementPoint | null;
    movementPosition: MovementPoint;
} & Record<string, unknown>;

const normalPlayer = (overrides: Record<string, unknown> = {}): TestPlayer => ({
    isSubstitute: false,
    isCpu: false,
    cpuType: null,
    side: PlayerSide.LEFT,
    playerStatus: PlayerStatus.NORMAL,
    normalMaxSpeed: 1,
    currentMaxSpeed: 1,
    destinationPosition: null,
    movementPosition: new MovementPoint(new Point(10, 10), new Point(0, 0), 0.1, 5),
    ...overrides,
});
const world = (gameStatus: GameStatus): GameWorld =>
    ({
        gameStatusManager: { gameStatus, isStatusChangedRecently: (): boolean => false },
        score: {
            getWinningPlayerSide: (): null => null,
            isGoalBeforeSubstitution: (): boolean => false,
        },
    }) as unknown as GameWorld;

describe("AiCpuStrategy", () => {
    it("should recognize eligible AI players and use the predicted actions", () => {
        const kick = vi.fn();
        const player = normalPlayer({
            isCpu: true,
            cpuType: CpuType.AI,
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0.1, 5),
        });
        const gameWorld = {
            ...world(GameStatus.PLAYING),
            ball: { attachedPlayer: player, kick },
        } as unknown as GameWorld;
        const strategy = new AiCpuStrategy({
            observationWrapper: {
                extractObservation: (): { toArray: () => number[] } => ({
                    toArray: (): number[] => [],
                }),
            },
            inferenceWrapper: { predict: (): number[] => [2, 1, 1] },
        } as never);

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 10);

        expect(player.movementPosition.velocity.x).toBeGreaterThan(0);
        expect(kick).toHaveBeenCalled();
    });
});

describe("MenuStrategy", () => {
    it("should guide active players toward their menu destination", () => {
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            reachedDestinationPosition: () => false,
            adjustSpeedToDestinationPoint,
        });
        const strategy = new MenuStrategy(gameConfigs);

        expect(strategy.canBeApplied(player as never, world(GameStatus.MENU))).toBe(true);
        strategy.apply(player as never, world(GameStatus.MENU), 16);

        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });

    it("should create a randomized destination after reaching the previous one", () => {
        const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
        const player = normalPlayer({
            reachedDestinationPosition: (): boolean => true,
            adjustSpeedToDestinationPoint: vi.fn(),
        });

        new MenuStrategy(gameConfigs).apply(player as never, world(GameStatus.MENU), 16);

        expect(player.destinationPosition).toBeInstanceOf(MovementPoint);
        expect(player.currentMaxSpeed).toBeGreaterThan(0);
        random.mockRestore();
    });
});

describe("PlayerInputStrategy", () => {
    it("should apply input acceleration to an eligible human player", () => {
        const player = normalPlayer();
        const keyboard = {
            getDirectionPressed: vi.fn((direction: KeysDirection) =>
                direction === KeysDirection.HORIZONTAL ? Keys.ARROW_RIGHT : Keys.ARROW_UP,
            ),
        };
        const strategy = new PlayerInputStrategy(keyboard as unknown as KeyboardInputManager);

        expect(strategy.canBeApplied(player as never, world(GameStatus.PLAYING))).toBe(true);
        strategy.apply(player as never, world(GameStatus.PLAYING), 10);

        expect(player.movementPosition.velocity.x).toBeGreaterThan(0);
        expect(player.movementPosition.velocity.y).toBeLessThan(0);
    });
});

describe("ScriptedCpuStrategy", () => {
    it("should pursue a free ball for an eligible scripted CPU player", () => {
        const destination = new MovementPoint(new Point(20, 30), new Point(0, 0), 0, 5);
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            isCpu: true,
            cpuType: CpuType.SCRIPTED,
            adjustSpeedToDestinationPoint,
        });
        const gameWorld = {
            ...world(GameStatus.PLAYING),
            ball: { ballStatus: "FREE", movementPosition: { clone: () => destination } },
        } as unknown as GameWorld;
        const strategy = new ScriptedCpuStrategy(gameConfigs);

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 16);

        expect(player.destinationPosition).toBe(destination);
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });

    it("should pursue, rotate, and escape the corner while holding the ball", () => {
        const adjustSpeedToDestinationPoint = vi.fn();
        const kick = vi.fn();
        const player = normalPlayer({
            isCpu: true,
            cpuType: CpuType.SCRIPTED,
            adjustSpeedToDestinationPoint,
            movementPosition: new MovementPoint(new Point(100, 300), new Point(1, 0), 0.1, 5),
        });
        const ball = {
            ballStatus: BallStatus.ATTACHED,
            attachedPlayer: player,
            movementPosition: { position: new Point(200, 300) },
            kick,
        };
        const gameWorld = { ...world(GameStatus.PLAYING), ball } as unknown as GameWorld;
        const strategy = new ScriptedCpuStrategy(gameConfigs);

        strategy.apply(player as never, gameWorld, 16);
        player.movementPosition.position = new Point(gameConfigs.fieldWidth / 2 + 50, 200);
        strategy.apply(player as never, gameWorld, 16);
        player.movementPosition.position = new Point(
            gameConfigs.fieldXOffset + gameConfigs.fieldWidth - 10,
            gameConfigs.fieldHeight - 20,
        );
        strategy.apply(player as never, gameWorld, 16);

        expect(kick).toHaveBeenCalled();
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalled();
        expect(player.destinationPosition?.position.x).toBe(
            gameConfigs.fieldXOffset + gameConfigs.fieldWidth / 2,
        );
    });
});

describe("StunnedPlayerStrategy", () => {
    it("should force the losing player to be stunned at the end of a game", () => {
        const forceStunned = vi.fn();
        const player = normalPlayer({
            stunnedWrapper: { forceStunned, isInitialAngleSet: false },
            movementPosition: { getSpeed: () => 1, decrementSpeed: vi.fn() },
        });
        const gameWorld = {
            ...world(GameStatus.END_GAME),
            score: { getWinningPlayerSide: () => PlayerSide.RIGHT },
        } as unknown as GameWorld;
        const strategy = new StunnedPlayerStrategy(gameConfigs);

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 16);

        expect(forceStunned).toHaveBeenCalled();
        expect(player.movementPosition.decrementSpeed).toHaveBeenCalledWith(16);
    });

    it("should set the initial escape angle once a stunned player slows down", () => {
        const movementPosition = new MovementPoint(new Point(100, 100), new Point(0, 0), 0.1, 5);
        const stunnedWrapper = { isInitialAngleSet: false };
        const player = normalPlayer({
            stunnedWrapper,
            movementPosition,
            currentMaxSpeed: 1,
        });
        const strategy = new StunnedPlayerStrategy(gameConfigs);

        strategy.apply(player as never, world(GameStatus.PLAYING), 16);

        expect(stunnedWrapper.isInitialAngleSet).toBe(true);
        expect(movementPosition.getSpeed()).toBeCloseTo(1 / 15);
    });
});

describe("SubstitutePlayersStrategy", () => {
    it("should be eligible only for active players during substitutions", () => {
        const strategy = new SubstitutePlayersStrategy(gameConfigs);

        expect(strategy.canBeApplied(normalPlayer() as never, world(GameStatus.SUBSTITUTION))).toBe(
            true,
        );
        expect(
            strategy.canBeApplied(
                normalPlayer({ isSubstitute: true }) as never,
                world(GameStatus.SUBSTITUTION),
            ),
        ).toBe(false);
    });

    it("should create and update the substitution destination sequence", () => {
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            adjustSpeedToDestinationPoint,
            reachedDestinationPosition: (): boolean => false,
            initialPosition: new Point(50, 50),
        });
        const gameWorld = {
            ...world(GameStatus.SUBSTITUTION),
            switchPlayerColor: vi.fn(),
        } as unknown as GameWorld;

        new SubstitutePlayersStrategy(gameConfigs).apply(player as never, gameWorld, 16);

        expect(player.destinationPosition).toBeInstanceOf(MovementPoint);
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });

    it("should execute every substitution destination action", () => {
        const player = normalPlayer({
            reachedDestinationPosition: (): boolean => true,
            initialPosition: new Point(50, 50),
            adjustSpeedToDestinationPoint: vi.fn(),
        });
        const switchPlayerColor = vi.fn();
        const gameWorld = {
            ...world(GameStatus.SUBSTITUTION),
            switchPlayerColor,
        } as unknown as GameWorld;
        const strategy = new SubstitutePlayersStrategy(gameConfigs);

        for (let index = 0; index < 4; index++) {
            strategy.apply(player as never, gameWorld, 16);
        }

        expect(switchPlayerColor).toHaveBeenCalledWith(PlayerSide.LEFT);
    });
});

describe("SubstitutionBeforeSwitchStrategy", () => {
    it("should reset recently changed substitute players and move them", () => {
        const resetToStartGame = vi.fn();
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            isSubstitute: true,
            resetToStartGame,
            adjustSpeedToDestinationPoint,
        });
        const gameWorld = {
            ...world(GameStatus.SUBSTITUTION),
            gameStatusManager: {
                gameStatus: GameStatus.SUBSTITUTION,
                isStatusChangedRecently: () => true,
            },
        } as unknown as GameWorld;
        const strategy = new SubstitutionBeforeSwitchStrategy();

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 16);

        expect(resetToStartGame).toHaveBeenCalled();
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });
});

describe("SubstitutionTrainingStrategy", () => {
    it("should be eligible for substitutes outside a substitution sequence", () => {
        const strategy = new SubstitutionTrainingStrategy(gameConfigs);

        expect(
            strategy.canBeApplied(
                normalPlayer({ isSubstitute: true }) as never,
                world(GameStatus.PLAYING),
            ),
        ).toBe(true);
        expect(
            strategy.canBeApplied(
                normalPlayer({ isSubstitute: true }) as never,
                world(GameStatus.SUBSTITUTION),
            ),
        ).toBe(false);
    });

    it("should create and update a randomized training sequence", () => {
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            isSubstitute: true,
            adjustSpeedToDestinationPoint,
            reachedDestinationPosition: (): boolean => true,
        });
        const strategy = new SubstitutionTrainingStrategy(gameConfigs);

        for (let index = 0; index < 5; index++) {
            strategy.apply(player as never, world(GameStatus.PLAYING), 16);
        }

        expect(player.destinationPosition).toBeInstanceOf(MovementPoint);
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledTimes(5);
    });
});

describe("WaitingBallPlayerStrategy", () => {
    it("should reset and guide active players while waiting for the ball", () => {
        const resetToStartGame = vi.fn();
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({ resetToStartGame, adjustSpeedToDestinationPoint });
        const gameWorld = {
            ...world(GameStatus.WAITING_BALL),
            gameStatusManager: {
                gameStatus: GameStatus.WAITING_BALL,
                isStatusChangedRecently: () => true,
            },
        } as unknown as GameWorld;
        const strategy = new WaitingBallPlayerStrategy();

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 16);

        expect(resetToStartGame).toHaveBeenCalled();
        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });
});

describe("WinningPlayerStrategy", () => {
    it("should guide the winning active player at the end of the game", () => {
        const adjustSpeedToDestinationPoint = vi.fn();
        const player = normalPlayer({
            reachedDestinationPosition: () => false,
            adjustSpeedToDestinationPoint,
        });
        const gameWorld = {
            ...world(GameStatus.END_GAME),
            score: { getWinningPlayerSide: () => PlayerSide.LEFT },
        } as unknown as GameWorld;
        const strategy = new WinningPlayerStrategy(gameConfigs);

        expect(strategy.canBeApplied(player as never, gameWorld)).toBe(true);
        strategy.apply(player as never, gameWorld, 16);

        expect(adjustSpeedToDestinationPoint).toHaveBeenCalledWith(16);
    });

    it("should create a celebration destination after reaching the previous one", () => {
        const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
        const player = normalPlayer({
            reachedDestinationPosition: (): boolean => true,
            adjustSpeedToDestinationPoint: vi.fn(),
        });

        new WinningPlayerStrategy(gameConfigs).apply(
            player as never,
            world(GameStatus.END_GAME),
            16,
        );

        expect(player.destinationPosition).toBeInstanceOf(MovementPoint);
        expect(player.currentMaxSpeed).toBe(2);
        random.mockRestore();
    });
});

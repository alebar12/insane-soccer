import { AssetLoader } from "@/assets/AssetLoader";
import { ElectricPowerShot } from "@/game/entities/powerShots/ElectricPowerShot";
import { FirePowerShot, FlameDto } from "@/game/entities/powerShots/FirePowerShot";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { PlayerStatus } from "@/game/enums/PlayerStatus";
import { Point } from "@/game/geometry/Point";
import { GameWorld } from "@/game/world/GameWorld";
import { BallRender } from "@/rendering/impl/BallRender";
import { BallTrajectoryRender } from "@/rendering/impl/BallTrajectoryRender";
import { ExplosionRender } from "@/rendering/impl/ExplosionRender";
import { FieldRender } from "@/rendering/impl/FieldRender";
import { FireworksRender } from "@/rendering/impl/FireworksRender";
import { GatesRender } from "@/rendering/impl/GatesRender";
import { MenuRender } from "@/rendering/impl/MenuRender";
import { PlayerPowerShotRender } from "@/rendering/impl/PlayerPowerShotRender";
import { PlayerRender } from "@/rendering/impl/PlayerRender";
import { ScoreRender } from "@/rendering/impl/ScoreRender";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it, vi } from "vitest";

const gameConfigs = new GameConfigs(600, 800);

function createContext(width = 600, height = 800): CanvasRenderingContext2D {
    return {
        canvas: { width, height },
        arc: vi.fn(),
        beginPath: vi.fn(),
        clearRect: vi.fn(),
        closePath: vi.fn(),
        createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
        drawImage: vi.fn(),
        fill: vi.fn(),
        lineTo: vi.fn(),
        moveTo: vi.fn(),
        rect: vi.fn(),
        restore: vi.fn(),
        rotate: vi.fn(),
        save: vi.fn(),
        scale: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
}

function createAssetLoader(image = { width: 100, height: 100 } as HTMLImageElement): AssetLoader {
    return { getImage: vi.fn().mockReturnValue(image) } as unknown as AssetLoader;
}

describe("BallRender", () => {
    it("should draw and stretch a moving free ball while the game is playing", () => {
        const context = createContext();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            ball: {
                ballStatus: BallStatus.FREE,
                maxSpeed: 10,
                movementPosition: {
                    position: new Point(20, 30),
                    getSpeed: () => 5,
                    getSpeedAngle: () => Math.PI / 2,
                },
            },
        } as unknown as GameWorld;

        new BallRender(context, gameConfigs).render(gameWorld);

        expect(context.translate).toHaveBeenCalledWith(20, 30);
        expect(context.scale).toHaveBeenCalledWith(1.5, 1);
        expect(context.arc).toHaveBeenCalledWith(
            0,
            0,
            gameConfigs.ballSizeWithoutBorder,
            0,
            2 * Math.PI,
            false,
        );
        expect(context.fill).toHaveBeenCalledOnce();
    });

    it("should not draw a stationary ball outside the playing state", () => {
        const context = createContext();
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.WAITING_BALL },
            ball: { movementPosition: { getSpeed: () => 0 } },
        } as unknown as GameWorld;

        new BallRender(context, gameConfigs).render(gameWorld);

        expect(context.arc).not.toHaveBeenCalled();
        expect(context.restore).toHaveBeenCalledOnce();
    });

    it.each([GameStatus.WAITING_BALL, GameStatus.END_GAME, GameStatus.SUBSTITUTION])(
        "should draw an attached moving ball during %s",
        gameStatus => {
            const context = createContext();
            const gameWorld = {
                gameStatusManager: { gameStatus },
                ball: {
                    ballStatus: BallStatus.ATTACHED,
                    maxSpeed: 10,
                    movementPosition: {
                        position: new Point(20, 30),
                        getSpeed: (): number => 5,
                        getSpeedAngle: (): number => 0,
                    },
                },
            } as unknown as GameWorld;

            new BallRender(context, gameConfigs).render(gameWorld);

            expect(context.scale).toHaveBeenCalledWith(1, 1);
            expect(context.arc).toHaveBeenCalledOnce();
        },
    );
});

describe("BallTrajectoryRender", () => {
    it("should draw nearby consecutive ball-history positions", () => {
        const context = createContext();
        const getFactor = vi.fn().mockReturnValue(0.25);
        const gameWorld = {
            ball: {
                positionHistory: {
                    positions: [
                        { position: new Point(10, 20) },
                        { position: new Point(15, 25) },
                        { position: new Point(500, 700) },
                    ],
                    getFactor,
                },
            },
        } as unknown as GameWorld;

        new BallTrajectoryRender(context, gameConfigs).render(gameWorld);

        expect(context.moveTo).toHaveBeenCalledWith(10, 20);
        expect(context.lineTo).toHaveBeenCalledWith(15, 25);
        expect(context.stroke).toHaveBeenCalledOnce();
        expect(getFactor).toHaveBeenCalledWith(0);
    });
});

describe("ExplosionRender", () => {
    it("should draw every explosion component at its calculated position", () => {
        const context = createContext();
        const gameWorld = {
            explosion: {
                position: new Point(10, 20),
                maxDistance: 20,
                maxSize: 10,
                components: [{ angle: 0, color: "red", getFactor: (): number => 0.5 }],
            },
        } as unknown as GameWorld;

        new ExplosionRender(context).render(gameWorld);

        expect(context.arc).toHaveBeenCalledWith(20, 20, 5, 0, 2 * Math.PI, false);
        expect(context.fill).toHaveBeenCalledOnce();
    });
});

describe("FieldRender", () => {
    it("should draw the field once, including its goal posts", () => {
        const context = createContext();
        const assetLoader = createAssetLoader();
        const gameWorld = {
            goalPosts: { radius: 5, positions: [new Point(5, 10), new Point(15, 20)] },
        } as unknown as GameWorld;
        const renderer = new FieldRender(context, gameConfigs, assetLoader);

        renderer.render(gameWorld);
        renderer.render(gameWorld);

        expect(assetLoader.getImage).toHaveBeenCalledWith("field.png");
        expect(assetLoader.getImage).toHaveBeenCalledWith("goal_field.png");
        expect(assetLoader.getImage).toHaveBeenCalledWith("track.jpg");
        expect(context.clearRect).toHaveBeenCalledOnce();
        expect(context.arc).toHaveBeenCalledTimes(2);
    });
});

describe("FireworksRender", () => {
    it("should draw components only for firing fireworks", () => {
        const context = createContext();
        const gameWorld = {
            fireworks: {
                lineWidth: 2,
                fireworks: [
                    {
                        isFiring: (): boolean => true,
                        getLength: (): number => 0.5,
                        getTimeFactor: (): number => 1,
                        position: new Point(10, 20),
                        components: [{ angle: 0, color: "blue", distance: 10 }],
                    },
                    { isFiring: (): boolean => false, components: [] },
                ],
            },
        } as unknown as GameWorld;

        new FireworksRender(context).render(gameWorld);

        expect(context.moveTo).toHaveBeenCalledWith(15, 20);
        expect(context.lineTo).toHaveBeenCalledWith(25, 20);
        expect(context.stroke).toHaveBeenCalledOnce();
    });
});

describe("GatesRender", () => {
    it("should draw both gates with mirrored angles", () => {
        const context = createContext();
        const angle = Math.PI / 4;
        const gameWorld = { gates: { currentAngle: angle } } as unknown as GameWorld;

        new GatesRender(context, gameConfigs).render(gameWorld);

        expect(context.rotate).toHaveBeenNthCalledWith(1, angle);
        expect(context.rotate).toHaveBeenNthCalledWith(2, Math.PI - angle);
        expect(context.beginPath).toHaveBeenCalledTimes(2);
        expect(context.rect).toHaveBeenCalledTimes(2);
    });
});

describe("MenuRender", () => {
    it("should clear the menu and render a scaled play button only in menu state", () => {
        const context = createContext();
        const image = { width: 100, height: 100 } as HTMLImageElement;
        const renderer = new MenuRender(context, createAssetLoader(image));
        const gameWorld = {
            gameStatusManager: { gameStatus: GameStatus.MENU },
            menuButton: {
                hoverProgress: 1,
                position: new Point(100, 200),
                dimension: { width: 40, height: 20 },
            },
        } as unknown as GameWorld;

        renderer.render(gameWorld);
        renderer.render({
            gameStatusManager: { gameStatus: GameStatus.PLAYING },
            menuButton: gameWorld.menuButton,
        } as unknown as GameWorld);

        expect(context.clearRect).toHaveBeenCalledTimes(2);
        expect(context.drawImage).toHaveBeenCalledTimes(1);
        expect(context.drawImage).toHaveBeenCalledWith(image, 94, 197, 52, 26);
    });
});

describe("PlayerRender", () => {
    it("should draw players and stars for stunned players", () => {
        const context = createContext();
        const image = { width: 100, height: 100 } as HTMLImageElement;
        const gameWorld = {
            players: [
                {
                    side: PlayerSide.LEFT,
                    colorIndex: 0,
                    playerStatus: PlayerStatus.STUNNED,
                    movementPosition: { position: new Point(10.4, 20.6), size: 12 },
                    bounceWrapper: { getBouncingAmplitude: (): number => 0.1 },
                    stunnedWrapper: {
                        stunnedStars: {
                            stars: [
                                {
                                    position: new Point(10, 20),
                                    direction: 0,
                                    angle: Math.PI / 2,
                                    getFactor: (): number => 0.5,
                                },
                            ],
                        },
                    },
                },
            ],
        } as unknown as GameWorld;

        new PlayerRender(context, gameConfigs, createAssetLoader(image)).render(gameWorld);

        expect(context.translate).toHaveBeenNthCalledWith(1, 10, 21);
        expect(context.arc).toHaveBeenCalledWith(0, 0, 12, 0, 2 * Math.PI, false);
        expect(context.drawImage).toHaveBeenCalledWith(
            image,
            -gameConfigs.playerSizeWithoutBorder / 2,
            -gameConfigs.playerSizeWithoutBorder / 2,
            gameConfigs.playerSizeWithoutBorder,
            gameConfigs.playerSizeWithoutBorder,
        );
    });

    it("should use mapped colors and fall back to red for unknown player colors", () => {
        const context = createContext();
        const normalPlayer = {
            playerStatus: PlayerStatus.NORMAL,
            movementPosition: { position: new Point(10, 20), size: 12 },
            bounceWrapper: { getBouncingAmplitude: (): number => 0 },
        };
        const gameWorld = {
            players: [
                { ...normalPlayer, side: PlayerSide.LEFT, colorIndex: 0 },
                { ...normalPlayer, side: PlayerSide.LEFT, colorIndex: 9 },
            ],
        } as unknown as GameWorld;

        new PlayerRender(context, gameConfigs, createAssetLoader()).render(gameWorld);

        expect(context.fillStyle).toBe("#FF0000");
        expect(context.arc).toHaveBeenCalledTimes(2);
    });
});

describe("PlayerPowerShotRender", () => {
    it("should render fire flames and electric effects for eligible power shots", () => {
        const context = createContext();
        const firePowerShot = new FirePowerShot(gameConfigs);
        firePowerShot.flames.push(new FlameDto(new Point(20, 30), 0));
        const electricPowerShot = new ElectricPowerShot(gameConfigs);
        electricPowerShot.update(1);
        const player = {
            colorIndex: 1,
            playerStatus: PlayerStatus.NORMAL,
            movementPosition: { position: new Point(20, 30) },
            powerShotWrapper: {
                getPowerShot: (): boolean => true,
                powerShotEntities: [firePowerShot, electricPowerShot],
            },
        };
        const gameWorld = { players: [player] } as unknown as GameWorld;

        new PlayerPowerShotRender(
            context,
            createAssetLoader({ width: 80, height: 80 } as HTMLImageElement),
            gameConfigs,
        ).render(gameWorld);

        expect(context.drawImage).toHaveBeenCalledOnce();
        expect(context.createRadialGradient).toHaveBeenCalledOnce();
        expect(context.stroke).toHaveBeenCalledTimes((electricPowerShot.lightningBoltSize - 1) * 3);
    });

    it("should select fire sprites using column then row coordinates", () => {
        const context = createContext();
        const image = { width: 80, height: 80 } as HTMLImageElement;
        const firePowerShot = new FirePowerShot(gameConfigs);
        firePowerShot.flames.push(new FlameDto(new Point(20, 30), 1));
        const gameWorld = {
            players: [
                {
                    powerShotWrapper: { powerShotEntities: [firePowerShot] },
                },
            ],
        } as unknown as GameWorld;

        new PlayerPowerShotRender(context, createAssetLoader(image), gameConfigs).render(gameWorld);

        expect(context.drawImage).toHaveBeenCalledWith(
            image,
            20,
            0,
            20,
            20,
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
        );
    });

    it("should render white inner strokes when electric lightning is visible", () => {
        const context = createContext();
        const electricPowerShot = new ElectricPowerShot(gameConfigs);
        electricPowerShot.update(1);
        electricPowerShot.whiteLineVisible = true;
        const gameWorld = {
            players: [
                {
                    colorIndex: 1,
                    playerStatus: PlayerStatus.NORMAL,
                    movementPosition: { position: new Point(20, 30) },
                    powerShotWrapper: {
                        getPowerShot: (): boolean => true,
                        powerShotEntities: [electricPowerShot],
                    },
                },
            ],
        } as unknown as GameWorld;

        new PlayerPowerShotRender(context, createAssetLoader(), gameConfigs).render(gameWorld);

        expect(context.stroke).toHaveBeenCalledTimes(
            (electricPowerShot.lightningBoltSize - 1) * 3 * 2,
        );
    });

    it("should skip ineligible power shots", () => {
        const context = createContext();
        const electricPowerShot = new ElectricPowerShot(gameConfigs);
        const gameWorld = {
            players: [
                {
                    colorIndex: 0,
                    playerStatus: PlayerStatus.NORMAL,
                    movementPosition: { position: new Point(20, 30) },
                    powerShotWrapper: {
                        getPowerShot: (): boolean => true,
                        powerShotEntities: [electricPowerShot],
                    },
                },
            ],
        } as unknown as GameWorld;

        new PlayerPowerShotRender(context, createAssetLoader(), gameConfigs).render(gameWorld);

        expect(context.arc).not.toHaveBeenCalled();
        expect(context.stroke).not.toHaveBeenCalled();
    });

    it("should ignore renderable power shots without a renderer implementation", () => {
        const context = createContext();
        const gameWorld = {
            players: [
                {
                    powerShotWrapper: {
                        powerShotEntities: [{ shouldRender: (): boolean => true }],
                    },
                },
            ],
        } as unknown as GameWorld;

        new PlayerPowerShotRender(context, createAssetLoader(), gameConfigs).render(gameWorld);

        expect(context.drawImage).not.toHaveBeenCalled();
        expect(context.arc).not.toHaveBeenCalled();
    });
});

describe("ScoreRender", () => {
    it("should clear the score canvas and draw every score digit", () => {
        const context = createContext(600, 100);
        const image = { width: 90, height: 550 } as HTMLImageElement;
        const gameWorld = {
            score: {
                getScoreAsArray: (): number[] => [0, 1, 2, 3],
                getLastUpdateDuration: (): number => 50,
            },
        } as unknown as GameWorld;

        new ScoreRender(context, createAssetLoader(image)).render(gameWorld);

        expect(context.clearRect).toHaveBeenCalledWith(0, 0, 600, 100);
        expect(context.drawImage).toHaveBeenCalledTimes(4);
        expect(context.drawImage).toHaveBeenNthCalledWith(1, image, 0, 0, 90, 10, 0, 5, 810, 90);
    });

    it("should animate score digits backwards when their target score decreases", () => {
        const context = createContext(600, 100);
        const image = { width: 90, height: 550 } as HTMLImageElement;
        let score = 1;
        const gameWorld = {
            score: {
                getScoreAsArray: (): number[] => [score, 0, 0, 0],
                getLastUpdateDuration: (): number => 300,
            },
        } as unknown as GameWorld;
        const renderer = new ScoreRender(context, createAssetLoader(image));

        renderer.render(gameWorld);
        score = 0;
        renderer.render(gameWorld);

        expect(context.drawImage).toHaveBeenNthCalledWith(5, image, 0, 0, 90, 10, 0, 5, 810, 90);
    });
});

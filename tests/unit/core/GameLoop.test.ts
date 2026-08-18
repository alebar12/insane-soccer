import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { ObservationWrapper } from "@/ai/ObservationWrapper";
import { AssetLoader } from "@/assets/AssetLoader";
import { GameLoop } from "@/core/GameLoop";
import { GameStatus } from "@/game/enums/GameStatus";
import { MainSystem } from "@/game/systems/MainSystem";
import { GameWorld } from "@/game/world/GameWorld";
import { MouseInputManager } from "@/input/MouseInputManager";
import { MainRender } from "@/rendering/MainRender";
import { DomHandler } from "@/ui/DomHandler";
import { UIInteractionSystem } from "@/ui/UIInteractionSystem";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(import("@/rendering/MainRender"));
vi.mock(import("@/game/world/GameWorld"));
vi.mock(import("@/ui/UIInteractionSystem"));
vi.mock(import("@/input/MouseInputManager"));
vi.mock(import("@/ai/AiToolsWrapper"));
vi.mock(import("@/ai/InferenceWrapper"));
vi.mock(import("@/ai/ObservationWrapper"));
vi.mock(import("@/game/systems/MainSystem"));

describe("GameLoop", () => {
    let gameConfigs: GameConfigs;
    let domHandler: DomHandler;
    let assetLoader: AssetLoader;
    let fakeGameWorld: GameWorld;
    let fakeGameStatusManager: { changeStatus: ReturnType<typeof vi.fn>; gameStatus: GameStatus };
    let rafCallback: ((time: number) => void) | undefined;
    let rafMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        rafCallback = undefined;
        rafMock = vi.fn((cb: (time: number) => void) => {
            rafCallback = cb;
            return 0;
        });
        vi.stubGlobal("requestAnimationFrame", rafMock);

        gameConfigs = {} as GameConfigs;
        domHandler = { menuCanvas: {} } as DomHandler;
        assetLoader = {
            getImage: vi.fn().mockReturnValue({ width: 100, height: 50 } as HTMLImageElement),
        } as unknown as AssetLoader;

        fakeGameStatusManager = { changeStatus: vi.fn(), gameStatus: GameStatus.MENU };
        fakeGameWorld = {
            gameStatusManager: fakeGameStatusManager,
            players: [
                { movementPosition: { position: { x: 0, y: 0 } } },
                { movementPosition: { position: { x: 0, y: 0 } } },
            ],
            ball: { movementPosition: { position: { x: 0, y: 0 } } },
            menuButton: {},
            fireworks: { reset: vi.fn() },
            update: vi.fn(),
        } as unknown as GameWorld;
        vi.mocked(GameWorld.createPlayingGameWorldWithAiCpu).mockReturnValue(fakeGameWorld);
    });

    describe("constructor", () => {
        it("should create a MainRender with the given configs, domHandler and assetLoader", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            expect(MainRender).toHaveBeenCalledWith(gameConfigs, domHandler, assetLoader);
        });

        it("should load the play.png image to compute the menu button ratio", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            expect(assetLoader.getImage).toHaveBeenCalledWith("play.png");
        });

        it("should create the game world with the computed menu button image ratio", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            expect(GameWorld.createPlayingGameWorldWithAiCpu).toHaveBeenCalledWith(
                gameConfigs,
                100 / 50,
            );
        });

        it("should create a MouseInputManager on the menu canvas and pass it to UIInteractionSystem", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            expect(MouseInputManager).toHaveBeenCalledWith(domHandler.menuCanvas);
            const mouseInputManagerInstance = vi.mocked(MouseInputManager).mock.instances[0];
            expect(UIInteractionSystem).toHaveBeenCalledWith(mouseInputManagerInstance);
        });

        it("should create the AiToolsWrapper with an InferenceWrapper and an ObservationWrapper", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            expect(InferenceWrapper).toHaveBeenCalledTimes(1);
            expect(ObservationWrapper).toHaveBeenCalledWith(gameConfigs);
            const inferenceWrapperInstance = vi.mocked(InferenceWrapper).mock.instances[0];
            const observationWrapperInstance = vi.mocked(ObservationWrapper).mock.instances[0];
            expect(AiToolsWrapper).toHaveBeenCalledWith(
                inferenceWrapperInstance,
                observationWrapperInstance,
            );
        });

        it("should create a MainSystem with the given configs and the created AiToolsWrapper", () => {
            new GameLoop(gameConfigs, domHandler, assetLoader);
            const aiToolsWrapperInstance = vi.mocked(AiToolsWrapper).mock.instances[0];
            expect(MainSystem).toHaveBeenCalledWith(gameConfigs, aiToolsWrapperInstance);
        });
    });

    describe("setHistory", () => {
        it("should split the history into lines and reset the history index", () => {
            const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
            gameLoop.setHistory("1 2 3 4 5 6\n7 8 9 10 11 12");

            // Trigger playback of the first line to verify parsing/indexing behaviour.
            gameLoop.main();
            rafCallback?.(16);
            rafCallback?.(32);

            expect(fakeGameWorld.players[0].movementPosition.position.x).toBe(1);
            expect(fakeGameWorld.players[0].movementPosition.position.y).toBe(2);
            expect(fakeGameWorld.players[1].movementPosition.position.x).toBe(3);
            expect(fakeGameWorld.players[1].movementPosition.position.y).toBe(4);
            expect(fakeGameWorld.ball.movementPosition.position.x).toBe(5);
            expect(fakeGameWorld.ball.movementPosition.position.y).toBe(6);
        });
    });

    describe("main", () => {
        it("should request an animation frame when started", () => {
            const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
            gameLoop.main();
            expect(rafMock).toHaveBeenCalledTimes(1);
        });

        it("should not update or render on the very first frame", () => {
            const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
            gameLoop.main();
            rafCallback?.(16);

            const mainRenderInstance = vi.mocked(MainRender).mock.instances[0];
            expect(mainRenderInstance.render).not.toHaveBeenCalled();
            expect(fakeGameWorld.update).not.toHaveBeenCalled();
        });

        it("should schedule the next animation frame on every tick", () => {
            const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
            gameLoop.main();
            rafCallback?.(16);
            rafCallback?.(32);
            expect(rafMock).toHaveBeenCalledTimes(3);
        });

        describe("without recorded history", () => {
            it("should update inputs, update the world and the systems, then render", () => {
                const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
                gameLoop.main();
                rafCallback?.(16);
                rafCallback?.(32);

                const delta = 16;
                const uiInteractionSystemInstance = vi.mocked(UIInteractionSystem).mock
                    .instances[0];
                const mainSystemInstance = vi.mocked(MainSystem).mock.instances[0];
                const mainRenderInstance = vi.mocked(MainRender).mock.instances[0];

                expect(uiInteractionSystemInstance.update).toHaveBeenCalledWith(
                    fakeGameWorld.menuButton,
                    expect.any(Function),
                    delta,
                );
                expect(fakeGameWorld.update).toHaveBeenCalledWith(delta);
                expect(mainSystemInstance.update).toHaveBeenCalledWith(fakeGameWorld, delta);
                expect(mainRenderInstance.render).toHaveBeenCalledWith(fakeGameWorld);
            });

            it("should switch from MENU to WAITING_BALL, reset fireworks and input on menu click", () => {
                const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
                fakeGameStatusManager.gameStatus = GameStatus.MENU;
                gameLoop.main();
                rafCallback?.(16);
                rafCallback?.(32);

                const uiInteractionSystemInstance = vi.mocked(UIInteractionSystem).mock
                    .instances[0];
                const mouseInputManagerInstance = vi.mocked(MouseInputManager).mock.instances[0];
                uiInteractionSystemInstance.input = mouseInputManagerInstance;
                const onClick = vi.mocked(uiInteractionSystemInstance.update).mock.calls[0][1];
                onClick();

                expect(fakeGameStatusManager.changeStatus).toHaveBeenCalledWith(
                    GameStatus.WAITING_BALL,
                );
                expect(fakeGameWorld.fireworks.reset).toHaveBeenCalledTimes(1);
                expect(mouseInputManagerInstance.reset).toHaveBeenCalledTimes(1);
            });

            it("should not react to the menu click when the status is not MENU", () => {
                const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
                fakeGameStatusManager.gameStatus = GameStatus.PLAYING;
                gameLoop.main();
                rafCallback?.(16);
                rafCallback?.(32);

                const uiInteractionSystemInstance = vi.mocked(UIInteractionSystem).mock
                    .instances[0];
                const onClick = vi.mocked(uiInteractionSystemInstance.update).mock.calls[0][1];
                onClick();

                expect(fakeGameStatusManager.changeStatus).not.toHaveBeenCalled();
                expect(fakeGameWorld.fireworks.reset).not.toHaveBeenCalled();
            });
        });

        describe("with recorded history", () => {
            it("should switch to PLAYING and replay recorded positions instead of updating", () => {
                const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
                gameLoop.setHistory("1 2 3 4 5 6\n7 8 9 10 11 12");
                gameLoop.main();
                rafCallback?.(16);
                rafCallback?.(32);

                expect(fakeGameWorld.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                    GameStatus.PLAYING,
                );
                expect(fakeGameWorld.players[0].movementPosition.position).toEqual({
                    x: 1,
                    y: 2,
                });
                expect(fakeGameWorld.players[1].movementPosition.position).toEqual({
                    x: 3,
                    y: 4,
                });
                expect(fakeGameWorld.ball.movementPosition.position).toEqual({ x: 5, y: 6 });
                expect(fakeGameWorld.update).not.toHaveBeenCalled();

                const mainRenderInstance = vi.mocked(MainRender).mock.instances[0];
                expect(mainRenderInstance.render).toHaveBeenCalledWith(fakeGameWorld);
            });

            it("should advance to the next recorded line on each subsequent frame", () => {
                const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
                gameLoop.setHistory("1 2 3 4 5 6\n7 8 9 10 11 12");
                gameLoop.main();
                rafCallback?.(16);
                rafCallback?.(32);
                rafCallback?.(48);

                expect(fakeGameWorld.players[0].movementPosition.position).toEqual({
                    x: 7,
                    y: 8,
                });
                expect(fakeGameWorld.players[1].movementPosition.position).toEqual({
                    x: 9,
                    y: 10,
                });
                expect(fakeGameWorld.ball.movementPosition.position).toEqual({ x: 11, y: 12 });
            });
        });
    });
});

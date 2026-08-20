import { GameLoop } from "@/core/GameLoop";
import { Ball } from "@/game/entities/Ball";
import { Fireworks } from "@/game/entities/Fireworks";
import { MenuButton } from "@/game/entities/MenuButton";
import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { MainSystem } from "@/game/systems/MainSystem";
import { GameWorld } from "@/game/world/GameWorld";
import { MouseInputManager } from "@/input/MouseInputManager";
import { MainRender } from "@/rendering/MainRender";
import { UIInteractionSystem } from "@/ui/UIInteractionSystem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("GameLoop", () => {
    let gameStatus = GameStatus.MENU;

    let gameStatusManager: Pick<GameStatusManager, "gameStatus" | "changeStatus">;
    let player1: Pick<Player, "movementPosition">;
    let player2: Pick<Player, "movementPosition">;
    let ball: Pick<Ball, "movementPosition">;
    let fireworks: Pick<Fireworks, "reset">;
    let mouseInput: Pick<MouseInputManager, "reset">;
    let gameWorld: Pick<
        GameWorld,
        "update" | "gameStatusManager" | "players" | "ball" | "menuButton" | "fireworks"
    >;
    let mainRender: Pick<MainRender, "render">;
    let mainSystem: Pick<MainSystem, "update">;
    let capturedOnClick: () => void;
    let uiInteractionSystem: Pick<UIInteractionSystem, "update" | "input">;
    let gameLoop: GameLoop;
    let rafCallback: FrameRequestCallback;

    beforeEach(() => {
        gameStatus = GameStatus.MENU;

        gameStatusManager = {
            get gameStatus() {
                return gameStatus;
            },
            changeStatus: vi.fn(),
        };

        player1 = {
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
        };
        player2 = {
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
        };
        ball = {
            movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
        };
        fireworks = { reset: vi.fn() };
        mouseInput = { reset: vi.fn() };

        gameWorld = {
            update: vi.fn(),
            gameStatusManager: gameStatusManager as GameStatusManager,
            players: [player1 as Player, player2 as Player],
            ball: ball as Ball,
            menuButton: {} as MenuButton,
            fireworks: fireworks as Fireworks,
        };
        mainRender = {
            render: vi.fn(),
        };
        mainSystem = {
            update: vi.fn(),
        };
        capturedOnClick = () => {};

        uiInteractionSystem = {
            update: vi.fn((_menuButton, onClick) => {
                capturedOnClick = onClick;
            }),
            input: mouseInput as MouseInputManager,
        };

        gameLoop = new GameLoop(
            gameWorld as GameWorld,
            mainRender as MainRender,
            mainSystem as MainSystem,
            uiInteractionSystem as UIInteractionSystem,
        );

        vi.stubGlobal(
            "requestAnimationFrame",
            vi.fn((cb: FrameRequestCallback) => {
                rafCallback = cb;
                return 0;
            }),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    describe("main", () => {
        it("should request an animation frame", () => {
            gameLoop.main();
            expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        });

        it("should not update or render on the very first frame", () => {
            gameLoop.main();
            rafCallback(16);

            expect(mainRender.render).not.toHaveBeenCalled();
            expect(gameWorld.update).not.toHaveBeenCalled();
            expect(mainSystem.update).not.toHaveBeenCalled();
            expect(uiInteractionSystem.update).not.toHaveBeenCalled();
        });

        it.each([GameStatus.MENU, GameStatus.WAITING_BALL])(
            "should update and render on subsequent frames when starting from %s",
            initialGameStatus => {
                gameLoop.main();
                gameStatus = initialGameStatus;

                rafCallback(16);
                rafCallback(32);
                capturedOnClick();

                expect(mainRender.render).toHaveBeenCalledTimes(1);
                expect(mainRender.render).toHaveBeenCalledWith(gameWorld);
                expect(gameWorld.update).toHaveBeenCalledTimes(1);
                expect(gameWorld.update).toHaveBeenCalledWith(16);
                expect(mainSystem.update).toHaveBeenCalledTimes(1);
                expect(mainSystem.update).toHaveBeenCalledWith(gameWorld, 16);
                expect(uiInteractionSystem.update).toHaveBeenCalledTimes(1);
                expect(uiInteractionSystem.update).toHaveBeenCalledWith(
                    gameWorld.menuButton,
                    expect.any(Function),
                    16,
                );

                if (initialGameStatus === GameStatus.MENU) {
                    expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(
                        GameStatus.WAITING_BALL,
                    );
                    expect(fireworks.reset).toHaveBeenCalledTimes(1);
                    expect(mouseInput.reset).toHaveBeenCalledTimes(1);
                } else {
                    expect(gameStatusManager.changeStatus).not.toHaveBeenCalled();
                    expect(fireworks.reset).not.toHaveBeenCalled();
                    expect(mouseInput.reset).not.toHaveBeenCalled();
                }
            },
        );
    });

    describe("set and show history", () => {
        it("should set history", () => {
            gameLoop.setHistory("7 8 9 10 11 12\n1 2 3 4 5 6");

            gameLoop.main();
            rafCallback(16);
            rafCallback(32);
            rafCallback(48);
            rafCallback(64);
            rafCallback(80);

            expect(gameWorld.gameStatusManager.changeStatus).toHaveBeenCalledTimes(4);
            expect(gameWorld.gameStatusManager.changeStatus).toHaveBeenCalledWith(
                GameStatus.PLAYING,
            );
            expect(gameWorld.players[0].movementPosition.position.x).toBe(1);
            expect(gameWorld.players[0].movementPosition.position.y).toBe(2);
            expect(gameWorld.players[1].movementPosition.position.x).toBe(3);
            expect(gameWorld.players[1].movementPosition.position.y).toBe(4);
            expect(gameWorld.ball.movementPosition.position.x).toBe(5);
            expect(gameWorld.ball.movementPosition.position.y).toBe(6);
        });
    });
});

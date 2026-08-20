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
    const gameStatusManager: Pick<GameStatusManager, 'gameStatus' | 'changeStatus'> = {
        get gameStatus() {
            return gameStatus;
        },
        changeStatus: vi.fn(),
    };
    const player1: Pick<Player, 'movementPosition'> = {
        movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
    };
    const player2: Pick<Player, 'movementPosition'> = {
        movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
    };
    const ball: Pick<Ball, 'movementPosition'> = {
        movementPosition: new MovementPoint(new Point(0, 0), new Point(0, 0), 0, 0),
    };
    const fireworks: Pick<Fireworks, "reset"> = { reset: vi.fn() };
    const mouseInput: Pick<MouseInputManager, "reset"> = { reset: vi.fn() };

    const gameWorld: Pick<GameWorld, 'update' | 'gameStatusManager' | 'players' | 'ball' | 'menuButton' | 'fireworks'> = {
        update: vi.fn(),
        gameStatusManager: gameStatusManager as GameStatusManager,
        players: [player1 as Player, player2 as Player],
        ball: ball as Ball,
        menuButton: {} as MenuButton,
        fireworks: fireworks as Fireworks,
    };
    const mainRender: Pick<MainRender, 'render'> = {
        render: vi.fn(),
    };
    const mainSystem: Pick<MainSystem, 'update'> = {
        update: vi.fn(),
    };
    let capturedOnClick: () => void = () => {};
    
    const uiInteractionSystem: Pick<UIInteractionSystem, "update" | "input"> = {
        update: vi.fn((_menuButton, onClick) => {
            capturedOnClick = onClick;
        }),
        input: mouseInput as MouseInputManager,
    };

    let gameLoop: GameLoop;
    let rafCallback: FrameRequestCallback;

    beforeEach(() => {
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

            expect(mainRender.render).not.toHaveBeenCalled();
            expect(gameWorld.update).not.toHaveBeenCalled();
            expect(mainSystem.update).not.toHaveBeenCalled();
            expect(uiInteractionSystem.update).not.toHaveBeenCalled();
        });

        it.each([
            GameStatus.MENU,
            GameStatus.WAITING_BALL
        ])("should update and render on subsequent frames when starting from %s", (initialGameStatus) => {
            gameLoop.main();
            gameStatus = initialGameStatus;

            rafCallback(16);  
            rafCallback(32);  
            capturedOnClick();

            expect(mainRender.render).toHaveBeenCalledTimes(1);
            expect(gameWorld.update).toHaveBeenCalledTimes(1);
            expect(mainSystem.update).toHaveBeenCalledTimes(1);
            expect(uiInteractionSystem.update).toHaveBeenCalledTimes(1);

            if (initialGameStatus === GameStatus.MENU) {
                expect(gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.WAITING_BALL);
                expect(fireworks.reset).toHaveBeenCalledTimes(1);
                expect(mouseInput.reset).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe("set and show history", () => {
        it("should set history", () => {
            gameLoop.setHistory("1 2 3 4 5 6\n7 8 9 10 11 12");
            expect(gameLoop["history"]).toStrictEqual(["1 2 3 4 5 6", "7 8 9 10 11 12"]);

            gameLoop.main();
            rafCallback(16);  
            rafCallback(32);  

            expect(gameWorld.gameStatusManager.changeStatus).toHaveBeenCalledTimes(1);
            expect(gameWorld.gameStatusManager.changeStatus).toHaveBeenCalledWith(GameStatus.PLAYING);
            expect(gameWorld.players[0].movementPosition.position.x).toBe(1);
            expect(gameWorld.players[0].movementPosition.position.y).toBe(2);
            expect(gameWorld.players[1].movementPosition.position.x).toBe(3);
            expect(gameWorld.players[1].movementPosition.position.y).toBe(4);
            expect(gameWorld.ball.movementPosition.position.x).toBe(5);
            expect(gameWorld.ball.movementPosition.position.y).toBe(6);
        });
    });
});

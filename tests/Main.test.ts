import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
    const gameLoop = {
        main: vi.fn(),
        setHistory: vi.fn(),
    };

    return {
        assetLoaderInit: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        createGameLoop: vi.fn().mockReturnValue(gameLoop),
        gameLoop,
        backgroundCanvas: { height: 550, width: 800 },
    };
});

vi.mock("@/assets/AssetLoader", () => ({
    AssetLoader: class {
        public init(): Promise<void> {
            return dependencies.assetLoaderInit();
        }
    },
}));

vi.mock("@/ui/DomHandler", () => ({
    DomHandler: class {
        public backgroundCanvas = dependencies.backgroundCanvas;
    },
}));

vi.mock("@/core/GameLoopFactory", () => ({
    GameLoopFactory: {
        create: dependencies.createGameLoop,
    },
}));

import { Main } from "@/main";

describe("Main", () => {
    beforeEach(async () => {
        dependencies.assetLoaderInit.mockResolvedValue(undefined);
        dependencies.createGameLoop.mockReturnValue(dependencies.gameLoop);
        await Promise.resolve();
        vi.clearAllMocks();
        document.body.replaceChildren();
        window.history.replaceState({}, "", "/");
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should initialize assets before creating and starting the game loop", async () => {
        await new Main().init();

        expect(dependencies.createGameLoop).toHaveBeenCalledWith(
            expect.objectContaining({ height: 550, width: 800 }),
            expect.objectContaining({ backgroundCanvas: dependencies.backgroundCanvas }),
            expect.anything(),
        );
        expect(dependencies.gameLoop.main).toHaveBeenCalledOnce();
        expect(dependencies.assetLoaderInit.mock.invocationCallOrder[0]).toBeLessThan(
            dependencies.createGameLoop.mock.invocationCallOrder[0],
        );
    });

    it("should load and set history when showPositions is in the URL", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue("position history"),
        });
        vi.stubGlobal("fetch", fetchMock);
        window.history.replaceState({}, "", "/?showPositions");

        await new Main().init();

        expect(fetchMock).toHaveBeenCalledWith("/positions.txt");
        expect(dependencies.gameLoop.setHistory).toHaveBeenCalledWith("position history");
        expect(dependencies.gameLoop.main).toHaveBeenCalledOnce();
    });

    it("should hide the loading window after its opacity transition", async () => {
        const loadingWindow = document.createElement("div");
        loadingWindow.id = "loadingDiv";
        document.body.append(loadingWindow);

        await new Main().init();

        expect(loadingWindow.style.opacity).toBe("0");
        loadingWindow.dispatchEvent(new Event("transitionend"));
        expect(loadingWindow.style.display).toBe("none");
    });
});

import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { AssetLoader } from "@/assets/AssetLoader";
import { GameLoop } from "@/core/GameLoop";
import { GameLoopFactory } from "@/core/GameLoopFactory";
import { MainSystemFactory } from "@/game/systems/MainSystemFactory";
import { GameWorld } from "@/game/world/GameWorld";
import { GameWorldFactory } from "@/game/world/GameWorldFactory";
import { MouseInputManager } from "@/input/MouseInputManager";
import { MainRenderFactory } from "@/rendering/MainRenderFactory";
import { DomHandler } from "@/ui/DomHandler";
import { UIInteractionSystem } from "@/ui/UIInteractionSystem";
import { GameConfigs } from "@/utils/GameConfigs";
import { afterEach, describe, expect, it, vi } from "vitest";

interface GameLoopDependencies {
    uiInteractionSystem: UIInteractionSystem;
}

describe("GameLoopFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should compose the game loop using the play image ratio and AI game world", () => {
        const gameConfigs = new GameConfigs(600, 800);
        const menuCanvas = document.createElement("canvas");
        const domHandler = { menuCanvas } as DomHandler;
        const assetLoader = {
            getImage: vi.fn().mockReturnValue({ width: 200, height: 100 } as HTMLImageElement),
        } as unknown as AssetLoader;
        const gameWorld = {} as GameWorld;
        const mainRender = {} as ReturnType<typeof MainRenderFactory.create>;
        const mainSystem = {} as ReturnType<typeof MainSystemFactory.create>;

        vi.spyOn(MainRenderFactory, "create").mockReturnValue(mainRender);
        vi.spyOn(GameWorldFactory, "createPlayingGameWorldWithAiCpu").mockReturnValue(gameWorld);
        vi.spyOn(MainSystemFactory, "create").mockReturnValue(mainSystem);

        const gameLoop = GameLoopFactory.create(gameConfigs, domHandler, assetLoader);
        const dependencies = gameLoop as unknown as GameLoopDependencies;

        expect(gameLoop).toBeInstanceOf(GameLoop);
        expect(assetLoader.getImage).toHaveBeenCalledWith("play.png");
        expect(MainRenderFactory.create).toHaveBeenCalledWith(gameConfigs, domHandler, assetLoader);
        expect(GameWorldFactory.createPlayingGameWorldWithAiCpu).toHaveBeenCalledWith(
            gameConfigs,
            2,
        );
        expect(MainSystemFactory.create).toHaveBeenCalledWith(
            gameConfigs,
            expect.any(AiToolsWrapper),
        );
        expect(dependencies.uiInteractionSystem.input).toBeInstanceOf(MouseInputManager);

        dependencies.uiInteractionSystem.input.dispose();
    });
});

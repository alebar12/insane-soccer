import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { ObservationWrapper } from "@/ai/ObservationWrapper";
import { AssetLoader } from "@/assets/AssetLoader";
import { MainSystemFactory } from "@/game/systems/MainSystemFactory";
import { GameWorldFactory } from "@/game/world/GameWorldFactory";
import { MouseInputManager } from "@/input/MouseInputManager";
import { MainRenderFactory } from "@/rendering/MainRenderFactory";
import { DomHandler } from "@/ui/DomHandler";
import { UIInteractionSystem } from "@/ui/UIInteractionSystem";
import { GameConfigs } from "@/utils/GameConfigs";
import { GameLoop } from "./GameLoop";

export class GameLoopFactory {
    public static create(
        gameConfigs: GameConfigs,
        domHandler: DomHandler,
        assetLoader: AssetLoader,
    ): GameLoop {
        const mainRender = MainRenderFactory.create(gameConfigs, domHandler, assetLoader);
        const playImg = assetLoader.getImage("play.png");
        const menuButtonImageRatio = playImg.width / playImg.height;
        const gameWorld = GameWorldFactory.createPlayingGameWorldWithAiCpu(
            gameConfigs,
            menuButtonImageRatio,
        );
        const uiInteractionSystem = new UIInteractionSystem(
            new MouseInputManager(domHandler.menuCanvas),
        );

        const aiToolsWrapper = new AiToolsWrapper(
            new InferenceWrapper(),
            new ObservationWrapper(gameConfigs),
        );

        const mainSystem = MainSystemFactory.create(gameConfigs, aiToolsWrapper);

        return new GameLoop(gameWorld, mainRender, mainSystem, uiInteractionSystem);
    }
}

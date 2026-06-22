import { AssetLoader } from "./assets/AssetLoader";
import { GameLoop } from "./core/GameLoop";
import { DomHandler } from "./ui/DomHandler";
import { GameConfigs } from "./utils/GameConfigs";

class Main {
    public async init(): Promise<void> {
        const assetLoader = new AssetLoader();
        await assetLoader.init();

        const domHandler = new DomHandler();
        const gameConfigs = new GameConfigs(
            domHandler.backgroundCanvas.width,
            domHandler.backgroundCanvas.height,
        );

        this.closeLoadingWindow();
        const gameLoop = new GameLoop(gameConfigs, domHandler, assetLoader);
        gameLoop.main();
    }

    private closeLoadingWindow(): void {
        const element = document.getElementById("loadingDiv");
        if (!element) {
            return;
        }

        element.style.opacity = "0";
        element.addEventListener(
            "transitionend",
            function onTransitionEnd() {
                element.style.display = "none";
                element.removeEventListener("transitionend", onTransitionEnd);
                //domHandler.menuCanvas.style.display = "block";
            },
            { once: true },
        );
    }
}

const main = new Main();
main.init();

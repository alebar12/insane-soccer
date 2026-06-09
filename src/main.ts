import { AssetLoader } from "./assets/AssetLoader";
import { GameLoop } from "./core/GameLoop";
import { DomHandler } from "./utils/DomHandler";
import { GameConfigs } from "./utils/GameConfigs";

class Main {
    public async init(): Promise<void> {
        await AssetLoader.getInstance().init();
        this.closeLoadingWindow();

        const domHandler = new DomHandler();
        const gameConfigs = new GameConfigs(
            domHandler.mainCanvas.width,
            domHandler.mainCanvas.height,
        );
        const gameLoop = new GameLoop(gameConfigs, domHandler);
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
            },
            { once: true },
        );

        this.showMainMenu();
    }

    private showMainMenu(): void {
        const element = document.getElementById("menuCanvas");
        if (!element) {
            return;
        }
        element.style.display = "block";
    }
}

const main = new Main();
main.init();

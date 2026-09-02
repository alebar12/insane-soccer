import { AssetLoader } from "@/assets/AssetLoader";
import { DomHandler } from "@/ui/DomHandler";
import { GameConfigs } from "@/utils/GameConfigs";
import { GameLoopFactory } from "./core/GameLoopFactory";
import "./style.css";

export class Main {
    public async init(): Promise<void> {
        const assetLoader = new AssetLoader();
        await assetLoader.init();

        const domHandler = new DomHandler();
        const gameConfigs = new GameConfigs(
            domHandler.backgroundCanvas.width,
            domHandler.backgroundCanvas.height,
        );

        this.closeLoadingWindow();
        const gameLoop = GameLoopFactory.create(gameConfigs, domHandler, assetLoader);

        if (window.location.href.includes("showPositions")) {
            const history = await fetch("/positions.txt").then(response => response.text());
            gameLoop.setHistory(history);
        }
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
    }
}

const main = new Main();
main.init();

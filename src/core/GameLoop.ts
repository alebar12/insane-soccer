import { AssetLoader } from "../assets/AssetLoader";
import { MainRender } from "../rendering/MainRender";
import { DomHandler } from "../utils/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";

export class GameLoop {
    //private delta : number = 0;
    private prevTime: number = 0;
    private mainRender: MainRender;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler.backgroundContext, assetLoader);
    }

    public main(): void {
        const tick = (time: number): void => {
            if (this.prevTime !== 0) {
                //this.delta = time - this.prevTime;
                this.update();
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    private update(): void {}

    private render(): void {
        this.mainRender.render();
    }
}

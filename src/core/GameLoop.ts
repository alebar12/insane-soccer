import { AssetLoader } from "../assets/AssetLoader";
import { GameWorld } from "../game/world/GameWorld";
import { MainRender } from "../rendering/MainRender";
import { DomHandler } from "../utils/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";

export class GameLoop {
    //private delta : number = 0;
    private prevTime: number = 0;
    private mainRender: MainRender;
    private gameWorld: GameWorld;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld(gameConfigs);
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
        this.mainRender.render(this.gameWorld);
    }
}

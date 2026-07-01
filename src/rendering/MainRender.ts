import { AssetLoader } from "../assets/AssetLoader";
import { GameWorld } from "../game/world/GameWorld";
import { DomHandler } from "../ui/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";
import { BallRender } from "./impl/BallRender";
import { FieldRender } from "./impl/FieldRender";
import { FireworksRender } from "./impl/FireworksRender";
import { GatesRender } from "./impl/GatesRender";
import { MenuRender } from "./impl/MenuRender";
import { PlayerPowerShotRender } from "./impl/PlayerPowerShotRender";
import { PlayerRender } from "./impl/PlayerRender";
import { ScoreRender } from "./impl/ScoreRender";
import { RenderInterface } from "./RenderInterface";

export class MainRender {
    private domHandler: DomHandler;
    private renders = new Array<RenderInterface>();

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.domHandler = domHandler;

        this.renders.push(new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader));
        this.renders.push(new ScoreRender(domHandler.scoreContext, assetLoader));
        this.renders.push(new BallRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new GatesRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new PlayerRender(domHandler.gameContext, gameConfigs, assetLoader));
        this.renders.push(new MenuRender(domHandler.menuContext, assetLoader));
        this.renders.push(
            new PlayerPowerShotRender(domHandler.gameContext, assetLoader, gameConfigs),
        );
        this.renders.push(new FireworksRender(domHandler.gameContext));
    }

    public render(gameWorld: GameWorld): void {
        this.clear();
        this.renders.forEach(render => render.render(gameWorld));
    }

    private clear(): void {
        this.domHandler.gameContext.clearRect(
            0,
            0,
            this.domHandler.gameCanvas.width,
            this.domHandler.gameCanvas.height,
        );
    }
}

import { AssetLoader } from "../assets/AssetLoader";
import { DomHandler } from "../utils/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";
import { FieldRender } from "./FieldRender";
import { GatesRender } from "./GatesRender";
import { ScoreRendering } from "./ScoreRendering";

export class MainRender {
    private domHandler: DomHandler;
    private fieldRender: FieldRender;
    private scoreRendering: ScoreRendering;
    private gatesRender: GatesRender;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.domHandler = domHandler;
        this.fieldRender = new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader);
        this.scoreRendering = new ScoreRendering(domHandler.scoreContext, gameConfigs, assetLoader);
        this.gatesRender = new GatesRender(domHandler.gameContext, gameConfigs);

        this.fieldRender.render();
    }

    public render(): void {
        this.clear();
        this.scoreRendering.render();
        this.gatesRender.render();
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

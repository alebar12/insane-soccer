import { AssetLoader } from "../assets/AssetLoader";
import { DomHandler } from "../utils/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";
import { FieldRender } from "./FieldRender";
import { ScoreRendering } from "./ScoreRendering";

export class MainRender {
    private fieldRender: FieldRender;
    private scoreRendering: ScoreRendering;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.fieldRender = new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader);
        this.scoreRendering = new ScoreRendering(domHandler.scoreContext, gameConfigs, assetLoader);
    }

    public render(): void {
        this.fieldRender.render();
        this.scoreRendering.render();
    }
}

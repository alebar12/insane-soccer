import { AssetLoader } from "../assets/AssetLoader";
import { GameConfigs } from "../utils/GameConfigs";
import { FieldRender } from "./FieldRender";

export class MainRender {
    private fieldRender: FieldRender;

    public constructor(
        gameConfigs: GameConfigs,
        backgroundContext: CanvasRenderingContext2D,
        assetLoader: AssetLoader,
    ) {
        this.fieldRender = new FieldRender(backgroundContext, gameConfigs, assetLoader);
    }

    public render(): void {
        this.fieldRender.render();
    }
}

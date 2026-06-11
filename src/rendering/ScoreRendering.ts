import { AssetLoader } from "../assets/AssetLoader";
import { GameConfigs } from "../utils/GameConfigs";

export class ScoreRendering {
    private readonly digitsImages: HTMLImageElement;
    private readonly scoreContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private readonly innerImageWidth: number;
    private readonly innerImageHeight: number = 90;
    private readonly scoreWidth: number;
    private readonly scoreHeight: number;
    private readonly xPositionsArray: Array<number>;
    private readonly yPosition: number;
    //private readonly frameForNumber: number = 6;
    //private readonly totalNumbers: number = 9;

    public constructor(
        scoreContext: CanvasRenderingContext2D,
        gameConfigs: GameConfigs,
        assetLoader: AssetLoader,
    ) {
        this.scoreContext = scoreContext;
        this.gameConfigs = gameConfigs;
        this.digitsImages = assetLoader.getImage("digits.png");

        this.innerImageWidth = this.digitsImages.width;
        this.scoreHeight = (scoreContext.canvas.height * 9) / 10;
        this.scoreWidth = (this.scoreHeight * this.innerImageWidth) / this.innerImageHeight;

        this.xPositionsArray = [
            0,
            this.scoreWidth,
            scoreContext.canvas.width - this.scoreWidth * 2,
            scoreContext.canvas.width - this.scoreWidth,
        ];
        this.yPosition = (scoreContext.canvas.height - this.scoreHeight) / 2;
    }

    public render(): void {
        this.scoreContext.clearRect(0, 0, this.gameConfigs.width, this.gameConfigs.height);

        // TODO gestire aggiornamento punteggio
        this.xPositionsArray.forEach(x => {
            this.scoreContext.drawImage(
                this.digitsImages,
                0,
                this.scoreHeight * 0,
                this.innerImageWidth,
                this.innerImageHeight,
                x,
                this.yPosition,
                this.scoreWidth,
                this.scoreHeight,
            );
        });
    }
}

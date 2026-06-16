import { AssetLoader } from "../assets/AssetLoader";

export class ScoreRender {
    private readonly digitsImages: HTMLImageElement;
    private readonly scoreContext: CanvasRenderingContext2D;
    private readonly innerImageWidth: number;
    private readonly innerImageHeight: number;
    private readonly scoreWidth: number;
    private readonly scoreHeight: number;
    private readonly xPositionsArray: Array<number>;
    private readonly yPosition: number;
    private readonly frameForNumber: number = 6;
    private readonly totalNumbers: number = 10;

    public constructor(scoreContext: CanvasRenderingContext2D, assetLoader: AssetLoader) {
        this.scoreContext = scoreContext;
        this.digitsImages = assetLoader.getImage("digits.png");

        this.innerImageHeight =
            this.digitsImages.height / (this.totalNumbers * this.frameForNumber);
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
        this.scoreContext.clearRect(
            0,
            0,
            this.scoreContext.canvas.width,
            this.scoreContext.canvas.height,
        );

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

import { AssetLoader } from "../assets/AssetLoader";
import { Dimensions } from "../utils/Dimensions";
import { Point } from "../utils/Point";

export class ScoreRender {
    private readonly digitsImages: HTMLImageElement;
    private readonly scoreContext: CanvasRenderingContext2D;
    private readonly innerImageDimensions: Dimensions;
    private readonly scoreDimensions: Dimensions;
    private readonly positionArray: Array<Point>;
    private readonly frameForNumber: number = 6;
    private readonly totalNumbers: number = 10;

    public constructor(scoreContext: CanvasRenderingContext2D, assetLoader: AssetLoader) {
        this.scoreContext = scoreContext;
        this.digitsImages = assetLoader.getImage("digits.png");

        this.innerImageDimensions = new Dimensions(
            this.digitsImages.width,
            this.digitsImages.height / (this.totalNumbers * this.frameForNumber),
        );
        const scoreHeight = (scoreContext.canvas.height * 9) / 10
        this.scoreDimensions = new Dimensions(
            (scoreHeight * this.innerImageDimensions.width) / this.innerImageDimensions.height,
            scoreHeight            
        );

        const yPosition = (scoreContext.canvas.height - this.scoreDimensions.height) / 2;
        this.positionArray = [
            new Point(0, yPosition),
            new Point(this.scoreDimensions.width, yPosition),
            new Point(scoreContext.canvas.width - this.scoreDimensions.width * 2, yPosition),
            new Point(scoreContext.canvas.width - this.scoreDimensions.width, yPosition),
        ];
    }

    public render(): void {
        this.scoreContext.clearRect(
            0,
            0,
            this.scoreContext.canvas.width,
            this.scoreContext.canvas.height,
        );

        // TODO gestire aggiornamento punteggio
        this.positionArray.forEach(position => {
            this.scoreContext.drawImage(
                this.digitsImages,
                0,
                this.innerImageDimensions.height * 0,
                this.innerImageDimensions.width,
                this.innerImageDimensions.height,
                position.x,
                position.y,
                this.scoreDimensions.width,
                this.scoreDimensions.height,
            );
        });
    }
}

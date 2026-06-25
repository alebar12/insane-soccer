import { AssetLoader } from "../assets/AssetLoader";
import { Dimensions } from "../game/geometry/Dimensions";
import { Point } from "../game/geometry/Point";
import { GameWorld } from "../game/world/GameWorld";

export class ScoreRender {
    private readonly digitsImages: HTMLImageElement;
    private readonly scoreContext: CanvasRenderingContext2D;
    private readonly innerImageDimensions: Dimensions;
    private readonly scoreDimensions: Dimensions;
    private readonly positionArray: Array<Point>;
    private readonly frameForNumber: number = 6;
    private readonly totalNumbers: number = 9;
    private readonly frameTime: number = 30;

    public constructor(scoreContext: CanvasRenderingContext2D, assetLoader: AssetLoader) {
        this.scoreContext = scoreContext;
        this.digitsImages = assetLoader.getImage("digits.png");

        this.innerImageDimensions = new Dimensions(
            this.digitsImages.width,
            this.digitsImages.height / (this.totalNumbers * this.frameForNumber + 1),
        );
        const scoreHeight = (scoreContext.canvas.height * 9) / 10;
        this.scoreDimensions = new Dimensions(
            (scoreHeight * this.innerImageDimensions.width) / this.innerImageDimensions.height,
            scoreHeight,
        );

        const yPosition = (scoreContext.canvas.height - this.scoreDimensions.height) / 2;
        this.positionArray = [
            new Point(0, yPosition),
            new Point(this.scoreDimensions.width, yPosition),
            new Point(scoreContext.canvas.width - this.scoreDimensions.width * 2, yPosition),
            new Point(scoreContext.canvas.width - this.scoreDimensions.width, yPosition),
        ];
    }

    public render(gameWorld: GameWorld): void {
        this.scoreContext.clearRect(
            0,
            0,
            this.scoreContext.canvas.width,
            this.scoreContext.canvas.height,
        );

        const scoreArray = gameWorld.score.getScoreAsArray();
        scoreArray.forEach((number, index) => {
            let maxFrame = number * this.frameForNumber;
            let frame = maxFrame;
            if (frame > 0 && gameWorld.score.shouldAnimateIndex(index)) {
                const minFrame = (number - 1) * this.frameForNumber;
                frame =
                    minFrame +
                    Math.floor((Date.now() - gameWorld.score.lastUpdate) / this.frameTime);
                frame = Math.min(frame, maxFrame);
            }

            this.scoreContext.drawImage(
                this.digitsImages,
                0,
                this.innerImageDimensions.height * frame,
                this.innerImageDimensions.width,
                this.innerImageDimensions.height,
                this.positionArray[index].x,
                this.positionArray[index].y,
                this.scoreDimensions.width,
                this.scoreDimensions.height,
            );
        });
    }
}

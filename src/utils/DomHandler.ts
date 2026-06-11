export class DomHandler {
    public readonly backgroundCanvas: HTMLCanvasElement;
    public readonly backgroundContext: CanvasRenderingContext2D;
    public readonly scoreCanvas: HTMLCanvasElement;
    public readonly scoreContext: CanvasRenderingContext2D;

    public constructor() {
        this.backgroundCanvas = document.getElementById("backgroundCanvas") as HTMLCanvasElement;
        if (!this.backgroundCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const backgroundContext = this.backgroundCanvas.getContext("2d");
        if (!backgroundContext) {
            throw new Error("backgroundContext not found");
        }
        this.backgroundContext = backgroundContext;

        this.scoreCanvas = document.getElementById("scoreCanvas") as HTMLCanvasElement;
        if (!this.scoreCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const scoreContext = this.scoreCanvas.getContext("2d");
        if (!scoreContext) {
            throw new Error("backgroundContext not found");
        }
        this.scoreContext = scoreContext;
    }
}

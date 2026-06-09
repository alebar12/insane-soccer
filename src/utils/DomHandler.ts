export class DomHandler {
    public readonly mainCanvas: HTMLCanvasElement;
    public readonly backgroundContext: CanvasRenderingContext2D;

    public constructor() {
        this.mainCanvas = document.getElementById("backgroundCanvas") as HTMLCanvasElement;
        if (!this.mainCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const backgroundContext = this.mainCanvas.getContext("2d");
        if (!backgroundContext) {
            throw new Error("backgroundContext not found");
        }
        this.backgroundContext = backgroundContext;
    }
}

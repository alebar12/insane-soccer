export class DomHandler {
    public readonly mainCanvas: HTMLCanvasElement;
    public readonly backgroundContext: CanvasRenderingContext2D;

    public constructor() {
        this.mainCanvas = document.getElementById("backgroundCanvas") as HTMLCanvasElement;
        this.backgroundContext = this.mainCanvas.getContext("2d")!;
    }
}

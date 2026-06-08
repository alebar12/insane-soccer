export class DomHandler {
    public readonly mainVanvas : HTMLCanvasElement;
    public readonly backgroundContext : CanvasRenderingContext2D;

    public constructor() {
        this.mainVanvas = document.getElementById('backgroundCanvas') as HTMLCanvasElement;
        this.backgroundContext = this.mainVanvas.getContext("2d")!;
    }
}
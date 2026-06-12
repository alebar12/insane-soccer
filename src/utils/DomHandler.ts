export class DomHandler {
    public readonly backgroundCanvas: HTMLCanvasElement;
    public readonly backgroundContext: CanvasRenderingContext2D;
    public readonly scoreCanvas: HTMLCanvasElement;
    public readonly scoreContext: CanvasRenderingContext2D;
    public readonly gameCanvas: HTMLCanvasElement;
    public readonly gameContext: CanvasRenderingContext2D;

    public constructor() {
        [this.backgroundCanvas, this.backgroundContext] = DomHandler.getCanvas("backgroundCanvas");
        [this.scoreCanvas, this.scoreContext] = DomHandler.getCanvas("scoreCanvas");
        [this.gameCanvas, this.gameContext] = DomHandler.getCanvas("gameCanvas");
    }

    private static getCanvas(id: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`${id} not found`);
        }
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error(`${id} context not found`);
        }
        return [canvas, context];
    }
}

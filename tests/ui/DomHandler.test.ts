import { DomHandler } from "@/ui/DomHandler";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const canvasIds = ["backgroundCanvas", "scoreCanvas", "gameCanvas", "menuCanvas"];

describe("DomHandler", () => {
    const context = {} as CanvasRenderingContext2D;
    let canvases: Record<string, HTMLCanvasElement>;

    beforeEach(() => {
        canvases = Object.fromEntries(
            canvasIds.map(id => {
                const canvas = document.createElement("canvas");
                canvas.id = id;
                document.body.append(canvas);
                return [id, canvas];
            }),
        );
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it("should expose every game canvas and its 2D context", () => {
        const domHandler = new DomHandler();

        expect(domHandler.backgroundCanvas).toBe(canvases["backgroundCanvas"]);
        expect(domHandler.backgroundContext).toBe(context);
        expect(domHandler.scoreCanvas).toBe(canvases["scoreCanvas"]);
        expect(domHandler.scoreContext).toBe(context);
        expect(domHandler.gameCanvas).toBe(canvases["gameCanvas"]);
        expect(domHandler.gameContext).toBe(context);
        expect(domHandler.menuCanvas).toBe(canvases["menuCanvas"]);
        expect(domHandler.menuContext).toBe(context);
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(canvasIds.length);
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
    });

    it("should throw when a required canvas is missing", () => {
        document.getElementById("backgroundCanvas")?.remove();

        expect(() => new DomHandler()).toThrow("backgroundCanvas not found");
    });

    it("should throw when a canvas has no 2D context", () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

        expect(() => new DomHandler()).toThrow("backgroundCanvas context not found");
    });
});

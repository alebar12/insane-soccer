import { AssetLoader } from "@/assets/AssetLoader";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeImage {
    public onload: (() => void) | null = null;
    public onerror: ((error: Error) => void) | null = null;
    private _src = "";

    public get src(): string {
        return this._src;
    }

    public set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
    }
}

describe("AssetLoader", () => {
    beforeEach(() => {
        vi.stubGlobal("Image", FakeImage);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("should load all images", async () => {
        const assetLoader = new AssetLoader();
        await assetLoader.init();

        expect(assetLoader.getImage("balls.png")).toBeInstanceOf(FakeImage);
    });

    it("should throw if image not found", () => {
        const assetLoader = new AssetLoader();
        expect(() => assetLoader.getImage("nonexistent.png")).toThrow();
    });

    
})
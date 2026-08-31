import { BounceWrapper } from "@/game/entities/bounce/BounceWrapper";
import { beforeEach, describe, expect, it } from "vitest";

describe("BounceWrapper", () => {
    let bounceWrapper: BounceWrapper;

    beforeEach(() => {
        bounceWrapper = new BounceWrapper();
    });

    it("should bounce", () => {
        expect(bounceWrapper.getBouncingAmplitude()).toBe(0);
        bounceWrapper.startBouncing();
        bounceWrapper.update(1000);
        expect(bounceWrapper.getBouncingAmplitude()).toBeGreaterThan(0);
    });

    it("should not bounce again if not enough time has passed", () => {
        bounceWrapper.startBouncing();
        bounceWrapper.update(1000);
        const amplitude = bounceWrapper.getBouncingAmplitude();
        bounceWrapper.startBouncing();
        expect(bounceWrapper.getBouncingAmplitude()).toBe(amplitude);
    });

    it("should reset bouncing", () => {
        bounceWrapper.startBouncing();
        bounceWrapper.update(1000);
        expect(bounceWrapper.getBouncingAmplitude()).toBeGreaterThan(0);
        bounceWrapper.reset();
        expect(bounceWrapper.getBouncingAmplitude()).toBe(0);
    });

    it("should stop bouncing after a while", () => {
        bounceWrapper.startBouncing();
        bounceWrapper.update(1000);
        expect(bounceWrapper.getBouncingAmplitude()).toBeGreaterThan(0);
        bounceWrapper.update(10000);
        expect(bounceWrapper.getBouncingAmplitude()).toBe(0);
    });
});

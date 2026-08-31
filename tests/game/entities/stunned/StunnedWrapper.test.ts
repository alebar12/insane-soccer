import { StunnedWrapper } from "@/game/entities/stunned/StunnedWrapper";
import { Point } from "@/game/geometry/Point";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("StunnedWrapper", () => {
    let stunnedWrapper: StunnedWrapper;

    beforeEach(() => {
        stunnedWrapper = new StunnedWrapper();
    });

    it("should update stunned value", () => {
        expect(stunnedWrapper.isStunned()).toBe(false);
        stunnedWrapper.updateStunnedValue(10, 5);
        expect(stunnedWrapper.isStunned()).toBe(false);
        stunnedWrapper.updateStunnedValue(5, 1000);
        stunnedWrapper.updateStunnedValue(5, 1000);
        stunnedWrapper.updateStunnedValue(5, 1000);
        expect(stunnedWrapper.isStunned()).toBe(true);
    });

    it("should force stunned value", () => {
        expect(stunnedWrapper.isStunned()).toBe(false);
        stunnedWrapper.forceStunned();
        expect(stunnedWrapper.isStunned()).toBe(true);
    });

    it("should decrement stunned value", () => {
        const updateSpy = vi.spyOn(stunnedWrapper.stunnedStars, "update");
        expect(stunnedWrapper.isStunned()).toBe(false);
        stunnedWrapper.decrementStunnedValue(1000, new Point(0, 0));
        expect(stunnedWrapper.isStunned()).toBe(false);
        stunnedWrapper.forceStunned();
        expect(stunnedWrapper.isStunned()).toBe(true);
        stunnedWrapper.decrementStunnedValue(1000, new Point(0, 0));
        expect(updateSpy).toHaveBeenCalledWith(1000, new Point(0, 0));
        expect(stunnedWrapper.isStunned()).toBe(true);
        stunnedWrapper.decrementStunnedValue(3000, new Point(0, 0));
        expect(updateSpy).toHaveBeenCalledWith(1000, new Point(0, 0));
        expect(stunnedWrapper.isStunned()).toBe(false);
    });
});

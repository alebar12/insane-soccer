import { StunnedStars } from "@/game/entities/stunned/StunnedStars";
import { Point } from "@/game/geometry/Point";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("StunnedStars", () => {
    let stunnedStars: StunnedStars;

    beforeEach(() => {
        stunnedStars = new StunnedStars();
    });

    it("should create, move, update, and remove stars", () => {
        expect(stunnedStars.stars).toHaveLength(0);
        stunnedStars.update(199, new Point(0, 0));
        expect(stunnedStars.stars).toHaveLength(0);

        stunnedStars.update(1, new Point(0, 0));
        expect(stunnedStars.stars).toHaveLength(1);
        expect(stunnedStars.stars[0].position).toEqual(new Point(0, 0));

        const updateSpies = stunnedStars.stars.map(star => vi.spyOn(star, "update"));
        stunnedStars.update(300, new Point(0, 0));
        expect(stunnedStars.stars).toHaveLength(2);
        updateSpies.forEach(spy => expect(spy).toHaveBeenCalledWith(300));
        expect(stunnedStars.stars.every(star => star.getFactor() < 1)).toBe(true);

        stunnedStars.update(3000, new Point(0, 0));
        expect(stunnedStars.stars).toHaveLength(0);
    });
});

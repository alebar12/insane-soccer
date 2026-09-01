import { PlayerSideUtilities, PlayerSide } from "@/game/enums/PlayerSide";
import { describe, it, expect } from "vitest";

describe("PlayerSide", () => {
    it("should return correct opposite side", () => {
        expect(PlayerSideUtilities.getOppositeSide(PlayerSide.LEFT)).toBe(PlayerSide.RIGHT);
        expect(PlayerSideUtilities.getOppositeSide(PlayerSide.RIGHT)).toBe(PlayerSide.LEFT);
    });
});

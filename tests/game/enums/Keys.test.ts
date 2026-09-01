import { Keys, KeysDirection, KeysUtilities } from "@/game/enums/Keys";
import { describe, expect, it } from "vitest";

describe("Keys", () => {
    it("should return correct key direction", () => {
        expect(KeysUtilities.getKeyDirection(Keys.ARROW_LEFT)).toBe(KeysDirection.HORIZONTAL);
        expect(KeysUtilities.getKeyDirection(Keys.ARROW_RIGHT)).toBe(KeysDirection.HORIZONTAL);
        expect(KeysUtilities.getKeyDirection(Keys.ARROW_UP)).toBe(KeysDirection.VERTICAL);
        expect(KeysUtilities.getKeyDirection(Keys.ARROW_DOWN)).toBe(KeysDirection.VERTICAL);
        expect(KeysUtilities.getKeyDirection(Keys.SPACE)).toBeNull();
    });
});

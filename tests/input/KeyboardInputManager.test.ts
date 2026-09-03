import { Keys, KeysDirection } from "@/game/enums/Keys";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("KeyboardInputManager", () => {
    let keyboardInputManager: KeyboardInputManager;

    beforeEach(() => {
        keyboardInputManager = new KeyboardInputManager();
    });

    afterEach(() => {
        keyboardInputManager.dispose();
    });

    it("should track keys pressed and released through document events", () => {
        const keyDownEvent = new KeyboardEvent("keydown", {
            key: Keys.ARROW_UP,
            cancelable: true,
        });
        document.dispatchEvent(keyDownEvent);
        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_UP)).toBe(true);
        expect(keyDownEvent.defaultPrevented).toBe(true);

        const keyUpEvent = new KeyboardEvent("keyup", {
            key: Keys.ARROW_UP,
            cancelable: true,
        });
        document.dispatchEvent(keyUpEvent);
        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_UP)).toBe(false);
        expect(keyUpEvent.defaultPrevented).toBe(true);
    });

    it("should ignore unsupported keys without preventing their default behavior", () => {
        const event = new KeyboardEvent("keydown", { key: "a", cancelable: true });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
        expect(keyboardInputManager.isKeyPressed("a" as Keys)).toBe(false);
    });

    it("should clear held keys when the window loses focus", () => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: Keys.ARROW_LEFT }));
        window.dispatchEvent(new Event("blur"));

        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_LEFT)).toBe(false);
    });

    describe("getDirectionPressed", () => {
        it("should return the first pressed key matching the requested direction", () => {
            keyboardInputManager.setPressedKeys(
                new Set([Keys.ARROW_LEFT, Keys.ARROW_RIGHT, Keys.ARROW_DOWN]),
            );

            expect(keyboardInputManager.getDirectionPressed(KeysDirection.HORIZONTAL)).toBe(
                Keys.ARROW_LEFT,
            );
            expect(keyboardInputManager.getDirectionPressed(KeysDirection.VERTICAL)).toBe(
                Keys.ARROW_DOWN,
            );
        });

        it("should return null when no key matches the requested direction", () => {
            keyboardInputManager.setPressedKeys(new Set([Keys.SPACE]));

            expect(keyboardInputManager.getDirectionPressed(KeysDirection.HORIZONTAL)).toBeNull();
            expect(keyboardInputManager.getDirectionPressed(KeysDirection.VERTICAL)).toBeNull();
        });
    });

    it("should replace its pressed keys without retaining the provided set", () => {
        const forcedKeys = new Set([Keys.ARROW_LEFT]);
        keyboardInputManager.setPressedKeys(forcedKeys);
        forcedKeys.add(Keys.SPACE);

        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_LEFT)).toBe(true);
        expect(keyboardInputManager.isKeyPressed(Keys.SPACE)).toBe(false);

        keyboardInputManager.setPressedKeys(new Set([Keys.ARROW_RIGHT]));
        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_LEFT)).toBe(false);
        expect(keyboardInputManager.isKeyPressed(Keys.ARROW_RIGHT)).toBe(true);
    });

    it("should stop reacting to document events after disposal", () => {
        keyboardInputManager.dispose();

        document.dispatchEvent(new KeyboardEvent("keydown", { key: Keys.SPACE }));
        expect(keyboardInputManager.isKeyPressed(Keys.SPACE)).toBe(false);
    });
});

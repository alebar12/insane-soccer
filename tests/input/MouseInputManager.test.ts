import { Point } from "@/game/geometry/Point";
import { MouseInputManager } from "@/input/MouseInputManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("MouseInputManager", () => {
    let element: HTMLElement;
    let mouseInputManager: MouseInputManager;

    beforeEach(() => {
        element = document.createElement("div");
        vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
            left: 100,
            top: 200,
        } as DOMRect);
        mouseInputManager = new MouseInputManager(element);
    });

    afterEach(() => {
        mouseInputManager.dispose();
        vi.restoreAllMocks();
    });

    it("should initialize with the origin and no pressed mouse button", () => {
        expect(mouseInputManager.mousePosition).toEqual(new Point(0, 0));
        expect(mouseInputManager.isMousePressed).toBe(false);
    });

    it("should store the mouse position relative to the target element", () => {
        element.dispatchEvent(new MouseEvent("mousemove", { clientX: 135, clientY: 260 }));

        expect(mouseInputManager.mousePosition).toEqual(new Point(35, 60));
    });

    it("should mark the mouse as pressed on click and reset it on movement", () => {
        element.dispatchEvent(new MouseEvent("click"));
        expect(mouseInputManager.isMousePressed).toBe(true);

        element.dispatchEvent(new MouseEvent("mousemove"));
        expect(mouseInputManager.isMousePressed).toBe(false);
    });

    it("should reset the pressed state when requested", () => {
        element.dispatchEvent(new MouseEvent("click"));
        mouseInputManager.reset();

        expect(mouseInputManager.isMousePressed).toBe(false);
    });

    it("should stop reacting to element events after disposal", () => {
        mouseInputManager.dispose();

        element.dispatchEvent(new MouseEvent("click"));
        element.dispatchEvent(new MouseEvent("mousemove", { clientX: 135, clientY: 260 }));

        expect(mouseInputManager.isMousePressed).toBe(false);
        expect(mouseInputManager.mousePosition).toEqual(new Point(0, 0));
    });
});

import { HoverableEntity } from "@/game/entities/HoverableEntity";
import { Point } from "@/game/geometry/Point";
import { MouseInputManager } from "@/input/MouseInputManager";
import { UIInteractionSystem } from "@/ui/UIInteractionSystem";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("UIInteractionSystem", () => {
    let mouseInputManager: Pick<MouseInputManager, "mousePosition" | "isMousePressed" | "reset">;
    let uiInteractionSystem: UIInteractionSystem;
    let hoverable: Pick<
        HoverableEntity,
        "contains" | "hovered" | "hoverProgress" | "getTransitionTime"
    >;

    beforeEach(() => {
        mouseInputManager = {
            mousePosition: new Point(0, 0),
            isMousePressed: false,
            reset: vi.fn(),
        };
        hoverable = {
            contains: vi.fn(),
            hovered: false,
            hoverProgress: 0,
            getTransitionTime: vi.fn(),
        };
        uiInteractionSystem = new UIInteractionSystem(mouseInputManager as MouseInputManager);
    });

    describe("update", () => {
        it("should set the hover state and increase hover progress while the pointer is inside", () => {
            hoverable.contains = vi.fn().mockReturnValue(true);
            hoverable.getTransitionTime = vi.fn().mockReturnValue(200);

            uiInteractionSystem.update(hoverable as HoverableEntity, vi.fn(), 50);

            expect(hoverable.contains).toHaveBeenCalledWith(mouseInputManager.mousePosition);
            expect(hoverable.hovered).toBe(true);
            expect(hoverable.hoverProgress).toBe(0.25);
        });

        it("should decrease hover progress while the pointer is outside", () => {
            hoverable.contains = vi.fn().mockReturnValue(false);
            hoverable.getTransitionTime = vi.fn().mockReturnValue(200);
            hoverable.hoverProgress = 0.5;

            uiInteractionSystem.update(hoverable as HoverableEntity, vi.fn(), 50);

            expect(hoverable.hovered).toBe(false);
            expect(hoverable.hoverProgress).toBe(0.25);
        });

        it.each([
            [true, 0.9, 1],
            [false, 0.1, 0],
        ])(
            "should clamp hover progress when hovered is %s",
            (isHovered, initialProgress, expectedProgress) => {
                hoverable.contains = vi.fn().mockReturnValue(isHovered);
                hoverable.getTransitionTime = vi.fn().mockReturnValue(100);
                hoverable.hoverProgress = initialProgress;

                uiInteractionSystem.update(hoverable as HoverableEntity, vi.fn(), 100);

                expect(hoverable.hoverProgress).toBe(expectedProgress);
            },
        );

        it("should invoke the callback and reset input when a hovered entity is clicked", () => {
            const onClick = vi.fn();
            hoverable.contains = vi.fn().mockReturnValue(true);
            hoverable.getTransitionTime = vi.fn().mockReturnValue(100);
            mouseInputManager.isMousePressed = true;

            uiInteractionSystem.update(hoverable as HoverableEntity, onClick, 16);

            expect(onClick).toHaveBeenCalledOnce();
            expect(mouseInputManager.reset).toHaveBeenCalledOnce();
        });

        it("should not invoke the callback or reset input when the click is outside the entity", () => {
            const onClick = vi.fn();
            hoverable.contains = vi.fn().mockReturnValue(false);
            hoverable.getTransitionTime = vi.fn().mockReturnValue(100);
            mouseInputManager.isMousePressed = true;

            uiInteractionSystem.update(hoverable as HoverableEntity, onClick, 16);

            expect(onClick).not.toHaveBeenCalled();
            expect(mouseInputManager.reset).not.toHaveBeenCalled();
        });
    });
});

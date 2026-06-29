import { HoverableEntity } from "../game/entities/HoverableEntity";
import { MouseInputManager } from "../input/MouseInputManager";

export class UIInteractionSystem {
    public constructor(public input: MouseInputManager) {}

    public update(hoverable: HoverableEntity, onClick: () => void, deltaMs: number): void {
        hoverable.hovered = hoverable.contains(this.input.mousePosition);
        if (hoverable.hovered && this.input.isMousePressed) {
            onClick();
            this.input.reset();
        }

        const step = (deltaMs / hoverable.getTransitionTime()) * (hoverable.hovered ? 1 : -1);
        hoverable.hoverProgress = Math.max(0, Math.min(1, hoverable.hoverProgress + step));
    }
}

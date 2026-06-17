import { HoverableEntity } from "../game/entities/HoverableEntity";
import { MouseInputManager } from "../input/MouseInputManager";

export class UIInteractionSystem {
    public constructor(private input: MouseInputManager) {}

    public update(hoverable: HoverableEntity, onClick: () => void): void {
        hoverable.hovered = hoverable.contains(this.input.mousePosition);
        if (hoverable.hovered && this.input.isMousePressed) {
            onClick();
            this.input.reset();
        }
    }
}

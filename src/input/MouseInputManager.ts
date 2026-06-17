import { Point } from "../utils/Point";

export class MouseInputManager {
    private element: HTMLElement;
    public mousePosition: Point = new Point(0, 0);
    public isMousePressed: boolean = false;

    public constructor(element: HTMLElement) {
        this.element = element;
        element.addEventListener("mousemove", this.onMouseMove);
        element.addEventListener("click", this.onClick);
    }

    private onMouseMove = (event: MouseEvent): void => {
        const rect = this.element.getBoundingClientRect();
        this.mousePosition = new Point(event.clientX - rect.left, event.clientY - rect.top);
    }

    private onClick = (): void => {
        this.isMousePressed = true;
    }

    public reset(): void {
        this.isMousePressed = false;
    }
}

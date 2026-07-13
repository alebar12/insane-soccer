import { Keys, KeysDirection, KeysUtilities } from "../game/enums/Keys";

export class KeyboardInputManager {
    private pressedKeys: Set<Keys> = new Set();

    public constructor() {
        if (typeof window !== "undefined") {
            document.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("keyup", this.onKeyUp);
        }
    }

    public dispose(): void {
        if (typeof window !== "undefined") {
            document.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("keyup", this.onKeyUp);
        }
    }

    public isKeyPressed(key: Keys): boolean {
        return this.pressedKeys.has(key);
    }

    public getDirectionPressed(direction: KeysDirection): Keys | null {
        for (const key of this.pressedKeys) {
            if (KeysUtilities.getKeyDirection(key) === direction) {
                return key;
            }
        }
        return null;
    }

    private onKeyDown = (event: KeyboardEvent): void => {
        this.pressedKeys.add(event.key as Keys);
    };

    private onKeyUp = (event: KeyboardEvent): void => {
        this.pressedKeys.delete(event.key as Keys);
    };
}

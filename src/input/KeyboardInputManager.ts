import { Keys, KeysDirection, KeysUtilities } from "@/game/enums/Keys";

export class KeyboardInputManager {
    private pressedKeys: Set<Keys> = new Set();

    public constructor() {
        if (typeof document !== "undefined") {
            document.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("keyup", this.onKeyUp);
            document.addEventListener("visibilitychange", this.onVisibilityChange);
            window.addEventListener("blur", this.clearPressedKeys);
        }
    }

    public dispose(): void {
        if (typeof document !== "undefined") {
            document.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("keyup", this.onKeyUp);
            document.removeEventListener("visibilitychange", this.onVisibilityChange);
            window.removeEventListener("blur", this.clearPressedKeys);
            this.clearPressedKeys();
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

    public setPressedKeys(keys: Set<Keys>): void {
        this.pressedKeys.clear();
        keys.forEach(key => this.pressedKeys.add(key));
    }

    private onKeyDown = (event: KeyboardEvent): void => {
        if (this.isGameKey(event.key)) {
            event.preventDefault();
            this.pressedKeys.add(event.key);
        }
    };

    private onKeyUp = (event: KeyboardEvent): void => {
        if (this.isGameKey(event.key)) {
            event.preventDefault();
            this.pressedKeys.delete(event.key);
        }
    };

    private onVisibilityChange = (): void => {
        if (document.visibilityState === "hidden") {
            this.clearPressedKeys();
        }
    };

    private clearPressedKeys = (): void => {
        this.pressedKeys.clear();
    };

    private isGameKey(key: string): key is Keys {
        return Object.values(Keys).includes(key as Keys);
    }
}

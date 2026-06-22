export enum Keys {
    ARROW_DOWN = "ArrowDown",
    ARROW_UP = "ArrowUp",
    ARROW_LEFT = "ArrowLeft",
    ARROW_RIGHT = "ArrowRight",
    SPACE = " ",
}

export enum KeysDirection {
    HORIZONTAL = "HORIZONTAL",
    VERTICAL = "VERTICAL",
}

export class KeysUtilities {
    public static getKeyDirection(key: Keys): KeysDirection | null {
        if (key === Keys.ARROW_LEFT || key === Keys.ARROW_RIGHT) {
            return KeysDirection.HORIZONTAL;
        }
        if (key === Keys.ARROW_UP || key === Keys.ARROW_DOWN) {
            return KeysDirection.VERTICAL;
        }
        return null;
    }
}

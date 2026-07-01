export enum PlayerSide {
    LEFT = "LEFT",
    RIGHT = "RIGHT",
}

export class PlayerSideUtilities {
    public static getOppositeSide(side: PlayerSide): PlayerSide {
        return side === PlayerSide.LEFT ? PlayerSide.RIGHT : PlayerSide.LEFT;
    }
}

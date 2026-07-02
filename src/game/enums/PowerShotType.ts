export enum PowerShotType {
    FIRE = "FIRE",
    ELECTRIC = "ELECTRIC",
}

export class PowerShotUtilities {
    public static getPowerShotType(colorIndex: number): PowerShotType {
        switch (colorIndex) {
            case 0:
                return PowerShotType.FIRE;
            case 1:
                return PowerShotType.ELECTRIC;
            default:
                return PowerShotType.FIRE;
        }
    }
}

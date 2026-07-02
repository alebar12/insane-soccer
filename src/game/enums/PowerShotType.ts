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

    public static getSpeedFactor(powerShotType: PowerShotType | null): number {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return 2;
            case PowerShotType.ELECTRIC:
                return 1.2;
            default:
                return 1;
        }
    }

    public static shouldStopOnPlayerBounce(powerShotType: PowerShotType): boolean {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return false;
            case PowerShotType.ELECTRIC:
                return true;
            default:
                return true;
        }
    }

    public static shouldMoveToGoal(powerShotType: PowerShotType): boolean {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return false;
            case PowerShotType.ELECTRIC:
                return true;
            default:
                return false;
        }
    }
}

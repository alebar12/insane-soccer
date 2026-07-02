import { PlayerSide, PlayerSideUtilities } from "../../enums/PlayerSide";
import { PowerShotType, PowerShotUtilities } from "../../enums/PowerShotType";
import { Player } from "../Player";

export class BallPowerShot {
    private powerShot: boolean = false;
    private powerShotType: PowerShotType | null = null;
    private powerShotDestionationSide: PlayerSide | null = null;

    public get isPowerShot(): boolean {
        return this.powerShot;
    }

    public getPowerShotType(): PowerShotType | null {
        return this.powerShotType;
    }

    public enablePowerShot(player: Player): void {
        this.powerShot = true;
        this.powerShotType = PowerShotUtilities.getPowerShotType(player.colorIndex);
        this.powerShotDestionationSide = PlayerSideUtilities.getOppositeSide(player.side);
    }

    public resetPowerShot(): void {
        this.powerShot = false;
        this.powerShotType = null;
        this.powerShotDestionationSide = null;
    }

    public shouldStopOnPlayerBounce(): boolean {
        if (!this.powerShot || this.powerShotType === null) {
            return true;
        }
        return PowerShotUtilities.shouldStopOnPlayerBounce(this.powerShotType);
    }

    public shouldMoveToGoal(): boolean {
        if (!this.powerShot || this.powerShotType === null) {
            return false;
        }
        return PowerShotUtilities.shouldMoveToGoal(this.powerShotType);
    }

    public getPowerShotDestinationSide(): PlayerSide | null {
        return this.powerShotDestionationSide;
    }
}

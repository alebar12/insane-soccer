import { GameConfigs } from "../../../utils/GameConfigs";
import { Player } from "../Player";
import { ElectricPowerShot } from "./ElectricPowerShot";
import { FirePowerShot } from "./FirePowerShot";
import { PowerShotInterface } from "./PowerShotInterface";

export class PowerShotWrapper {
    private powerShots: Array<PowerShotInterface> = [];

    constructor(gameConfigs: GameConfigs) {
        this.powerShots.push(new FirePowerShot(gameConfigs));
        this.powerShots.push(new ElectricPowerShot(gameConfigs));
    }

    public update(deltaMs: number, player: Player): void {
        this.powerShots.forEach(powerShot => {
            powerShot.update(deltaMs, player);
        });
    }

    public get powerShotEntities(): Array<PowerShotInterface> {
        return this.powerShots;
    }
}

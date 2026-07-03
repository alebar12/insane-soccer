import { GameConfigs } from "../../../utils/GameConfigs";
import { PlayerSide } from "../../enums/PlayerSide";
import { Player } from "../Player";
import { ElectricPowerShot } from "./ElectricPowerShot";
import { FirePowerShot } from "./FirePowerShot";
import { PowerShotInterface } from "./PowerShotInterface";

export class PowerShotWrapper {
    private powerShot: boolean = false;
    private consecutiveGoals: number = 0;
    private readonly consecutiveGoalsToPowerShot: number = 2;
    private readonly side: PlayerSide;
    private powerShots: Array<PowerShotInterface> = [];

    constructor(gameConfigs: GameConfigs, side: PlayerSide) {
        this.powerShots.push(new ElectricPowerShot(gameConfigs));
        this.powerShots.push(new FirePowerShot(gameConfigs));
        this.side = side;
    }

    public update(deltaMs: number, player: Player): void {
        this.powerShots.forEach(powerShot => {
            powerShot.update(deltaMs, player);
        });
    }

    public get powerShotEntities(): Array<PowerShotInterface> {
        return this.powerShots;
    }

    public updateScoredGoal(playerSide: PlayerSide): void {
        if (playerSide === this.side) {
            this.consecutiveGoals++;
            if (this.consecutiveGoals === this.consecutiveGoalsToPowerShot) {
                this.powerShot = true;
                this.consecutiveGoals = 0;
            }
        } else {
            this.consecutiveGoals = 0;
        }
    }

    public getPowerShot(): boolean {
        return this.powerShot;
    }

    public resetPowerShot(): void {
        if (this.powerShot) {
            this.powerShot = false;
            this.consecutiveGoals = 0;
        }
    }
}

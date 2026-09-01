import { Player } from "@/game/entities/Player";
import { PowerShotInterface } from "@/game/entities/powerShots/PowerShotInterface";
import { PlayerSide } from "@/game/enums/PlayerSide";

export class PowerShotWrapper {
    private powerShot: boolean = false;
    private consecutiveGoals: number = 0;
    private readonly consecutiveGoalsToPowerShot: number = 2;
    private readonly side: PlayerSide;
    private powerShots: Array<PowerShotInterface> = [];

    constructor(side: PlayerSide, powerShotEntities: Array<PowerShotInterface>) {
        this.powerShots = powerShotEntities;
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

import { GameConfigs } from "../../../utils/GameConfigs";
import { PlayerStatus } from "../../enums/PlayerStatus";
import { Player } from "../Player";
import { PowerShotInterface } from "./PowerShotInterface";

export class ElectricPowerShot implements PowerShotInterface {
    public readonly width: number;
    public readonly height: number;
    public readonly lineWidth: number;
    public readonly bigLineWidth: number;
    public readonly interval: number = 50;
    private lastChangeDeltaTime: number = this.interval;
    private angleOffset: number = 0;

    public constructor(gameConfigs: GameConfigs) {
        this.width = Math.round(Math.floor(gameConfigs.playerSizeWithoutBorder * 2.5));
        this.height = Math.round(this.width / 5);
        this.lineWidth = Math.ceil(this.height / 7);
        this.bigLineWidth = Math.round(this.lineWidth * 3);
    }

    public update(deltaMs: number): void {
        this.lastChangeDeltaTime += deltaMs;
        if (this.lastChangeDeltaTime >= this.interval) {
            this.lastChangeDeltaTime = 0;
            this.angleOffset += Math.PI / 45 * this.interval * 0.05;
        }
    }

    public shouldRender(player: Player): boolean {
        return (
            player.colorIndex === 1 &&
            player.getPowerShot() &&
            player.playerStatus === PlayerStatus.NORMAL
        );
    }
}

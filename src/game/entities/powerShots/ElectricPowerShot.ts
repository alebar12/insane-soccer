import { GameConfigs } from "../../../utils/GameConfigs";
import { PlayerStatus } from "../../enums/PlayerStatus";
import { Point } from "../../geometry/Point";
import { Player } from "../Player";
import { PowerShotInterface } from "./PowerShotInterface";

export class ElectricPowerShot implements PowerShotInterface {
    public readonly width: number;
    public readonly height: number;
    public readonly lineWidth: number;
    public readonly bigLineWidth: number;
    public readonly interval: number = 50;
    public readonly lightningBoltSize: number = 10;
    private lastChangeDeltaTime: number = this.interval;
    public angleOffset: number = 0;
    public lightningBoltPointArray: Array<Point> = [];
    public whiteLineVisible: boolean = false;

    public constructor(gameConfigs: GameConfigs) {
        this.width = Math.round(Math.floor(gameConfigs.playerSizeWithoutBorder * 2.5));
        this.height = Math.round(this.width / 5);
        this.lineWidth = Math.ceil(this.height / 4);
        this.bigLineWidth = Math.round(this.lineWidth * 3);
    }

    public update(deltaMs: number): void {
        this.lastChangeDeltaTime += deltaMs;
        this.whiteLineVisible = true;
        if (this.lastChangeDeltaTime >= this.interval) {
            this.lastChangeDeltaTime = 0;
            this.regenerateLightningBoltPoints();
            this.angleOffset += (Math.PI / 45) * this.interval * 0.05;
            this.whiteLineVisible = false;
        }
    }

    public shouldRender(player: Player): boolean {
        return (
            player.colorIndex === 1 &&
            player.powerShotWrapper.getPowerShot() &&
            player.playerStatus === PlayerStatus.NORMAL
        );
    }

    private regenerateLightningBoltPoints(): void {
        this.lightningBoltPointArray = [];
        for (let i = 0; i < this.lightningBoltSize; i++) {
            this.lightningBoltPointArray.push(
                new Point(
                    (this.width / this.lightningBoltSize) * i - this.width / 2,
                    Math.round(Math.random() * this.height) - this.height / 2,
                ),
            );
        }
    }
}

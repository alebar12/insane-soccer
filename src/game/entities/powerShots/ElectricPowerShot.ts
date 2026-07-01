import { PlayerStatus } from "../../enums/PlayerStatus";
import { Player } from "../Player";
import { PowerShotInterface } from "./PowerShotInterface";

export class ElectricPowerShot implements PowerShotInterface {
    public update(_deltaMs: number): void {}

    public shouldRender(player: Player): boolean {
        return (
            player.colorIndex === 1 &&
            player.getPowerShot() &&
            player.playerStatus === PlayerStatus.NORMAL
        );
    }
}

import { PlayerSide } from "@/game/enums/PlayerSide";
import { GameConfigs } from "@/utils/GameConfigs";
import { PowerShotWrapper } from "./PowerShotWrapper";
import { ElectricPowerShot } from "./ElectricPowerShot";
import { FirePowerShot } from "./FirePowerShot";

export class PowerShotWrapperFactory {
    public static createPowerShotWrapper(
        gameConfigs: GameConfigs,
        side: PlayerSide,
    ): PowerShotWrapper {
        const powerShotEntities = [
            new ElectricPowerShot(gameConfigs),
            new FirePowerShot(gameConfigs),
        ];
        return new PowerShotWrapper(side, powerShotEntities);
    }
}

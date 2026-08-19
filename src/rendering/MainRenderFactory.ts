import { AssetLoader } from "@/assets/AssetLoader";
import { DomHandler } from "@/ui/DomHandler";
import { GameConfigs } from "@/utils/GameConfigs";
import { MainRender } from "./MainRender";
import { BallRender } from "./impl/BallRender";
import { BallTrajectoryRender } from "./impl/BallTrajectoryRender";
import { ExplosionRender } from "./impl/ExplosionRender";
import { FieldRender } from "./impl/FieldRender";
import { FireworksRender } from "./impl/FireworksRender";
import { GatesRender } from "./impl/GatesRender";
import { MenuRender } from "./impl/MenuRender";
import { PlayerPowerShotRender } from "./impl/PlayerPowerShotRender";
import { PlayerRender } from "./impl/PlayerRender";
import { ScoreRender } from "./impl/ScoreRender";

export class MainRenderFactory {
    public static create(
        gameConfigs: GameConfigs,
        domHandler: DomHandler,
        assetLoader: AssetLoader,
    ): MainRender {
        return new MainRender(domHandler, [
            new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader),
            new BallTrajectoryRender(domHandler.gameContext, gameConfigs),
            new ScoreRender(domHandler.scoreContext, assetLoader),
            new GatesRender(domHandler.gameContext, gameConfigs),
            new PlayerRender(domHandler.gameContext, gameConfigs, assetLoader),
            new BallRender(domHandler.gameContext, gameConfigs),
            new ExplosionRender(domHandler.gameContext),
            new MenuRender(domHandler.menuContext, assetLoader),
            new PlayerPowerShotRender(domHandler.gameContext, assetLoader, gameConfigs),
            new FireworksRender(domHandler.gameContext),
        ]);
    }
}

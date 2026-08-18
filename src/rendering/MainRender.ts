import { AssetLoader } from "@/assets/AssetLoader";
import { GameWorld } from "@/game/world/GameWorld";
import { BallRender } from "@/rendering/impl/BallRender";
import { BallTrajectoryRender } from "@/rendering/impl/BallTrajectoryRender";
import { ExplosionRender } from "@/rendering/impl/ExplosionRender";
import { FieldRender } from "@/rendering/impl/FieldRender";
import { FireworksRender } from "@/rendering/impl/FireworksRender";
import { GatesRender } from "@/rendering/impl/GatesRender";
import { MenuRender } from "@/rendering/impl/MenuRender";
import { PlayerPowerShotRender } from "@/rendering/impl/PlayerPowerShotRender";
import { PlayerRender } from "@/rendering/impl/PlayerRender";
import { ScoreRender } from "@/rendering/impl/ScoreRender";
import { RenderInterface } from "@/rendering/RenderInterface";
import { DomHandler } from "@/ui/DomHandler";
import { GameConfigs } from "@/utils/GameConfigs";

export class MainRender {
    private domHandler: DomHandler;
    private renders = new Array<RenderInterface>();

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.domHandler = domHandler;

        this.renders.push(new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader));
        this.renders.push(new BallTrajectoryRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new ScoreRender(domHandler.scoreContext, assetLoader));
        this.renders.push(new GatesRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new PlayerRender(domHandler.gameContext, gameConfigs, assetLoader));
        this.renders.push(new BallRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new ExplosionRender(domHandler.gameContext));
        this.renders.push(new MenuRender(domHandler.menuContext, assetLoader));
        this.renders.push(
            new PlayerPowerShotRender(domHandler.gameContext, assetLoader, gameConfigs),
        );
        this.renders.push(new FireworksRender(domHandler.gameContext));
    }

    public render(gameWorld: GameWorld): void {
        this.clear();
        this.renders.forEach(render => render.render(gameWorld));
    }

    private clear(): void {
        this.domHandler.gameContext.clearRect(
            0,
            0,
            this.domHandler.gameCanvas.width,
            this.domHandler.gameCanvas.height,
        );
    }
}

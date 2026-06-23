import { AssetLoader } from "../assets/AssetLoader";
import { GameWorld } from "../game/world/GameWorld";
import { DomHandler } from "../ui/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";
import { BallRender } from "./BallRender";
import { FieldRender } from "./FieldRender";
import { GatesRender } from "./GatesRender";
import { MenuRender } from "./MenuRender";
import { PlayerRender } from "./PlayerRender";
import { ScoreRender } from "./ScoreRender";

export class MainRender {
    private domHandler: DomHandler;
    private fieldRender: FieldRender;
    private scoreRender: ScoreRender;
    private gatesRender: GatesRender;
    private playerRender: PlayerRender;
    private menuRender: MenuRender;
    private ballRender: BallRender;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.domHandler = domHandler;
        this.fieldRender = new FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader);
        this.scoreRender = new ScoreRender(domHandler.scoreContext, assetLoader);
        this.gatesRender = new GatesRender(domHandler.gameContext, gameConfigs);
        this.playerRender = new PlayerRender(domHandler.gameContext, gameConfigs);
        this.menuRender = new MenuRender(domHandler.menuContext, assetLoader);
        this.ballRender = new BallRender(domHandler.gameContext, gameConfigs);
    }

    public render(gameWorld: GameWorld): void {
        this.clear();
        this.fieldRender.render(gameWorld);
        this.scoreRender.render(gameWorld);
        this.ballRender.render(gameWorld);
        this.playerRender.render(gameWorld);
        this.gatesRender.render();
        this.menuRender.render(gameWorld);
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

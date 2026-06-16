import { AssetLoader } from "../assets/AssetLoader";
import { GameStatus } from "../game/status/GameStatus";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";
import { Point } from "../utils/Point";

export class MenuRender {
    private readonly menuContext: CanvasRenderingContext2D;
    private readonly playImage: HTMLImageElement;
    private readonly buttonPosition: Point;
    private readonly buttonHeight: number;
    private readonly buttonWidth: number;

    public constructor(
        menuContext: CanvasRenderingContext2D,
        assetLoader: AssetLoader,
        gameConfigs: GameConfigs,
    ) {
        this.menuContext = menuContext;
        this.playImage = assetLoader.getImage("play.png");
        this.buttonHeight = gameConfigs.fieldHeight / 5;
        this.buttonWidth = this.buttonHeight * (this.playImage.width / this.playImage.height);
        this.buttonPosition = new Point(
            gameConfigs.fieldXOffset + (gameConfigs.fieldWidth - this.buttonWidth) / 2,
            (gameConfigs.fieldHeight - this.buttonHeight) / 2,
        );
    }

    public render(gameWorld: GameWorld): void {
        this.menuContext.clearRect(
            0,
            0,
            this.menuContext.canvas.width,
            this.menuContext.canvas.height,
        );

        if (gameWorld.gameStatus === GameStatus.MENU) {
            this.menuContext.drawImage(
                this.playImage,
                this.buttonPosition.x,
                this.buttonPosition.y,
                this.buttonWidth,
                this.buttonHeight,
            );
        }
    }
}

import { AssetLoader } from "../assets/AssetLoader";
import { GameStatus } from "../game/status/GameStatus";
import { GameWorld } from "../game/world/GameWorld";

export class MenuRender {
    private readonly menuContext: CanvasRenderingContext2D;
    private readonly playImage: HTMLImageElement;

    public constructor(menuContext: CanvasRenderingContext2D, assetLoader: AssetLoader) {
        this.menuContext = menuContext;
        this.playImage = assetLoader.getImage("play.png");
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
                gameWorld.menuButton.position.x,
                gameWorld.menuButton.position.y,
                gameWorld.menuButton.dimension.width,
                gameWorld.menuButton.dimension.height,
            );
        }
    }
}

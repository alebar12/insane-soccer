import { AssetLoader } from "../assets/AssetLoader";
import { GameStatus } from "../game/enums/GameStatus";
import { GameWorld } from "../game/world/GameWorld";

export class MenuRender {
    private readonly menuContext: CanvasRenderingContext2D;
    private readonly playImage: HTMLImageElement;
    private readonly hoverFactor: number = 1.3;

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

        if (gameWorld.gameStatusManager.gameStatus === GameStatus.MENU) {
            const scale = 1 + (this.hoverFactor - 1) * gameWorld.menuButton.hoverProgress;
            const width = gameWorld.menuButton.dimension.width * scale;
            const height = gameWorld.menuButton.dimension.height * scale;
            this.menuContext.drawImage(
                this.playImage,
                gameWorld.menuButton.position.x -
                    (width - gameWorld.menuButton.dimension.width) / 2,
                gameWorld.menuButton.position.y -
                    (height - gameWorld.menuButton.dimension.height) / 2,
                width,
                height,
            );
        }
    }
}

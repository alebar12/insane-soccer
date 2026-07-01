import { AssetLoader } from "../../assets/AssetLoader";
import { ElectricPowerShot } from "../../game/entities/powerShots/ElectricPowerShot";
import { FirePowerShot } from "../../game/entities/powerShots/FirePowerShot";
import { GameWorld } from "../../game/world/GameWorld";
import { RenderInterface } from "../RenderInterface";

export class PlayerPowerShotRender implements RenderInterface {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly flameImage: HTMLImageElement;
    private readonly cellsPerRow: number = 4;
    private readonly cellsPerColumn: number = 4;
    private readonly cellWidth: number;
    private readonly cellHeight: number;

    public constructor(gameContext: CanvasRenderingContext2D, assetLoader: AssetLoader) {
        this.gameContext = gameContext;
        this.flameImage = assetLoader.getImage("RedParticle.png");
        this.cellWidth = this.flameImage.width / this.cellsPerRow;
        this.cellHeight = this.flameImage.height / this.cellsPerColumn;
    }

    public render(gameWorld: GameWorld): void {
        gameWorld.players.forEach(player => {
            const powerShotEntities = player.powerShotWrapper.powerShotEntities;
            powerShotEntities.forEach(powerShotEntity => {
                if (powerShotEntity.shouldRender(player)) {
                    if (powerShotEntity instanceof FirePowerShot) {
                        this.renderFirePowerShot(powerShotEntity);
                    } else if (powerShotEntity instanceof ElectricPowerShot) {
                        this.renderElectricPowerShot(powerShotEntity);
                    }
                }
            });
        });
    }

    private renderFirePowerShot(firePowerShot: FirePowerShot): void {
        firePowerShot.flames.forEach(flame => {
            const size =
                flame.getDurationFactor() * (firePowerShot.maxSize - firePowerShot.minSize) +
                firePowerShot.minSize;
            const alpha = 1 - flame.getDurationFactor();
            const rowIndex = Math.floor(flame.index / this.cellsPerRow);
            const columnIndex = flame.index % this.cellsPerRow;

            this.gameContext.save();
            this.gameContext.globalAlpha = alpha;
            this.gameContext.drawImage(
                this.flameImage,
                this.cellWidth * rowIndex,
                this.cellHeight * columnIndex,
                this.cellWidth,
                this.cellHeight,
                Math.round(flame.position.x - size / 2),
                Math.round(flame.position.y - size / 2),
                Math.round(size),
                Math.round(size),
            );
            this.gameContext.restore();
        });
    }

    private renderElectricPowerShot(_electricPowerShot: ElectricPowerShot): void {}
}

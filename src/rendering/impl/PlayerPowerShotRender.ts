import { AssetLoader } from "../../assets/AssetLoader";
import { Player } from "../../game/entities/Player";
import { ElectricPowerShot } from "../../game/entities/powerShots/ElectricPowerShot";
import { FirePowerShot } from "../../game/entities/powerShots/FirePowerShot";
import { GameWorld } from "../../game/world/GameWorld";
import { GameConfigs } from "../../utils/GameConfigs";
import { RenderInterface } from "../RenderInterface";

export class PlayerPowerShotRender implements RenderInterface {
    private readonly gameConfigs: GameConfigs;
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly flameImage: HTMLImageElement;
    private readonly cellsPerRow: number = 4;
    private readonly cellsPerColumn: number = 4;
    private readonly lightningBoltNumber: number = 3;
    private readonly cellWidth: number;
    private readonly cellHeight: number;

    public constructor(
        gameContext: CanvasRenderingContext2D,
        assetLoader: AssetLoader,
        gameConfigs: GameConfigs,
    ) {
        this.gameConfigs = gameConfigs;
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
                        this.renderElectricPowerShot(player, powerShotEntity);
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

    private renderElectricPowerShot(player: Player, electricPowerShot: ElectricPowerShot): void {
        const position = player.movementPosition.position;
        this.gameContext.save();
        const gradient = this.gameContext.createRadialGradient(
            position.x,
            position.y,
            this.gameConfigs.playerSizeWithBorder / 5,
            position.x,
            position.y,
            this.gameConfigs.playerSizeWithBorder,
        );
        gradient.addColorStop(0, "#FFFFFF");
        gradient.addColorStop(1, "transparent");
        this.gameContext.beginPath();
        this.gameContext.arc(
            position.x,
            position.y,
            this.gameConfigs.playerSizeWithBorder,
            0,
            2 * Math.PI,
            false,
        );
        this.gameContext.closePath();
        this.gameContext.fillStyle = gradient;
        this.gameContext.fill();

        this.gameContext.restore();

        this.gameContext.save();
        this.gameContext.translate(position.x, position.y);
        this.gameContext.rotate(electricPowerShot.angleOffset);

        for (let i = 0; i < this.lightningBoltNumber; i++) {
            this.gameContext.rotate(Math.PI / this.lightningBoltNumber);
            this.gameContext.globalAlpha = 0.5; 
            for (let j = 0; j < electricPowerShot.lightningBoltSize - 1; j++) {
                const point = electricPowerShot.lightningBoltPointArray[j];
                const nextPoint = electricPowerShot.lightningBoltPointArray[j + 1];
                this.gameContext.beginPath();
				this.gameContext.fillStyle = '#000000';
				this.gameContext.strokeStyle = "#000000";
				this.gameContext.lineWidth = electricPowerShot.bigLineWidth;
				this.gameContext.moveTo(point.x, point.y);
				this.gameContext.lineTo(nextPoint.x, nextPoint.y);
				this.gameContext.stroke();
				this.gameContext.closePath();

                if (electricPowerShot.whiteLineVisible) {
                    this.gameContext.globalAlpha = 1;
                    this.gameContext.beginPath();
                    this.gameContext.fillStyle = '#FFFFFF';
                    this.gameContext.strokeStyle = "#FFFFFF";
                    this.gameContext.lineWidth = electricPowerShot.lineWidth;
                    this.gameContext.moveTo(point.x, point.y);
                    this.gameContext.lineTo(nextPoint.x, nextPoint.y);
                    this.gameContext.stroke();
                    this.gameContext.closePath();
                }
            }
        }

        this.gameContext.restore();
    }
}

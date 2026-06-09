import { AssetLoader } from "../assets/AssetLoader";
import { GameConfigs } from "../utils/GameConfigs";

export class FieldRender {
    private readonly fieldImage: HTMLImageElement;
    private readonly goalImage: HTMLImageElement;
    private readonly trackFieldImage: HTMLImageElement;
    private readonly backgroundContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private readonly borderSize: number;

    public constructor(
        backgroundContext: CanvasRenderingContext2D,
        gameConfigs: GameConfigs,
        assetLoader: AssetLoader,
    ) {
        this.fieldImage = assetLoader.getImage("field.png");
        this.goalImage = assetLoader.getImage("goal_field.png");
        this.trackFieldImage = assetLoader.getImage("track.jpg");

        this.backgroundContext = backgroundContext;
        this.gameConfigs = gameConfigs;
        this.borderSize = Math.round(gameConfigs.fieldHeight / 100);
    }

    public render(): void {
        this.backgroundContext.clearRect(
            0,
            0,
            this.backgroundContext.canvas.width,
            this.backgroundContext.canvas.height,
        );

        this.backgroundContext.save();

        this.renderBackground();

        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowBlur = this.gameConfigs.shadowBlur;

        this.renderBorder();
        this.renderGoalPosts();
        this.renderWindows();

        this.backgroundContext.restore();

        this.renderAthleticTrack();
    }

    private renderBackground(): void {
        this.backgroundContext.fillStyle = "#BBBBFF";
        this.backgroundContext.drawImage(
            this.fieldImage,
            this.gameConfigs.fieldXOffset,
            0,
            this.gameConfigs.fieldWidth,
            this.gameConfigs.fieldHeight,
        );

        this.backgroundContext.drawImage(
            this.goalImage,
            0,
            this.gameConfigs.goalYOffset,
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.goalHeight,
        );

        this.backgroundContext.drawImage(
            this.goalImage,
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset,
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.goalHeight,
        );
    }

    private renderBorder(): void {
        this.backgroundContext.fillStyle = "#FFFFFF";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";

        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset - this.borderSize,
            0,
            this.gameConfigs.fieldWidth + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset - this.borderSize,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.fieldXOffset -
                this.gameConfigs.playerSizeWithBorder +
                this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.playerSubstitutionX + this.gameConfigs.playerSizeWithBorder,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.cpuSubstitutionX -
                this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.playerSizeWithBorder * 2,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.cpuSubstitutionX + this.gameConfigs.playerSizeWithBorder,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.fieldXOffset -
                this.gameConfigs.playerSizeWithBorder,
            this.borderSize,
        );

        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset - this.borderSize,
            -this.borderSize,
            this.borderSize,
            this.gameConfigs.goalYOffset + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset - this.borderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.borderSize,
            this.gameConfigs.goalYOffset + this.borderSize,
        );
        this.backgroundContext.fillRect(
            -this.borderSize,
            this.gameConfigs.goalYOffset - this.borderSize,
            this.gameConfigs.fieldXOffset + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            -this.borderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldXOffset + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            0,
            this.gameConfigs.goalYOffset - this.borderSize,
            this.borderSize,
            this.gameConfigs.goalHeight + this.borderSize * 2,
        );

        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            -this.borderSize,
            this.borderSize,
            this.gameConfigs.goalYOffset + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.borderSize,
            this.gameConfigs.goalYOffset + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset - this.borderSize,
            this.gameConfigs.fieldXOffset,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldXOffset,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.fieldXOffset * 2 + this.gameConfigs.fieldWidth - this.borderSize,
            this.gameConfigs.goalYOffset - this.borderSize,
            this.borderSize,
            this.gameConfigs.goalHeight + this.borderSize * 2,
        );
    }

    private renderGoalPosts(): void {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.goalYOffset,
            this.gameConfigs.goalPostRadius,
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.goalPostRadius,
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset,
            this.gameConfigs.goalPostRadius,
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.goalPostRadius,
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
    }

    private renderAthleticTrack(): void {
        this.backgroundContext.drawImage(
            this.trackFieldImage,
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.fieldHeight + this.gameConfigs.athleticTrackYOffset,
            this.gameConfigs.fieldWidth,
            this.gameConfigs.athleticTrackHeight,
        );
    }

    private renderWindows(): void {
        this.backgroundContext.fillStyle = "#FF0000";
        this.backgroundContext.lineWidth = 1;

        this.backgroundContext.translate(
            this.gameConfigs.playerSubstitutionX - this.gameConfigs.playerSizeWithBorder,
            this.gameConfigs.fieldHeight,
        );
        const angle = 0; // TODO da rivedere
        this.backgroundContext.rotate(angle);
        this.backgroundContext.fillRect(
            0,
            0,
            this.gameConfigs.playerSizeWithBorder * 2,
            this.borderSize,
        );
        this.backgroundContext.strokeRect(
            0,
            0,
            this.gameConfigs.playerSizeWithBorder * 2,
            this.borderSize,
        );
        this.backgroundContext.rotate(angle);

        this.backgroundContext.translate(
            this.gameConfigs.cpuSubstitutionX -
                this.gameConfigs.playerSubstitutionX +
                this.gameConfigs.playerSizeWithBorder * 2,
            -this.borderSize,
        );
        this.backgroundContext.rotate(Math.PI - angle);
        this.backgroundContext.fillRect(
            0,
            -this.borderSize * 2,
            this.gameConfigs.playerSizeWithBorder * 2,
            this.borderSize,
        );
        this.backgroundContext.strokeRect(
            0,
            -this.borderSize * 2,
            this.gameConfigs.playerSizeWithBorder * 2,
            this.borderSize,
        );
    }
}

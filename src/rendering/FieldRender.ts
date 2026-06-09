import { AssetLoader } from "../assets/AssetLoader";
import { GameConfigs } from "../utils/GameConfigs";

export class FieldRender {
    private readonly fieldImage: HTMLImageElement;
    private readonly goalImage: HTMLImageElement;
    private readonly trackFieldImage: HTMLImageElement;
    private readonly backgroundContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private readonly borderSize: number;

    public constructor(backgroundContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.fieldImage = AssetLoader.getInstance().getImage("field.png");
        this.goalImage = AssetLoader.getInstance().getImage("goal_field.png");
        this.trackFieldImage = AssetLoader.getInstance().getImage("track.jpg");

        this.backgroundContext = backgroundContext;
        this.gameConfigs = gameConfigs;
        this.borderSize = Math.round(gameConfigs.getFieldHeight() / 100);
    }

    public render(): void {
        this.backgroundContext.clearRect(
            0,
            0,
            this.backgroundContext.canvas.width,
            this.backgroundContext.canvas.height,
        );

        this.backgroundContext.save();

        this.backgroundContext.fillRect(
            this.gameConfigs.width / 2,
            this.gameConfigs.width / 2,
            this.gameConfigs.width * 2,
            this.gameConfigs.width * 2,
        );

        this.renderBackground();

        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.getShadowBlur() * 0.3;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.getShadowBlur() * 0.3;
        this.backgroundContext.shadowBlur = this.gameConfigs.getShadowBlur();

        this.renderBorder();
        this.renderGoalPosts();

        this.backgroundContext.restore();

        this.renderAthleticTrack();
    }

    private renderBackground(): void {
        this.backgroundContext.fillStyle = "#BBBBFF";
        this.backgroundContext.drawImage(
            this.fieldImage,
            this.gameConfigs.getFieldXOffset(),
            0,
            this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getFieldHeight(),
        );

        this.backgroundContext.drawImage(
            this.goalImage,
            0,
            this.gameConfigs.getGoalYOffset(),
            this.gameConfigs.getFieldXOffset(),
            this.gameConfigs.getGoalHeight(),
        );

        this.backgroundContext.drawImage(
            this.goalImage,
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset(),
            this.gameConfigs.getFieldXOffset(),
            this.gameConfigs.getGoalHeight(),
        );
    }

    private renderBorder(): void {
        this.backgroundContext.fillStyle = "#FFFFFF";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";

        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() - this.borderSize,
            0,
            this.gameConfigs.getFieldWidth() + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() - this.borderSize,
            this.gameConfigs.getFieldHeight(),
            // TODO da rivedere
            this.gameConfigs.getSubstitutionOffsetX() -
                this.gameConfigs.getFieldXOffset() +
                this.borderSize,
            this.borderSize,
        );
        //this.backgroundContext.fillRect(rounded(playerVar.sub_x + playerVar.player_size*1.5), commonVariables.height, cpuVar.sub_x - playerVar.sub_x - playerVar.player_size*3, this.borderSize);
        //this.backgroundContext.fillRect(cpuVar.sub_x + playerVar.player_size*1.5, commonVariables.height, rounded(playerVar.sub_x - this.gameConfigs.getFieldXOffset() - playerVar.player_size*1.5), this.borderSize);

        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() - this.borderSize,
            -this.borderSize,
            this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() - this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.borderSize,
        );
        this.backgroundContext.fillRect(
            -this.borderSize,
            this.gameConfigs.getGoalYOffset() - this.borderSize,
            this.gameConfigs.getFieldXOffset() + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            -this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.gameConfigs.getFieldXOffset() + this.borderSize,
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            0,
            this.gameConfigs.getGoalYOffset() - this.borderSize,
            this.borderSize,
            this.gameConfigs.getGoalHeight() + this.borderSize * 2,
        );

        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            -this.borderSize,
            this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.borderSize,
            this.gameConfigs.getGoalYOffset() + this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset() - this.borderSize,
            this.gameConfigs.getFieldXOffset(),
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.gameConfigs.getFieldXOffset(),
            this.borderSize,
        );
        this.backgroundContext.fillRect(
            this.gameConfigs.getFieldXOffset() * 2 +
                this.gameConfigs.getFieldWidth() -
                this.borderSize,
            this.gameConfigs.getGoalYOffset() - this.borderSize,
            this.borderSize,
            this.gameConfigs.getGoalHeight() + this.borderSize * 2,
        );
    }

    private renderGoalPosts(): void {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.getFieldXOffset(),
            this.gameConfigs.getGoalYOffset(),
            this.gameConfigs.getGoalPostRadius(),
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.getFieldXOffset(),
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.gameConfigs.getGoalPostRadius(),
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset(),
            this.gameConfigs.getGoalPostRadius(),
            0,
            2 * Math.PI,
            false,
        );
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();

        this.backgroundContext.beginPath();
        this.backgroundContext.arc(
            this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(),
            this.gameConfigs.getGoalPostRadius(),
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
            this.gameConfigs.getFieldXOffset(),
            this.gameConfigs.getFieldHeight() + this.gameConfigs.getAthleticTrackYOffset(),
            this.gameConfigs.getFieldWidth(),
            this.gameConfigs.getAthleticTrackHeight(),
        );
    }
}

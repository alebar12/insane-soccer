import { AssetLoader } from "../assets/AssetLoader";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";

export class FieldRender {
    private readonly fieldImage: HTMLImageElement;
    private readonly goalImage: HTMLImageElement;
    private readonly trackFieldImage: HTMLImageElement;
    private readonly backgroundContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private alreadyRendered: boolean = false;

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
    }

    public render(gameWorld: GameWorld): void {
        if (this.alreadyRendered) {
            return;
        }

        this.backgroundContext.clearRect(
            0,
            0,
            this.backgroundContext.canvas.width,
            this.backgroundContext.canvas.height,
        );

        this.backgroundContext.save();

        this.renderBackground();
        this.renderAthleticTrack();

        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowBlur = this.gameConfigs.shadowBlur;

        this.renderBorder();
        this.renderGoalPosts(gameWorld);

        this.backgroundContext.restore();
        this.alreadyRendered = true;
    }

    private renderBackground(): void {
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

        this.backgroundContext.beginPath();

        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize,
            0,
            this.gameConfigs.fieldWidth + this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.fieldXOffset -
                this.gameConfigs.gatesLenght / 2 +
                this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.playerSubstitutionX + this.gameConfigs.gatesLenght / 2,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.cpuSubstitutionX -
                this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.gatesLenght,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.cpuSubstitutionX + this.gameConfigs.gatesLenght / 2,
            this.gameConfigs.fieldHeight,
            this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.fieldXOffset -
                this.gameConfigs.gatesLenght / 2,
            this.gameConfigs.fieldBorderSize,
        );

        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize,
            -this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            -this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            -this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            0,
            this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalHeight + this.gameConfigs.fieldBorderSize * 2,
        );

        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            -this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth,
            this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight,
            this.gameConfigs.fieldXOffset,
            this.gameConfigs.fieldBorderSize,
        );
        this.backgroundContext.rect(
            this.gameConfigs.fieldXOffset * 2 +
                this.gameConfigs.fieldWidth -
                this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize,
            this.gameConfigs.fieldBorderSize,
            this.gameConfigs.goalHeight + this.gameConfigs.fieldBorderSize * 2,
        );

        this.backgroundContext.fill();
    }

    private renderGoalPosts(gameWorld: GameWorld): void {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";

        gameWorld.goalPosts.positions.forEach(position => {
            this.backgroundContext.beginPath();
            this.backgroundContext.arc(
                position.x,
                position.y,
                gameWorld.goalPosts.radius,
                0,
                2 * Math.PI,
                false,
            );
            this.backgroundContext.closePath();
            this.backgroundContext.fill();
            this.backgroundContext.stroke();
        });
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
}

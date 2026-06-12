export class GameConfigs {
    public readonly width: number;
    public readonly height: number;
    public readonly fieldHeight: number;
    public readonly fieldXOffset: number;
    public readonly fieldWidth: number;
    public readonly goalHeight: number;
    public readonly goalYOffset: number;
    public readonly shadowBlur: number;
    public readonly shadowOffset: number;
    public readonly substitutionOffsetX: number;
    public readonly goalPostRadius: number;
    public readonly athleticTrackHeight: number;
    public readonly athleticTrackYOffset: number;
    public readonly playerSizeWithoutBorder: number;
    public readonly playerBorder: number = 2;
    public readonly playerSizeWithBorder: number;
    public readonly playerSubstitutionX: number;
    public readonly cpuSubstitutionX: number;
    public readonly fieldBorderSize: number;

    public constructor(canvasWidth: number, canvasHeight: number) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        this.fieldHeight = Math.round((this.height * 4.5) / 6);
        this.fieldXOffset = Math.round(this.width / 16);
        this.fieldWidth = Math.round(this.width - this.fieldXOffset * 2);

        this.goalHeight = Math.round(this.fieldHeight / 5);
        this.goalYOffset = Math.round((this.fieldHeight - this.goalHeight) / 2);

        this.substitutionOffsetX = Math.round(this.fieldWidth / 3);

        this.goalPostRadius = Math.round(this.goalHeight / 20);

        this.athleticTrackHeight = Math.round(((this.height - this.fieldHeight) * 5) / 7);
        this.athleticTrackYOffset = Math.round(
            (this.height - this.fieldHeight - this.athleticTrackHeight) / 2,
        );

        this.playerSizeWithoutBorder = Math.floor(this.fieldHeight / 16);
        this.playerSizeWithBorder = this.playerSizeWithoutBorder + this.playerBorder;
        const substitutionOffsetX = Math.round(this.fieldWidth / 4);
        this.playerSubstitutionX = this.fieldXOffset + substitutionOffsetX;
        this.cpuSubstitutionX = this.fieldXOffset + (this.fieldWidth - substitutionOffsetX);

        this.shadowBlur = this.playerSizeWithoutBorder;
        this.shadowOffset = this.playerSizeWithoutBorder * 0.3;

        this.fieldBorderSize = Math.round(this.fieldHeight / 100);
    }
}

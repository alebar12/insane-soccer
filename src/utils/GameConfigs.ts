export class GameConfigs {
    public readonly width: number;
    public readonly height: number;
    public readonly fieldHeight: number;
    public readonly fieldXOffset: number;
    public readonly fieldWidth: number;
    public readonly goalHeight: number;
    public readonly goalYOffset: number;
    public readonly shadowBlur: number;
    public readonly substitutionOffsetX: number;
    public readonly goalPostRadius: number;
    public readonly athleticTrackHeight: number;
    public readonly athleticTrackYOffset: number;

    public constructor(canvasWidth: number, canvasHeight: number) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        this.fieldHeight = Math.round((this.height * 4.5) / 6);
        this.fieldXOffset = Math.round(this.width / 16);
        this.fieldWidth = Math.round(this.width - this.fieldXOffset * 2);

        this.goalHeight = Math.round(this.fieldHeight / 5);
        this.goalYOffset = Math.round((this.fieldHeight - this.goalHeight) / 2);

        this.shadowBlur = 10; // TODO DA RIVEDERE

        this.substitutionOffsetX = Math.round(this.fieldWidth / 3);

        this.goalPostRadius = Math.round(this.goalHeight / 20);

        this.athleticTrackHeight = Math.round(((this.height - this.fieldHeight) * 5) / 7);
        this.athleticTrackYOffset = Math.round(
            (this.height - this.fieldHeight - this.athleticTrackHeight) / 2,
        );
    }
}

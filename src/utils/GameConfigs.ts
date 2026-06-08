export class GameConfigs {
    public readonly width : number;
    public readonly height : number;

    public constructor(canvasWitdh : number, canvasHeight: number) {
        this.width = canvasWitdh;
        this.height = canvasHeight;
    }

    public getFieldHeight() : number {
        return Math.round(this.height * 4.5 / 6);
    }

    public getFieldXOffset() : number {
        return Math.round(this.width / 16);
    }

    public getFieldWidth() : number {
        return Math.round(this.width - (this.getFieldXOffset() * 2));
    }

    public getGoalHeight() : number {
        return Math.round(this.getFieldHeight() / 5);
    }

    public getShadowBlur() : number {
        // TODO da rivedere
        return 10;
    }

    public getSubstitutionOffsetX() : number {
        return Math.round(this.getFieldWidth() / 3);
    }

    public getGoalYOffset() : number {
        return Math.round(this.getFieldHeight() - this.getGoalHeight()) / 2;
    }

    public getGoalPostRadius() : number {
        return Math.round(this.getGoalHeight() / 20);
    }

    public getAthleticTrackHeight() : number {
        return Math.round((this.height - this.getFieldHeight()) * 5 / 7);
    }

    public getAthleticTrackYOffset() : number {
        return Math.round((this.height - this.getFieldHeight() - this.getAthleticTrackHeight()) / 2);
    }
}
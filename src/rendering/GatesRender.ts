import { GameConfigs } from "../utils/GameConfigs";

export class GatesRender {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }

    public render(): void {
        this.gameContext.save();

        this.gameContext.fillStyle = "#FF0000";
        this.gameContext.lineWidth = 1;

        this.gameContext.translate(
            this.gameConfigs.playerSubstitutionX - this.gameConfigs.gatesLenght / 2,
            this.gameConfigs.fieldHeight,
        );
        const angle = 0; // TODO da rivedere
        this.gameContext.rotate(angle);
        this.gameContext.fillRect(
            0,
            0,
            this.gameConfigs.gatesLenght,
            this.gameConfigs.fieldBorderSize,
        );
        this.gameContext.strokeRect(
            0,
            0,
            this.gameConfigs.gatesLenght,
            this.gameConfigs.fieldBorderSize,
        );
        this.gameContext.rotate(angle);

        this.gameContext.translate(
            this.gameConfigs.cpuSubstitutionX -
                this.gameConfigs.playerSubstitutionX +
                this.gameConfigs.gatesLenght,
            -this.gameConfigs.fieldBorderSize,
        );
        this.gameContext.rotate(Math.PI - angle);
        this.gameContext.fillRect(
            0,
            -this.gameConfigs.fieldBorderSize * 2,
            this.gameConfigs.gatesLenght,
            this.gameConfigs.fieldBorderSize,
        );
        this.gameContext.strokeRect(
            0,
            -this.gameConfigs.fieldBorderSize * 2,
            this.gameConfigs.gatesLenght,
            this.gameConfigs.fieldBorderSize,
        );

        this.gameContext.restore();
    }
}

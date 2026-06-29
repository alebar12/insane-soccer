import { GameWorld } from "../../game/world/GameWorld";
import { GameConfigs } from "../../utils/GameConfigs";
import { RenderInterface } from "../RenderInterface";

export class GatesRender implements RenderInterface {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }

    public render(gameWorld: GameWorld): void {
        const angle = gameWorld.gates.currentAngle;
        this.renderSingleGate(
            angle,
            this.gameConfigs.playerSubstitutionX -
                this.gameConfigs.gatesLength / 2 +
                this.gameConfigs.fieldBorderSize / 2,
        );
        this.renderSingleGate(
            Math.PI - angle,
            this.gameConfigs.cpuSubstitutionX +
                this.gameConfigs.gatesLength / 2 -
                this.gameConfigs.fieldBorderSize / 2,
        );
    }

    private renderSingleGate(angle: number, x: number): void {
        this.gameContext.save();
        this.gameContext.fillStyle = "#FF0000";
        this.gameContext.lineWidth = 1;

        this.gameContext.translate(
            x,
            this.gameConfigs.fieldHeight + this.gameConfigs.fieldBorderSize / 2,
        );
        this.gameContext.rotate(angle);
        this.gameContext.rect(
            -this.gameConfigs.fieldBorderSize / 2,
            -this.gameConfigs.fieldBorderSize / 2,
            this.gameConfigs.gatesLength,
            this.gameConfigs.fieldBorderSize,
        );
        this.gameContext.fill();
        this.gameContext.stroke();
        this.gameContext.restore();
    }
}

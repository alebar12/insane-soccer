import { GameConfigs } from "../../utils/GameConfigs";
import { MovementPoint } from "../../utils/MovementPoint";
import { Point } from "../../utils/Point";

export class Ball {
    public readonly maxSpeed: number;

    public movementPosition: MovementPoint = new MovementPoint(
        new Point(0, 0),
        new Point(0, 0),
        0,
        0,
    );
    private isSetForStart: boolean = false;
    private gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.movementPosition.acceleration = gameConfigs.fieldHeight / 800000;
        this.movementPosition.size = gameConfigs.ballSizeWithBorder;
        this.maxSpeed = gameConfigs.fieldHeight / 400;
    }

    public setForStartGame(): void {
        if (!this.isSetForStart) {
            this.movementPosition.position = new Point(
                this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2,
                this.gameConfigs.fieldBorderSize + this.movementPosition.size,
            );

            const speed =
                Math.random() * (this.maxSpeed - this.maxSpeed / 3.33) + this.maxSpeed / 3.33;
            const angle = Math.PI / 2 + ((Math.random() * Math.PI) / 4.5 - Math.PI / 9);
            this.movementPosition.setSpeed(speed, angle);
            this.isSetForStart = true;
        }
    }

    public move(deltaMs: number): void {
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);
    }
}

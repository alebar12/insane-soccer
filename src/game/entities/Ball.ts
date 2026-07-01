import { GameConfigs } from "../../utils/GameConfigs";
import { BallStatus } from "../enums/BallStatus";
import { MovementPoint } from "../geometry/MovementPoint";
import { Point } from "../geometry/Point";
import { Player } from "./Player";

export class Ball {
    public readonly maxSpeed: number;
    private readonly gameConfigs: GameConfigs;
    public ballStatus: BallStatus = BallStatus.FREE;
    public attachedPlayer: Player | null = null;
    public angleWithPlayer: number = 0;
    public movementPosition: MovementPoint = new MovementPoint(
        new Point(0, 0),
        new Point(0, 0),
        0,
        0,
    );
    private isSetForStart: boolean = false;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.movementPosition.size = gameConfigs.ballSizeWithBorder;
        this.maxSpeed = gameConfigs.fieldHeight / 400;
        this.movementPosition.acceleration = this.maxSpeed / 2000;
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

    public resetToStartGame(): void {
        this.isSetForStart = false;
        this.movementPosition.setSpeed(0, 0);
        this.ballStatus = BallStatus.FREE;
        this.attachedPlayer = null;
    }

    public move(deltaMs: number): void {
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);
    }

    public attachToPlayer(player: Player): void {
        this.attachedPlayer = player;
        this.ballStatus = BallStatus.ATTACHED;
        this.angleWithPlayer = Point.getAngleBetweenPoints(
            player.movementPosition.position,
            this.movementPosition.position,
        );
    }

    public detachFromPlayer(): void {
        this.ballStatus = BallStatus.FREE;
        this.attachedPlayer?.resetPowerShot();
        this.attachedPlayer = null;
        this.movementPosition.setSpeed(this.maxSpeed, this.angleWithPlayer);
    }

    public resetOnGoal(): void {
        this.ballStatus = BallStatus.FREE;
        this.attachedPlayer = null;
    }
}

import { GameConfigs } from "../../utils/GameConfigs";
import { BallStatus } from "../enums/BallStatus";
import { PowerShotType, PowerShotUtilities } from "../enums/PowerShotType";
import { MovementPoint } from "../geometry/MovementPoint";
import { Point } from "../geometry/Point";
import { PositionHistory } from "../geometry/PositionHistory";
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
    public positionHistory: PositionHistory = new PositionHistory(5000);
    private powerShot: boolean = false;
    private powerShotType: PowerShotType | null = null;

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
        if (this.powerShot) {
            this.positionHistory.addPosition(
                new Point(this.movementPosition.position.x, this.movementPosition.position.y),
            );
        }
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);

        if (this.shouldCancelOnLowSpeed() && this.movementPosition.getSpeed() < this.maxSpeed / 2) {
            this.resetPowerShot();
        }
    }

    public updateTrajectory(deltaMs: number): void {
        this.positionHistory.update(deltaMs);
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
        let speedFactor = 1;
        if (this.attachedPlayer?.getPowerShot()) {
            this.powerShot = true;
            this.powerShotType = PowerShotUtilities.getPowerShotType(
                this.attachedPlayer.colorIndex,
            );
            speedFactor = PowerShotUtilities.getSpeedFactor(this.powerShotType);
        }
        this.attachedPlayer?.resetPowerShot();
        this.attachedPlayer = null;
        this.movementPosition.setSpeed(this.maxSpeed * speedFactor, this.angleWithPlayer);
    }

    public resetOnGoal(): void {
        this.ballStatus = BallStatus.FREE;
        this.attachedPlayer = null;
        this.resetPowerShot();
    }

    public get isPowerShot(): boolean {
        return this.powerShot;
    }

    public shouldStopOnPlayerBounce(): boolean {
        if (!this.powerShot || this.powerShotType === null) {
            return true;
        }
        return PowerShotUtilities.shouldStopOnPlayerBounce(this.powerShotType);
    }

    private shouldCancelOnLowSpeed(): boolean {
        if (!this.powerShot || this.powerShotType === null) {
            return true;
        }
        return PowerShotUtilities.shouldCancelOnLowSpeed(this.powerShotType);
    }

    private resetPowerShot(): void {
        this.powerShot = false;
        this.powerShotType = null;
    }
}

import { GameConfigs } from "../../utils/GameConfigs";
import { PlayerSide } from "../enums/PlayerSide";
import { PlayerStatus } from "../enums/PlayerStatus";
import { MovementPoint } from "../geometry/MovementPoint";
import { Point } from "../geometry/Point";
import { StunnedStars } from "./StunnedStars";

export class Player {
    public readonly isCpu: boolean;
    public readonly isSubstitute: boolean;
    public readonly side: PlayerSide;
    public readonly normalMaxSpeed: number;
    public readonly maxSpeedWithBall: number;
    public readonly reachedDistanceTolerance: number;
    public readonly closeToPointDistance: number;

    private bouncingStartTime: number = 0;
    private readonly bounceTime: number = 2000;
    private readonly bounceMaxAmplitude: number = 0.5;
    private readonly bounceExponentialFactor: number = 0.00346;
    private readonly bounceNumber: number = 5;

    public movementPosition: MovementPoint = new MovementPoint(
        new Point(0, 0),
        new Point(0, 0),
        0,
        0,
    );
    public initialPosition: Point = new Point(0, 0);
    public destinationPosition: MovementPoint = new MovementPoint(
        new Point(0, 0),
        new Point(0, 0),
        0,
        0,
    );
    public currentMaxSpeed: number = 0;
    public colorIndex: number;

    public playerStatus: PlayerStatus = PlayerStatus.NORMAL;
    private stunnedValue: number = 0;
    private stunnedStartTime: number = 0;
    public stunnedStars: StunnedStars = new StunnedStars();
    private readonly stunnedMaxValue: number = 2000;
    private readonly stunnedStep: number = 1000;
    private readonly stunnedTime: number = 3000;

    private constructor(
        gameConfigs: GameConfigs,
        isCpu: boolean,
        isSubstitute: boolean,
        side: PlayerSide,
        colorIndex: number,
    ) {
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = this.normalMaxSpeed / 1.332;
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = this.normalMaxSpeed / 300;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;
        this.movementPosition.size = gameConfigs.playerSizeWithBorder;

        this.isCpu = isCpu;
        this.isSubstitute = isSubstitute;
        this.side = side;
        this.colorIndex = colorIndex;
        this.initPositions(gameConfigs);
    }

    public static createHumanPlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, false, PlayerSide.LEFT, 0);
    }

    public static createCpuPlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, true, false, PlayerSide.RIGHT, 0);
    }

    public static createLeftSubstitutePlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, true, PlayerSide.LEFT, 1);
    }

    public static createRightSubstitutePlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, true, PlayerSide.RIGHT, 1);
    }

    public reachedDestinationPosition(): boolean {
        return (
            Point.getDistance(this.movementPosition.position, this.destinationPosition.position) <
            this.reachedDistanceTolerance
        );
    }

    public move(deltaMs: number): void {
        this.movementPosition.updatePosition(deltaMs);
    }

    public adjustSpeedToDestinationPoint(deltaMs: number): void {
        const projectedPosition = this.movementPosition.projectToFinalPosition();

        const angle = Point.getAngleBetweenPoints(
            this.movementPosition.position,
            this.destinationPosition.position,
        );

        if (
            Point.getDistance(projectedPosition, this.destinationPosition.position) <
            this.reachedDistanceTolerance
        ) {
            const currentSpeed = this.movementPosition.getSpeed();
            if (currentSpeed > 0) {
                const newSpeed = Math.max(
                    currentSpeed - this.movementPosition.acceleration * deltaMs,
                    0,
                );
                const ratio = newSpeed / currentSpeed;
                this.movementPosition.velocity.x *= ratio;
                this.movementPosition.velocity.y *= ratio;
            }
        } else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;

            let steerX = desiredSpeedX - this.movementPosition.velocity.x;
            let steerY = desiredSpeedY - this.movementPosition.velocity.y;

            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.movementPosition.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }

            this.movementPosition.velocity.x += steerX;
            this.movementPosition.velocity.y += steerY;
        }

        if (this.reachedDestinationPosition()) {
            this.movementPosition.velocity = new Point(0, 0);
            this.movementPosition.position = new Point(
                this.destinationPosition.position.x,
                this.destinationPosition.position.y,
            );
        }

        this.movementPosition.adjustToMaxSpeed(this.currentMaxSpeed);
    }

    public resetToStartGame(): void {
        this.currentMaxSpeed = this.normalMaxSpeed;
        this.destinationPosition = new MovementPoint(
            new Point(this.initialPosition.x, this.initialPosition.y),
            new Point(0, 0),
            0,
            0,
        );
    }

    public startBouncing(): void {
        if (this.getBouncingProgress() > this.bounceTime / 2 && this.playerStatus === PlayerStatus.NORMAL) {
            this.bouncingStartTime = Date.now();
        }
    }

    public getBouncingAmplitude(): number {
        if (!this.isBouncing()) {
            return 0;
        }

        return (
            this.bounceMaxAmplitude *
            Math.pow(Math.E, -this.getBouncingProgress() * this.bounceExponentialFactor) *
            Math.sin(this.getBouncingProgress() / (2 * Math.PI * this.bounceNumber))
        );
    }

    public updateStunnedValue(otherPlayerSpeed: number): void {
        if (this.playerStatus !== PlayerStatus.STUNNED) {
            const speed = this.movementPosition.getSpeed();
            if (speed > otherPlayerSpeed) {
                this.stunnedValue = Math.max(0, this.stunnedValue - this.stunnedStep);
            } else if (speed < otherPlayerSpeed) {
                this.stunnedValue += this.stunnedStep;
            }

            if (this.stunnedValue > this.stunnedMaxValue) {
                this.playerStatus = PlayerStatus.STUNNED;
                this.stunnedStartTime = Date.now();
            }
        }
    }

    public decrementStunnedValue(deltaMs: number): void {
        if (this.playerStatus === PlayerStatus.NORMAL) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        } else if (this.playerStatus === PlayerStatus.STUNNED) {
            this.stunnedStars.update(deltaMs, this.movementPosition.position);
            if (Date.now() - this.stunnedStartTime > this.stunnedTime) {
                this.playerStatus = PlayerStatus.NORMAL;
                this.stunnedValue = 0;
                this.stunnedStars.stars = [];
            }
        }
    }

    public resetOnGoal() : void {
        this.bouncingStartTime = 0;
        this.stunnedValue = 0;
        this.stunnedStars.stars = [];
    }

    private getBouncingProgress(): number {
        return Date.now() - this.bouncingStartTime;
    }

    private isBouncing(): boolean {
        return this.getBouncingProgress() <= this.bounceTime;
    }

    private initPositions(gameConfigs: GameConfigs): void {
        let offsetX = 0;
        if (this.isSubstitute) {
            this.initialPosition.y = gameConfigs.substituteStartPositionYOffset;
            offsetX =
                this.side === PlayerSide.LEFT
                    ? gameConfigs.substitutionOffsetX
                    : gameConfigs.fieldWidth - gameConfigs.substitutionOffsetX;
        } else {
            this.initialPosition.y = gameConfigs.playerStartPositionYOffset;
            offsetX =
                this.side === PlayerSide.LEFT
                    ? gameConfigs.playerStartPositionXOffset
                    : gameConfigs.fieldWidth - gameConfigs.playerStartPositionXOffset;
        }

        this.initialPosition.x = gameConfigs.fieldXOffset + offsetX;

        this.movementPosition.position = new Point(this.initialPosition.x, this.initialPosition.y);
        this.destinationPosition.position = new Point(
            this.initialPosition.x,
            this.initialPosition.y,
        );
    }
}

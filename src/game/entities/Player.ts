import { GameConfigs } from "../../utils/GameConfigs";
import { PlayerSide } from "../enums/PlayerSide";
import { PlayerStatus } from "../enums/PlayerStatus";
import { MovementPoint } from "../geometry/MovementPoint";
import { Point } from "../geometry/Point";
import { BounceWrapper } from "./bounce/BounceWrapper";
import { PowerShotWrapper } from "./powerShots/PowerShotWrapper";
import { StunnedWrapper } from "./stunned/StunnedWrapper";

export class Player {
    public readonly isCpu: boolean;
    public readonly isSubstitute: boolean;
    public readonly side: PlayerSide;
    public readonly normalMaxSpeed: number;
    public readonly reachedDistanceTolerance: number;
    public readonly closeToPointDistance: number;
    public readonly bounceWrapper: BounceWrapper = new BounceWrapper();

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
    public stunnedWrapper: StunnedWrapper = new StunnedWrapper(this);
    public readonly powerShotWrapper: PowerShotWrapper;

    private constructor(
        gameConfigs: GameConfigs,
        isCpu: boolean,
        isSubstitute: boolean,
        side: PlayerSide,
        colorIndex: number,
    ) {
        this.normalMaxSpeed = gameConfigs.fieldHeight / 700;
        if (isCpu) {
            this.normalMaxSpeed = this.normalMaxSpeed * 0.8;
        }
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = this.normalMaxSpeed / 300;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;
        this.movementPosition.size = gameConfigs.playerSizeWithBorder;

        this.isCpu = isCpu;
        this.isSubstitute = isSubstitute;
        this.side = side;
        this.colorIndex = colorIndex;
        this.initPositions(gameConfigs);

        this.powerShotWrapper = new PowerShotWrapper(gameConfigs, side);
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
        const targetPosition = this.destinationPosition.projectToFinalPosition();

        const angle = Point.getAngleBetweenPoints(this.movementPosition.position, targetPosition);

        if (Point.getDistance(projectedPosition, targetPosition) < this.reachedDistanceTolerance) {
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

    public switchColorIndex(): void {
        this.colorIndex = this.colorIndex === 0 ? 1 : 0;
    }

    public updatePowerShot(deltaMs: number): void {
        this.powerShotWrapper.update(deltaMs, this);
    }

    public resetOnGoal(): void {
        this.bounceWrapper.reset();
        this.stunnedWrapper.reset();
        this.playerStatus = PlayerStatus.NORMAL;
        this.resetToStartGame();
    }

    public startBouncing(): void {
        if (this.playerStatus === PlayerStatus.NORMAL) {
            this.bounceWrapper.startBouncing();
        }
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

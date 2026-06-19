import { GameConfigs } from "../../utils/GameConfigs";
import { MovementPoint } from "../../utils/MovementPoint";
import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";

export class Player {
    public readonly isCpu: boolean;
    public readonly isSubstitute: boolean;
    public readonly side: PlayerSide;
    public readonly normalMaxSpeed: number;
    public readonly maxSpeedWithBall: number;
    public readonly reachedDistanceTolerance: number;
    public readonly closeToPointDistance: number;

    public movementPosition: MovementPoint = new MovementPoint(new Point(0, 0), new Point(0, 0), 0);
    public initialPosition: Point = new Point(0, 0);
    public destinationPosition: MovementPoint = new MovementPoint(
        new Point(0, 0),
        new Point(0, 0),
        0,
    );
    public currentMaxSpeed: number = 0;

    public isStunned: boolean = false;
    public colorIndex: number = 0;

    public radius: number;

    private constructor(
        gameConfigs: GameConfigs,
        isCpu: boolean,
        isSubstitute: boolean,
        side: PlayerSide,
        colorIndex: number,
    ) {
        this.radius = gameConfigs.playerSizeWithBorder;
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = gameConfigs.fieldHeight / 666;
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = gameConfigs.fieldHeight / 150000;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;

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
        this.movementPosition.position.x += this.movementPosition.speed.x * deltaMs;
        this.movementPosition.position.y += this.movementPosition.speed.y * deltaMs;
    }

    public adjustSpeedToDestinationPoint(deltaMs: number): void {
        const projectedPosition = new Point(
            this.calculateDestinationPosition(
                this.movementPosition.position.x,
                this.movementPosition.speed.x,
            ),
            this.calculateDestinationPosition(
                this.movementPosition.position.y,
                this.movementPosition.speed.y,
            ),
        );

        const angle = Math.atan2(
            this.destinationPosition.position.y - this.movementPosition.position.y,
            this.destinationPosition.position.x - this.movementPosition.position.x,
        );

        if (
            Point.getDistance(projectedPosition, this.destinationPosition.position) <
            this.reachedDistanceTolerance
        ) {
            const currentSpeed = this.getSpeed();
            if (currentSpeed > 0) {
                const newSpeed = Math.max(
                    currentSpeed - this.movementPosition.acceleration * deltaMs,
                    0,
                );
                const ratio = newSpeed / currentSpeed;
                this.movementPosition.speed.x *= ratio;
                this.movementPosition.speed.y *= ratio;
            }
        } else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;

            let steerX = desiredSpeedX - this.movementPosition.speed.x;
            let steerY = desiredSpeedY - this.movementPosition.speed.y;

            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.movementPosition.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }

            this.movementPosition.speed.x += steerX;
            this.movementPosition.speed.y += steerY;
        }

        if (this.reachedDestinationPosition()) {
            this.movementPosition.speed = new Point(0, 0);
            this.movementPosition.position = new Point(
                this.destinationPosition.position.x,
                this.destinationPosition.position.y,
            );
        }

        this.adjustSpeedToMaxSpeed();
    }

    public resetToStartGame(): void {
        this.currentMaxSpeed = this.normalMaxSpeed;
        this.destinationPosition = new MovementPoint(
            new Point(this.initialPosition.x, this.initialPosition.y),
            new Point(0, 0),
            0,
        );
    }

    private calculateDestinationPosition(position: number, speed: number): number {
        while (Math.abs(speed) > 0) {
            position += speed;
            speed =
                Math.sign(speed) *
                Math.max(Math.abs(speed) - this.movementPosition.acceleration, 0);
            if (Math.abs(speed) <= this.movementPosition.acceleration) {
                speed = 0;
            }
        }
        return position;
    }

    private adjustSpeedToMaxSpeed(): void {
        const speed = Math.min(this.getSpeed(), this.currentMaxSpeed);
        const angle = Math.atan2(this.movementPosition.speed.y, this.movementPosition.speed.x);
        this.movementPosition.speed.x = Math.cos(angle) * speed;
        this.movementPosition.speed.y = Math.sin(angle) * speed;
    }

    private getSpeed(): number {
        return Math.sqrt(
            Math.pow(this.movementPosition.speed.x, 2) + Math.pow(this.movementPosition.speed.y, 2),
        );
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

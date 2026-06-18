import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";

export class Player {
    public readonly isCpu: boolean;
    public readonly isSubstitute: boolean;
    public readonly side: PlayerSide;
    public readonly normalMaxSpeed: number;
    public readonly maxSpeedWithBall: number;
    public readonly reachedDistanceTollerance: number;
    public readonly acceleration: number;
    public readonly closeToPointDistance: number;

    public position: Point = new Point(0, 0);
    public speed: Point = new Point(0, 0);
    public initialPosition: Point = new Point(0, 0);
    public destinationPosition: Point = new Point(0, 0);
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
        this.reachedDistanceTollerance = gameConfigs.fieldWidth / 80;
        this.acceleration = gameConfigs.fieldHeight / 150000;
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
            Point.getDistance(this.position, this.destinationPosition) <
            this.reachedDistanceTollerance
        );
    }

    public move(deltaMs: number): void {
        this.position.x += this.speed.x * deltaMs;
        this.position.y += this.speed.y * deltaMs;
    }

    public adjustSpeedToDestinationPoint(deltaMs: number): void {
        const projectedPosition = new Point(
            this.calculateDestinationPosition(this.position.x, this.speed.x),
            this.calculateDestinationPosition(this.position.y, this.speed.y),
        );

        const angle = Math.atan2(
            this.destinationPosition.y - this.position.y,
            this.destinationPosition.x - this.position.x,
        );

        if (
            Point.getDistance(projectedPosition, this.destinationPosition) <
            this.reachedDistanceTollerance
        ) {
            const currentSpeed = this.getSpeed();
            if (this.getSpeed() > 0) {
                const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
                const ratio = newSpeed / currentSpeed;
                this.speed.x *= ratio;
                this.speed.y *= ratio;
            }
        } else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;

            let steerX = desiredSpeedX - this.speed.x;
            let steerY = desiredSpeedY - this.speed.y;

            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }

            this.speed.x += steerX;
            this.speed.y += steerY;
        }

        if (this.reachedDestinationPosition()) {
            this.speed = new Point(0, 0);
        }

        this.adjustSpeedToMaxSpeed();
    }

    private calculateDestinationPosition(position: number, speed: number): number {
        while (Math.abs(speed) > 0) {
            position += speed;
            speed = Math.sign(speed) * Math.max(Math.abs(speed) - this.acceleration, 0);
            if (Math.abs(speed) <= this.acceleration) {
                speed = 0;
            }
        }
        return position;
    }

    private adjustSpeedToMaxSpeed(): void {
        let speed = Math.min(this.getSpeed(), this.currentMaxSpeed);
        var angle = Math.atan2(this.speed.y, this.speed.x);
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }

    private getSpeed(): number {
        return Math.sqrt(Math.pow(this.speed.x, 2) + Math.pow(this.speed.y, 2));
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

        this.position = new Point(this.initialPosition.x, this.initialPosition.y);
        this.destinationPosition = new Point(this.initialPosition.x, this.initialPosition.y);
    }
}

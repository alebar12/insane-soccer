import { PlayerSide } from "../game/enums/PlayerSide";
import { PlayerStatus } from "../game/enums/PlayerStatus";
import { Point } from "../game/geometry/Point";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";

export class LearningWrapper {
    private readonly gameConfigs: GameConfigs;
    private readonly gameWorld: GameWorld;

    public constructor(gameWorld: GameWorld, gameConfigs: GameConfigs) {
        this.gameWorld = gameWorld;
        this.gameConfigs = gameConfigs;
    }

    public extractStatus(): Status {
        const player1 = this.gameWorld.players[0];
        const player2 = this.gameWorld.players[1];
        const ball = this.gameWorld.ball;

        return new Status(
            this.normalizeXCoordinate(player1.movementPosition.position.x, player1.side),
            this.normalizeYCoordinate(player1.movementPosition.position.y),
            this.normalizeSpeed(player1.movementPosition.velocity.x, player1.normalMaxSpeed),
            this.normalizeSpeed(player1.movementPosition.velocity.y, player1.normalMaxSpeed),
            player1.powerShotWrapper.getPowerShot() ? 1 : 0,
            player1.playerStatus === PlayerStatus.STUNNED ? 1 : 0,

            this.normalizeXCoordinate(player2.movementPosition.position.x, player2.side),
            this.normalizeYCoordinate(player2.movementPosition.position.y),
            this.normalizeSpeed(player2.movementPosition.velocity.x, player2.normalMaxSpeed),
            this.normalizeSpeed(player2.movementPosition.velocity.y, player2.normalMaxSpeed),
            player2.powerShotWrapper.getPowerShot() ? 1 : 0,
            player2.playerStatus === PlayerStatus.STUNNED ? 1 : 0,

            this.normalizeXCoordinate(ball.movementPosition.position.x, PlayerSide.LEFT),
            this.normalizeYCoordinate(ball.movementPosition.position.y),
            this.normalizeSpeed(ball.movementPosition.velocity.x, ball.maxSpeed * 2),
            this.normalizeSpeed(ball.movementPosition.velocity.y, ball.maxSpeed * 2),
            ball.attachedPlayer === null ? 0 : ball.attachedPlayer === player1 ? 1 : 2,
            ball.ballPowerShot.isPowerShot ? 1 : 0,

            player1.colorIndex,

            this.gameWorld.score.leftScore,
            this.gameWorld.score.rightScore,
        );
    }

    public calculateReward(previousStatus: Status, currentStatus: Status): number {
        const previousBallDistance = Point.getDistance(
            new Point(previousStatus.player1X, previousStatus.player1Y),
            new Point(previousStatus.ballX, previousStatus.ballY),
        );
        const currentBallDistance = Point.getDistance(
            new Point(currentStatus.player1X, currentStatus.player1Y),
            new Point(currentStatus.ballX, currentStatus.ballY),
        );

        return (
            -0.01 +
            (currentStatus.scoreLeft - previousStatus.scoreLeft) * 100 -
            (currentStatus.scoreRight - previousStatus.scoreRight) * 100 +
            (currentStatus.ballAttachedPlayer === 1 && previousStatus.ballAttachedPlayer !== 1
                ? 5
                : 0) +
            (currentStatus.ballAttachedPlayer === 1 && previousStatus.ballAttachedPlayer === 1
                ? 1
                : 0) +
            (currentStatus.ballAttachedPlayer === 1 && currentStatus.ballX > previousStatus.ballX
                ? 2
                : 0) +
            (currentStatus.ballAttachedPlayer !== 1 && currentBallDistance < previousBallDistance
                ? 3
                : 0)
        );
    }

    private normalizeXCoordinate(x: number, side: PlayerSide): number {
        let output = (x - this.gameConfigs.fieldXOffset) / this.gameConfigs.fieldWidth;
        if (side === PlayerSide.RIGHT) {
            output = 1 - output;
        }
        return output;
    }

    private normalizeYCoordinate(y: number): number {
        return y / this.gameConfigs.fieldHeight;
    }

    private normalizeSpeed(speed: number, maxSpeed: number): number {
        return speed / maxSpeed;
    }
}

export class Status {
    public constructor(
        public readonly player1X: number,
        public readonly player1Y: number,
        public readonly player1SpeedX: number,
        public readonly player1SpeedY: number,
        public readonly player1HasPowerShot: number,
        public readonly player1IsStunned: number,

        public readonly player2X: number,
        public readonly player2Y: number,
        public readonly player2SpeedX: number,
        public readonly player2SpeedY: number,
        public readonly player2HasPowerShot: number,
        public readonly player2IsStunned: number,

        public readonly ballX: number,
        public readonly ballY: number,
        public readonly ballSpeedX: number,
        public readonly ballSpeedY: number,
        public readonly ballAttachedPlayer: number,
        public readonly ballHasPowerShot: number,

        public readonly player1Color: number,

        public readonly scoreLeft: number,
        public readonly scoreRight: number,
    ) {}

    static readonly fieldsOrder = [
        "player1X",
        "player1Y",
        "player1SpeedX",
        "player1SpeedY",
        "player1HasPowerShot",
        "player1IsStunned",

        "player2X",
        "player2Y",
        "player2SpeedX",
        "player2SpeedY",
        "player2HasPowerShot",
        "player2IsStunned",

        "ballX",
        "ballY",
        "ballSpeedX",
        "ballSpeedY",
        "ballAttachedPlayer",
        "ballHasPowerShot",

        "player1Color",

        "scoreLeft",
        "scoreRight",
    ];

    public toArray(): Array<number> {
        return Status.fieldsOrder.map(f => this[f as keyof Status] as number);
    }
}

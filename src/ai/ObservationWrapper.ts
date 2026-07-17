import { Player } from "../game/entities/Player";
import { PlayerSide } from "../game/enums/PlayerSide";
import { PlayerStatus } from "../game/enums/PlayerStatus";
import { Point } from "../game/geometry/Point";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";

export class ObservationWrapper {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public extractObservation(gameWorld: GameWorld, refPlayer: Player): Observation {
        const otherPlayer = gameWorld.players.find(
            player => !player.isSubstitute && player !== refPlayer,
        );
        if (otherPlayer === undefined) {
            throw new Error("Other player not found");
        }
        const ball = gameWorld.ball;

        return new Observation(
            this.normalizeXCoordinate(refPlayer.movementPosition.position.x, refPlayer.side),
            this.normalizeYCoordinate(refPlayer.movementPosition.position.y),
            this.normalizeSpeed(
                refPlayer.movementPosition.velocity.x,
                refPlayer.normalMaxSpeed,
                refPlayer.side,
            ),
            this.normalizeSpeed(
                refPlayer.movementPosition.velocity.y,
                refPlayer.normalMaxSpeed,
                null,
            ),
            refPlayer.powerShotWrapper.getPowerShot() ? 1 : 0,
            refPlayer.playerStatus === PlayerStatus.STUNNED ? 1 : 0,

            this.normalizeXCoordinate(otherPlayer.movementPosition.position.x, otherPlayer.side),
            this.normalizeYCoordinate(otherPlayer.movementPosition.position.y),
            this.normalizeSpeed(
                otherPlayer.movementPosition.velocity.x,
                otherPlayer.normalMaxSpeed,
                otherPlayer.side,
            ),
            this.normalizeSpeed(
                otherPlayer.movementPosition.velocity.y,
                otherPlayer.normalMaxSpeed,
                null,
            ),
            otherPlayer.powerShotWrapper.getPowerShot() ? 1 : 0,
            otherPlayer.playerStatus === PlayerStatus.STUNNED ? 1 : 0,

            this.normalizeXCoordinate(ball.movementPosition.position.x, refPlayer.side),
            this.normalizeYCoordinate(ball.movementPosition.position.y),
            this.normalizeSpeed(
                ball.movementPosition.velocity.x,
                ball.maxSpeed * 2,
                refPlayer.side,
            ),
            this.normalizeSpeed(ball.movementPosition.velocity.y, ball.maxSpeed * 2, null),
            ball.attachedPlayer === null ? 0 : ball.attachedPlayer === refPlayer ? 1 : 2,
            ball.ballPowerShot.isPowerShot ? 1 : 0,

            refPlayer.colorIndex,

            gameWorld.score.leftScore,
            gameWorld.score.rightScore,
        );
    }

    public calculateReward(previousStatus: Observation, currentStatus: Observation): number {
        const previousBallDistance = Point.getDistance(
            new Point(previousStatus.player1X, previousStatus.player1Y),
            new Point(previousStatus.ballX, previousStatus.ballY),
        );
        const currentBallDistance = Point.getDistance(
            new Point(currentStatus.player1X, currentStatus.player1Y),
            new Point(currentStatus.ballX, currentStatus.ballY),
        );

        const goalScored = (currentStatus.scoreLeft - previousStatus.scoreLeft) * 100;
        const goalConceded = (currentStatus.scoreRight - previousStatus.scoreRight) * 100;

        const possessionGained =
            currentStatus.ballAttachedPlayer === 1 && previousStatus.ballAttachedPlayer !== 1
                ? 10
                : 0;
        const possessionHeld =
            currentStatus.ballAttachedPlayer === 1 && previousStatus.ballAttachedPlayer === 1
                ? 0.05
                : 0;
        const possessionLost =
            previousStatus.ballAttachedPlayer !== 2 && currentStatus.ballAttachedPlayer === 2
                ? -10
                : 0;

        const approachShaping = (previousBallDistance - currentBallDistance) * 5;

        const ballProgress = (currentStatus.ballX - previousStatus.ballX) * 8;

        const farFromBallPenalty =
            currentStatus.ballAttachedPlayer !== 1 ? -currentBallDistance * 0.1 : 0;

        const stepPenalty = -0.01;

        return (
            stepPenalty +
            goalScored -
            goalConceded +
            possessionGained +
            possessionHeld +
            possessionLost +
            approachShaping +
            ballProgress +
            farFromBallPenalty
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

    private normalizeSpeed(speed: number, maxSpeed: number, side: PlayerSide | null): number {
        return (speed / maxSpeed) * (side !== null && side === PlayerSide.RIGHT ? -1 : 1);
    }
}

export class Observation {
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
    ];

    public toArray(): Array<number> {
        return Observation.fieldsOrder.map(f => this[f as keyof Observation] as number);
    }
}

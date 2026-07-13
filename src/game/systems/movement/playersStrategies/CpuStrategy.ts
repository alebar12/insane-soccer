import { GameConfigs } from "../../../../utils/GameConfigs";
import { Ball } from "../../../entities/Ball";
import { Player } from "../../../entities/Player";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerSide } from "../../../enums/PlayerSide";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class CpuStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private readonly centerFieldX: number;
    private readonly goalOffset: number;
    private rotateDirection = 0;
    private rotateAngle = 0;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.centerFieldX = gameConfigs.fieldXOffset + gameConfigs.fieldWidth / 2;
        this.goalOffset = this.gameConfigs.goalHeight * 0.5;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus.NORMAL
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        const ball = gameWorld.ball;
        const attachedPlayer = ball.attachedPlayer;

        player.currentMaxSpeed = player.normalMaxSpeed;
        let destinationPosition = null;
        if (ball.ballStatus === BallStatus.FREE) {
            destinationPosition = ball.movementPosition.clone();
            this.rotateDirection = 0;
        } else if (ball.ballStatus === BallStatus.ATTACHED && attachedPlayer !== null) {
            if (attachedPlayer !== player) {
                destinationPosition = attachedPlayer.movementPosition.clone();
                destinationPosition.velocity = new Point(0, 0);
                destinationPosition.acceleration = 0;
            } else {
                if (this.isPlayerBeforeMidfield(player)) {
                    destinationPosition = new MovementPoint(
                        this.getGoalPosition(player),
                        new Point(0, 0),
                        0,
                        0,
                    );
                } else {
                    this.rotateCpu(player, deltaMs);
                }
                this.tryKick(player, ball);
            }
        }

        if (destinationPosition !== null) {
            player.destinationPosition = destinationPosition;
            player.adjustSpeedToDestinationPoint(deltaMs);
        }
    }

    private rotateCpu(player: Player, deltaMs: number): void {
        if (this.rotateDirection === 0) {
            this.rotateDirection = Math.random() < 0.5 ? -1 : 1;
            this.rotateAngle =
                (Math.random() * (Math.PI / 50 - Math.PI / 100) + Math.PI / 100) * 0.07;
        }
        let speed = player.movementPosition.getSpeed();
        let angle = player.movementPosition.getSpeedAngle();
        speed = speed + player.movementPosition.acceleration * deltaMs;
        angle = angle + this.rotateDirection * this.rotateAngle * deltaMs;
        player.movementPosition.setSpeed(speed, angle);
        player.movementPosition.adjustToMaxSpeed(player.currentMaxSpeed);
    }

    private tryKick(player: Player, ball: Ball): void {
        if (this.isBallDirectedToGoal(ball, player)) {
            const m =
                (ball.movementPosition.position.y - player.movementPosition.position.y) /
                (ball.movementPosition.position.x - player.movementPosition.position.x);
            const y =
                m * (this.getGoalX(player) - player.movementPosition.position.x) +
                player.movementPosition.position.y;

            if (
                y >= this.gameConfigs.goalYOffset - this.goalOffset &&
                y <= this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight + this.goalOffset
            ) {
                ball.kick();
            }
        }
    }

    private isPlayerBeforeMidfield(player: Player): boolean {
        return (
            (player.side === PlayerSide.LEFT &&
                player.movementPosition.position.x < this.centerFieldX) ||
            (player.side === PlayerSide.RIGHT &&
                player.movementPosition.position.x > this.centerFieldX)
        );
    }

    private getGoalPosition(player: Player): Point {
        return new Point(this.getGoalX(player), this.gameConfigs.fieldHeight / 2);
    }

    private getGoalX(player: Player): number {
        return (
            this.gameConfigs.fieldXOffset +
            (player.side === PlayerSide.RIGHT ? 0 : this.gameConfigs.fieldWidth)
        );
    }

    private isBallDirectedToGoal(ball: Ball, player: Player): boolean {
        return (
            (player.side === PlayerSide.LEFT &&
                ball.movementPosition.position.x > player.movementPosition.position.x) ||
            (player.side === PlayerSide.RIGHT &&
                ball.movementPosition.position.x < player.movementPosition.position.x)
        );
    }
}

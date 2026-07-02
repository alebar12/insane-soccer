import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class CpuMovementStrategy implements PlayerMovementStrategyInterface {
    private readonly gameConfigs: GameConfigs;
    private readonly centerFieldX: number;
    private rotateDirection = 0;
    private rotateAngle = 0;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.centerFieldX = gameConfigs.fieldXOffset + gameConfigs.fieldWidth / 2;
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
            if (!attachedPlayer.isCpu) {
                destinationPosition = attachedPlayer.movementPosition.clone();
            } else {
                if (player.movementPosition.position.x > this.centerFieldX) {
                    destinationPosition = new MovementPoint(
                        new Point(this.gameConfigs.fieldXOffset, this.gameConfigs.fieldHeight / 2),
                        new Point(0, 0),
                        0,
                        0,
                    );
                } else {
                    player.currentMaxSpeed = player.maxSpeedWithBall;
                    this.rotateCpu(player, deltaMs);
                }
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
}

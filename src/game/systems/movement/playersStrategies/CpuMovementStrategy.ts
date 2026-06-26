import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class CpuMovementStrategy implements PlayerMovementStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
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
        // TODO just random draft of CPU logic
        const ball = gameWorld.ball;
        player.currentMaxSpeed = player.normalMaxSpeed / 2;
        if (ball.ballStatus === BallStatus.FREE) {
            player.destinationPosition.position = ball.movementPosition.position;
            player.adjustSpeedToDestinationPoint(deltaMs);
        } else if (ball.ballStatus === BallStatus.ATTACHED) {
            const attachedPlayer = ball.attachedPlayer;
            if (attachedPlayer === null || attachedPlayer.isCpu) {
                /*const delta = player.movementPosition.acceleration * deltaMs;
                player.movementPosition.velocity.x =
                    Math.sign(player.movementPosition.velocity.x) *
                    Math.max(Math.abs(player.movementPosition.velocity.x) - delta, 0);
                player.movementPosition.velocity.y =
                    Math.sign(player.movementPosition.velocity.y) *
                    Math.max(Math.abs(player.movementPosition.velocity.y) - delta, 0);*/
                player.destinationPosition.position = new Point(
                    this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2,
                    this.gameConfigs.fieldHeight / 2,
                );
                player.adjustSpeedToDestinationPoint(deltaMs);
            } else {
                player.destinationPosition.position = attachedPlayer.movementPosition.position;
                player.adjustSpeedToDestinationPoint(deltaMs);
            }
        }
    }
}

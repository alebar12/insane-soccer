import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class StunnedPlayerStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            (this.isPlayerStunnedDuringPlay(player, gameWorld) ||
                this.hasPlayerLosedGame(player, gameWorld))
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME) {
            player.stunnedWrapper.forceStunned();
        }

        if (player.movementPosition.getSpeed() > player.currentMaxSpeed / 5) {
            player.movementPosition.decrementSpeed(deltaMs);
        } else {
            if (!player.stunnedWrapper.isInitialAngleSet) {
                this.setStunnedPlayerInitialMovementAngle(player);
                player.stunnedWrapper.isInitialAngleSet = true;
            }

            const speed = player.currentMaxSpeed / 15;
            let angle = player.movementPosition.getSpeedAngle();
            angle = (angle + (Math.PI / 30) * deltaMs * 0.05) % (2 * Math.PI);
            player.movementPosition.setSpeed(speed, angle);
        }
    }

    private isPlayerStunnedDuringPlay(player: Player, gameWorld: GameWorld): boolean {
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus.STUNNED
        );
    }

    private hasPlayerLosedGame(player: Player, gameWorld: GameWorld): boolean {
        const winningPlayerSide = gameWorld.score.getWinningPlayerSide();
        return (
            gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME &&
            winningPlayerSide !== null &&
            winningPlayerSide !== player.side
        );
    }

    private setStunnedPlayerInitialMovementAngle(player: Player): void {
        const angleToCenter = Point.getAngleBetweenPoints(
            player.movementPosition.position,
            new Point(
                this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2,
                this.gameConfigs.fieldHeight / 2,
            ),
        );
        player.movementPosition.setSpeed(
            player.movementPosition.getSpeed(),
            angleToCenter + Math.PI,
        );
    }
}

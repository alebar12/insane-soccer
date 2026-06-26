import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerMovementStrategyInterface } from "./PlayerMovementStrategyInterface";

export class StunnedPlayerMovementStrategy implements PlayerMovementStrategyInterface {
    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus.STUNNED
        );
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        if (player.movementPosition.getSpeed() > player.maxSpeedWithBall / 5) {
            player.movementPosition.decrementSpeed(deltaMs);
        } else {
            const speed = player.maxSpeedWithBall / 15;
            let angle = player.movementPosition.getSpeedAngle();
            angle = angle + (Math.PI / 30) * deltaMs * 0.05;
            player.movementPosition.setSpeed(speed, angle);
        }
    }
}

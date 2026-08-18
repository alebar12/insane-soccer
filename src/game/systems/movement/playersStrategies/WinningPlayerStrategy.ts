import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class WinningPlayerStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.END_GAME &&
            gameWorld.score.getWinningPlayerSide() === player.side
        );
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        if (player.reachedDestinationPosition()) {
            const x =
                this.gameConfigs.fieldXOffset +
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth;
            const y = (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition = new MovementPoint(new Point(x, y), new Point(0, 0), 0, 0);
            player.currentMaxSpeed =
                player.normalMaxSpeed * 2 * Math.random() + player.normalMaxSpeed;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

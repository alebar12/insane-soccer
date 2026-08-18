import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class MenuStrategy implements PlayerStrategyInterface {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return !player.isSubstitute && gameWorld.gameStatusManager.gameStatus === GameStatus.MENU;
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        if (player.reachedDestinationPosition()) {
            let x =
                this.gameConfigs.fieldXOffset +
                ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
            if (player.side === PlayerSide.RIGHT) {
                x += this.gameConfigs.fieldWidth / 2;
            }
            const y = (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition = new MovementPoint(new Point(x, y), new Point(0, 0), 0, 0);
            player.currentMaxSpeed =
                (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

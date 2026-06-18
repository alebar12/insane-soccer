import { GameConfigs } from "../../../utils/GameConfigs";
import { Player } from "../../entities/Player";
import { GameStatus } from "../../status/GameStatus";
import { PlayerSide } from "../../status/PlayerSide";
import { GameWorld } from "../../world/GameWorld";
import { AbstractMovementStrategy } from "./AbstractMovementStrategy";

export class MenuMovementStrategy extends AbstractMovementStrategy {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        super();
        this.gameConfigs = gameConfigs;
    }

    canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return !player.isSubstitute && gameWorld.gameStatus === GameStatus.MENU;
    }

    apply(player: Player, deltaMs: number): void {
        if (player.reachedDestinationPosition()) {
            player.destinationPosition.y =
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition.x =
                this.gameConfigs.fieldXOffset +
                ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
            if (player.side === PlayerSide.RIGHT) {
                player.destinationPosition.x += this.gameConfigs.fieldWidth / 2;
            }
            player.currentMaxSpeed = (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

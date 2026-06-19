import { GameConfigs } from "../../../utils/GameConfigs";
import { Point } from "../../../utils/Point";
import { Player } from "../../entities/Player";
import { GameStatus } from "../../status/GameStatus";
import { PlayerSide } from "../../status/PlayerSide";
import { GameWorld } from "../../world/GameWorld";
import { AbstractMovementStrategy } from "./AbstractMovementStrategy";

export class BeforeGameMovementStrategy extends AbstractMovementStrategy {
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        super();
        this.gameConfigs = gameConfigs;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            (gameWorld.gameStatusManager.gameStatus === GameStatus.MENU ||
                gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL)
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        if (gameWorld.gameStatusManager.gameStatus === GameStatus.MENU) {
            if (player.reachedDestinationPosition()) {
                player.destinationPosition.position.y =
                    (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
                player.destinationPosition.position.x =
                    this.gameConfigs.fieldXOffset +
                    ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
                if (player.side === PlayerSide.RIGHT) {
                    player.destinationPosition.position.x += this.gameConfigs.fieldWidth / 2;
                }
                player.destinationPosition.speed = new Point(0, 0);
                player.destinationPosition.acceleration = 0;
                player.currentMaxSpeed =
                    (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
            }
        } else if (gameWorld.gameStatusManager.gameStatus === GameStatus.WAITING_BALL) {
            if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
                player.resetToStartGame();
            }
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}

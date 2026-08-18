import { Player } from "@/game/entities/Player";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { MovementPoint } from "@/game/geometry/MovementPoint";
import { Point } from "@/game/geometry/Point";
import { AbstractCollisionStrategy } from "@/game/systems/collision/strategies/AbstractCollisionStrategy";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";

export class PlayerCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(_gameWorld: GameWorld): boolean {
        return true;
    }

    public apply(gameWorld: GameWorld): void {
        const player1 = gameWorld.players.find(player => player.side === PlayerSide.LEFT);
        const player2 = gameWorld.players.find(player => player.side === PlayerSide.RIGHT);

        if (player1 === undefined || player2 === undefined) {
            return;
        }

        if (MovementPoint.areTouching(player1.movementPosition, player2.movementPosition)) {
            if (gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING) {
                player1.stunnedWrapper.updateStunnedValue(
                    player1.movementPosition.getSpeed(),
                    player2.movementPosition.getSpeed(),
                );
                player2.stunnedWrapper.updateStunnedValue(
                    player2.movementPosition.getSpeed(),
                    player1.movementPosition.getSpeed(),
                );
            }

            const intersectionPoint = new Point(
                (player1.movementPosition.position.x + player2.movementPosition.position.x) / 2,
                (player1.movementPosition.position.y + player2.movementPosition.position.y) / 2,
            );
            player1.startBouncing();
            player2.startBouncing();
            const collisionSpeed =
                (player1.movementPosition.getSpeed() + player2.movementPosition.getSpeed()) / 2;
            this.bouncePlayers(player1, player2, intersectionPoint, collisionSpeed);
            this.bouncePlayers(player2, player1, intersectionPoint, collisionSpeed);

            const ball = gameWorld.ball;
            if (ball.ballStatus === BallStatus.ATTACHED) {
                ball.movementPosition.setSpeed(
                    collisionSpeed,
                    Point.getAngleBetweenPoints(intersectionPoint, ball.movementPosition.position),
                );
                ball.releaseFromPlayer();
            }
        }
    }

    private bouncePlayers(
        player1: Player,
        player2: Player,
        intersectionPoint: Point,
        collisionSpeed: number,
    ): void {
        const angle =
            Point.getAngleBetweenPoints(player1.movementPosition.position, intersectionPoint) -
            Math.PI;
        player1.movementPosition.setSpeed(collisionSpeed, angle);
        player1.movementPosition.position.x =
            intersectionPoint.x + Math.cos(angle) * player2.movementPosition.size;
        player1.movementPosition.position.y =
            intersectionPoint.y + Math.sin(angle) * player2.movementPosition.size;
    }
}

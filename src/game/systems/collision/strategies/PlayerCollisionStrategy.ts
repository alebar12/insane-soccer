import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { BallStatus } from "../../../enums/BallStatus";
import { MovementPoint } from "../../../geometry/MovementPoint";
import { Point } from "../../../geometry/Point";
import { GameWorld } from "../../../world/GameWorld";
import { AbstractCollisionStrategy } from "./AbstractCollisionStrategy";

export class PlayerCollisionStrategy extends AbstractCollisionStrategy {
    public constructor(gameConfigs: GameConfigs) {
        super(gameConfigs);
    }

    public canBeApplied(_gameWorld: GameWorld): boolean {
        return true;
    }

    public apply(gameWorld: GameWorld): void {
        const humanPlayer = gameWorld.players.find(player => !player.isSubstitute && !player.isCpu);
        const cpuPlayer = gameWorld.players.find(player => !player.isSubstitute && player.isCpu);

        if (humanPlayer === undefined || cpuPlayer === undefined) {
            return;
        }

        if (MovementPoint.areTouching(humanPlayer.movementPosition, cpuPlayer.movementPosition)) {
            const intersectionPoint = new Point(
                (humanPlayer.movementPosition.position.x + cpuPlayer.movementPosition.position.x) /
                    2,
                (humanPlayer.movementPosition.position.y + cpuPlayer.movementPosition.position.y) /
                    2,
            );
            const collisionSpeed =
                (humanPlayer.movementPosition.getSpeed() + cpuPlayer.movementPosition.getSpeed()) /
                2;
            this.bouncePlayers(humanPlayer, cpuPlayer, intersectionPoint, collisionSpeed);
            this.bouncePlayers(cpuPlayer, humanPlayer, intersectionPoint, collisionSpeed);

            const ball = gameWorld.ball;
            if (ball.ballStatus === BallStatus.ATTACHED) {
                ball.movementPosition.setSpeed(
                    collisionSpeed,
                    Point.getAngleBetweenPoints(intersectionPoint, ball.movementPosition.position),
                );
                ball.ballStatus = BallStatus.FREE;
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

import { Ball } from "../../../entities/Ball";
import { GameWorld } from "../../../world/GameWorld";

export abstract class AbstractBallMovementStrategy {
    abstract canBeApplied(ball: Ball, gameWorld: GameWorld): boolean;

    abstract apply(ball: Ball, gameWorld: GameWorld, deltaMs: number): void;
}

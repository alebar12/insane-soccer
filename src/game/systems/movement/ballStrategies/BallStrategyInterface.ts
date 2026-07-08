import { Ball } from "../../../entities/Ball";
import { GameWorld } from "../../../world/GameWorld";

export interface BallStrategyInterface {
    canBeApplied(ball: Ball, gameWorld: GameWorld): boolean;

    apply(ball: Ball, gameWorld: GameWorld, deltaMs: number): void;
}

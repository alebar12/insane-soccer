import { Ball } from "@/game/entities/Ball";
import { GameWorld } from "@/game/world/GameWorld";

export interface BallStrategyInterface {
    canBeApplied(ball: Ball, gameWorld: GameWorld): boolean;

    apply(ball: Ball, gameWorld: GameWorld, deltaMs: number): void;
}

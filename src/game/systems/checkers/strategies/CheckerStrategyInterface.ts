import { GameWorld } from "@/game/world/GameWorld";

export interface CheckerStrategyInterface {
    canBeApplied(gameWorld: GameWorld): boolean;

    apply(gameWorld: GameWorld): void;
}

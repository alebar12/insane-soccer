import { GameWorld } from "../../../world/GameWorld";

export interface CheckerStrategyInterface {
    canBeApplied(gameWorld: GameWorld): boolean;

    apply(gameWorld: GameWorld): void;
}

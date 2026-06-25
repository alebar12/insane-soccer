import { Player } from "../../../entities/Player";
import { GameWorld } from "../../../world/GameWorld";

export interface PlayerMovementStrategyInterface {
    canBeApplied(player: Player, gameWorld: GameWorld): boolean;

    apply(player: Player, gameWorld: GameWorld, deltaMs: number): void;
}

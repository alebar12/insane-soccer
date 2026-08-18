import { Player } from "@/game/entities/Player";
import { GameWorld } from "@/game/world/GameWorld";

export interface PlayerStrategyInterface {
    canBeApplied(player: Player, gameWorld: GameWorld): boolean;

    apply(player: Player, gameWorld: GameWorld, deltaMs: number): void;
}

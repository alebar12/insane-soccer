import { Player } from "../../entities/Player";
import { GameWorld } from "../../world/GameWorld";

export abstract class AbstractMovementStrategy {
    abstract canBeApplied(player: Player, gameWorld: GameWorld): boolean;

    abstract apply(player: Player, gameWorld: GameWorld, deltaMs: number): void;
}

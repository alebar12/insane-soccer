import { GameWorld } from "../world/GameWorld";

export interface SystemInterface {
    update(gameWorld: GameWorld, deltaMs: number): void;
}

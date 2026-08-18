import { GameWorld } from "@/game/world/GameWorld";

export interface SystemInterface {
    update(gameWorld: GameWorld, deltaMs: number): void;
}

import { GameWorld } from "../game/world/GameWorld";

export interface RenderInterface {
    render(gameWorld: GameWorld): void;
}

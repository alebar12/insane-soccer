import { KeyboardInputManager } from "../../input/KeyboardInputManager";
import { GameConfigs } from "../../utils/GameConfigs";
import { GameWorld } from "../world/GameWorld";
import { CollisionSystem } from "./collision/CollisionSystem";
import { MovementSystem } from "./movement/MovementSystem";
import { SystemInterface } from "./SystemInterface";

export class MainSystem {
    private readonly systems = new Array<SystemInterface>();

    public constructor(gameConfigs: GameConfigs) {
        this.systems.push(new MovementSystem(gameConfigs, new KeyboardInputManager()));
        this.systems.push(new CollisionSystem(gameConfigs));
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }
}

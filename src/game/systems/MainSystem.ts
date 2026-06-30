import { KeyboardInputManager } from "../../input/KeyboardInputManager";
import { GameConfigs } from "../../utils/GameConfigs";
import { GameWorld } from "../world/GameWorld";
import { CheckerSystem } from "./checkers/CheckerSystem";
import { CollisionSystem } from "./collision/CollisionSystem";
import { GateSystem } from "./GateSystem";
import { MovementSystem } from "./movement/MovementSystem";
import { SystemInterface } from "./SystemInterface";

export class MainSystem {
    private readonly systems = new Array<SystemInterface>();

    public constructor(gameConfigs: GameConfigs) {
        this.systems.push(new MovementSystem(gameConfigs, new KeyboardInputManager()));
        this.systems.push(new CollisionSystem(gameConfigs));
        this.systems.push(new GateSystem());
        this.systems.push(new CheckerSystem());
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }
}

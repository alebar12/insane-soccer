import { AiToolsWrapper } from "../../ai/AiToolsWrapper";
import { KeyboardInputManager } from "../../input/KeyboardInputManager";
import { GameConfigs } from "../../utils/GameConfigs";
import { Keys } from "../enums/Keys";
import { GameWorld } from "../world/GameWorld";
import { CheckerSystem } from "./checkers/CheckerSystem";
import { CollisionSystem } from "./collision/CollisionSystem";
import { GateSystem } from "./GateSystem";
import { MovementSystem } from "./movement/MovementSystem";
import { SystemInterface } from "./SystemInterface";

export class MainSystem {
    private readonly systems = new Array<SystemInterface>();
    private keyboardInputManager: KeyboardInputManager;

    public constructor(gameConfigs: GameConfigs, aiToolsWrapper: AiToolsWrapper) {
        this.keyboardInputManager = new KeyboardInputManager();
        this.systems.push(
            new MovementSystem(gameConfigs, this.keyboardInputManager, aiToolsWrapper),
        );
        this.systems.push(new CollisionSystem(gameConfigs));
        this.systems.push(new GateSystem());
        this.systems.push(new CheckerSystem());
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }

    public forceKeyboardInput(keys: Set<Keys>): void {
        this.keyboardInputManager.setPressedKeys(keys);
    }
}

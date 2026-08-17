import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { Keys } from "@/game/enums/Keys";
import { CheckerSystem } from "@/game/systems/checkers/CheckerSystem";
import { CollisionSystem } from "@/game/systems/collision/CollisionSystem";
import { GateSystem } from "@/game/systems/GateSystem";
import { MovementSystem } from "@/game/systems/movement/MovementSystem";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";

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

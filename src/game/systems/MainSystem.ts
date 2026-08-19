import { Keys } from "@/game/enums/Keys";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";

export class MainSystem {
    public constructor(
        private readonly systems: ReadonlyArray<SystemInterface>,
        private readonly keyboardInputManager: KeyboardInputManager,
    ) {}

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }

    public forceKeyboardInput(keys: Set<Keys>): void {
        this.keyboardInputManager.setPressedKeys(keys);
    }
}

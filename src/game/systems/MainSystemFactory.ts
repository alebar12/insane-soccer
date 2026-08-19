import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { CheckerSystem } from "@/game/systems/checkers/CheckerSystem";
import { CollisionSystem } from "@/game/systems/collision/CollisionSystem";
import { GateSystem } from "@/game/systems/GateSystem";
import { MainSystem } from "@/game/systems/MainSystem";
import { MovementSystem } from "@/game/systems/movement/MovementSystem";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";

export class MainSystemFactory {
    public static create(gameConfigs: GameConfigs, aiToolsWrapper: AiToolsWrapper): MainSystem {
        const keyboardInputManager = new KeyboardInputManager();
        return new MainSystem(
            [
                new MovementSystem(gameConfigs, keyboardInputManager, aiToolsWrapper),
                new CollisionSystem(gameConfigs),
                new GateSystem(),
                new CheckerSystem(),
            ],
            keyboardInputManager,
        );
    }
}

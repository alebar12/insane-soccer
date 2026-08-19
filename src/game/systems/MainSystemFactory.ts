import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { GateSystem } from "@/game/systems/GateSystem";
import { MainSystem } from "@/game/systems/MainSystem";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";
import { GameConfigs } from "@/utils/GameConfigs";
import { CheckerSystemFactory } from "./checkers/CheckerSystemFactory";
import { CollisionSystemFactory } from "./collision/CollisionSystemFactory";
import { MovementSystemFactory } from "./movement/MovementSystemFactory";

export class MainSystemFactory {
    public static create(gameConfigs: GameConfigs, aiToolsWrapper: AiToolsWrapper): MainSystem {
        const keyboardInputManager = new KeyboardInputManager();
        return new MainSystem(
            [
                MovementSystemFactory.create(gameConfigs, keyboardInputManager, aiToolsWrapper),
                CollisionSystemFactory.create(gameConfigs),
                new GateSystem(),
                CheckerSystemFactory.create(),
            ],
            keyboardInputManager,
        );
    }
}

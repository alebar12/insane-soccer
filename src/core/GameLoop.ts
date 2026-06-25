import { AssetLoader } from "../assets/AssetLoader";
import { GameStatus } from "../game/enums/GameStatus";
import { CollisionSystem } from "../game/systems/collision/CollisionSystem";
import { MovementSystem } from "../game/systems/movement/MovementSystem";
import { SystemInterface } from "../game/systems/SystemInterface";
import { GameWorld } from "../game/world/GameWorld";
import { KeyboardInputManager } from "../input/KeyboardInputManager";
import { MouseInputManager } from "../input/MouseInputManager";
import { MainRender } from "../rendering/MainRender";
import { DomHandler } from "../ui/DomHandler";
import { UIInteractionSystem } from "../ui/UIInteractionSystem";
import { GameConfigs } from "../utils/GameConfigs";

export class GameLoop {
    private prevTime: number = 0;
    private mainRender: MainRender;
    private gameWorld: GameWorld;
    private uiInteractionSystem: UIInteractionSystem;

    private systems = new Array<SystemInterface>();

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem(
            new MouseInputManager(domHandler.menuCanvas),
        );

        this.systems.push(new MovementSystem(gameConfigs, new KeyboardInputManager()));
        this.systems.push(new CollisionSystem(gameConfigs));
    }

    public main(): void {
        const tick = (time: number): void => {
            if (this.prevTime !== 0) {
                const delta = time - this.prevTime;
                this.updateInputs(delta);
                this.update(delta);
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    private update(delta: number): void {
        this.gameWorld.gameStatusManager.update(delta);
        this.systems.forEach(system => system.update(this.gameWorld, delta));
    }

    private updateInputs(delta: number): void {
        this.uiInteractionSystem.update(
            this.gameWorld.menuButton,
            () => {
                this.gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
            },
            delta,
        );
    }

    private render(): void {
        this.mainRender.render(this.gameWorld);
    }
}

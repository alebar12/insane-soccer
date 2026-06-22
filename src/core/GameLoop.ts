import { AssetLoader } from "../assets/AssetLoader";
import { MovementSystem } from "../game/systems/MovementSystem";
import { GameWorld } from "../game/world/GameWorld";
import { MouseInputManager } from "../input/MouseInputManager";
import { MainRender } from "../rendering/MainRender";
import { UIInteractionSystem } from "../ui/UIInteractionSystem";
import { DomHandler } from "../ui/DomHandler";
import { GameConfigs } from "../utils/GameConfigs";
import { GameStatus } from "../game/enums/GameStatus";
import { CollisionSystem } from "../game/systems/CollisionSystem";
import { KeyboardInputManager } from "../input/KeyboardInputManager";

export class GameLoop {
    private delta: number = 0;
    private prevTime: number = 0;
    private mainRender: MainRender;
    private gameWorld: GameWorld;
    private uiInteractionSystem: UIInteractionSystem;

    private movementSystem: MovementSystem;
    private collisionSystem: CollisionSystem;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem(
            new MouseInputManager(domHandler.menuCanvas),
        );

        this.movementSystem = new MovementSystem(gameConfigs, new KeyboardInputManager());
        this.collisionSystem = new CollisionSystem(gameConfigs);
    }

    public main(): void {
        const tick = (time: number): void => {
            if (this.prevTime !== 0) {
                this.delta = time - this.prevTime;
                this.updateInputs(this.delta);
                this.update();
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    private update(): void {
        this.gameWorld.gameStatusManager.update(this.delta);
        this.movementSystem.update(this.gameWorld, this.delta);
        this.collisionSystem.update(this.gameWorld);
    }

    private updateInputs(deltaMs: number): void {
        this.uiInteractionSystem.update(
            this.gameWorld.menuButton,
            () => {
                this.gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
            },
            deltaMs,
        );
    }

    private render(): void {
        this.mainRender.render(this.gameWorld);
    }
}

import { AssetLoader } from "../assets/AssetLoader";
import { GameStatus } from "../game/enums/GameStatus";
import { MainSystem } from "../game/systems/MainSystem";
import { GameWorld } from "../game/world/GameWorld";
import { MouseInputManager } from "../input/MouseInputManager";
import { MainRender } from "../rendering/MainRender";
import { DomHandler } from "../ui/DomHandler";
import { UIInteractionSystem } from "../ui/UIInteractionSystem";
import { GameConfigs } from "../utils/GameConfigs";

export class GameLoop {
    private prevTime: number = 0;
    private gameWorld: GameWorld;
    private mainRender: MainRender;
    private mainSystem: MainSystem;
    private uiInteractionSystem: UIInteractionSystem;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem(
            new MouseInputManager(domHandler.menuCanvas),
        );

        this.mainSystem = new MainSystem(gameConfigs);
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
        this.mainSystem.update(this.gameWorld, delta);
        this.gameWorld.fireworks.update(delta);
        this.gameWorld.explosion.update(delta);
    }

    private updateInputs(delta: number): void {
        this.uiInteractionSystem.update(
            this.gameWorld.menuButton,
            () => {
                if (this.gameWorld.gameStatusManager.gameStatus === GameStatus.MENU) {
                    this.gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
                    this.gameWorld.fireworks.reset();
                    this.uiInteractionSystem.input.reset();
                }
            },
            delta,
        );
    }

    private render(): void {
        this.mainRender.render(this.gameWorld);
    }
}

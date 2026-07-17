import { AiToolsWrapper } from "../ai/AiToolsWrapper";
import { InferenceWrapper } from "../ai/InferenceWrapper";
import { ObservationWrapper } from "../ai/ObservationWrapper";
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
    private aiToolsWrapper: AiToolsWrapper;
    private history: Array<string> = [];
    private historyIndex: number = 0;

    public constructor(gameConfigs: GameConfigs, domHandler: DomHandler, assetLoader: AssetLoader) {
        this.mainRender = new MainRender(gameConfigs, domHandler, assetLoader);
        const playImg = assetLoader.getImage("play.png");
        const menuButtonImageRatio = playImg.width / playImg.height;
        this.gameWorld = GameWorld.createPlayingGameWorldWithScriptedCpu(
            gameConfigs,
            menuButtonImageRatio,
        );
        this.uiInteractionSystem = new UIInteractionSystem(
            new MouseInputManager(domHandler.menuCanvas),
        );

        this.aiToolsWrapper = new AiToolsWrapper(
            new InferenceWrapper(),
            new ObservationWrapper(gameConfigs),
        );

        this.mainSystem = new MainSystem(gameConfigs, this.aiToolsWrapper);
    }

    public setHistory(history: string): void {
        this.history = history.split("\n");
        this.historyIndex = 0;
    }

    public main(): void {
        const tick = (time: number): void => {
            if (this.prevTime !== 0) {
                const delta = time - this.prevTime;
                if (this.history.length > 0) {
                    this.gameWorld.gameStatusManager.changeStatus(GameStatus.PLAYING);
                    const positions = this.history[this.historyIndex].split(" ");
                    this.gameWorld.players[0].movementPosition.position.x = parseFloat(
                        positions[0],
                    );
                    this.gameWorld.players[0].movementPosition.position.y = parseFloat(
                        positions[1],
                    );
                    this.gameWorld.players[1].movementPosition.position.x = parseFloat(
                        positions[2],
                    );
                    this.gameWorld.players[1].movementPosition.position.y = parseFloat(
                        positions[3],
                    );
                    this.gameWorld.ball.movementPosition.position.x = parseFloat(positions[4]);
                    this.gameWorld.ball.movementPosition.position.y = parseFloat(positions[5]);
                    this.historyIndex++;
                } else {
                    this.updateInputs(delta);
                    this.update(delta);
                }
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    private update(delta: number): void {
        this.gameWorld.update(delta);
        this.mainSystem.update(this.gameWorld, delta);
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

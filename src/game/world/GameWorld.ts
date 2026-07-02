import { EventBus } from "ts-bus";
import { AssetLoader } from "../../assets/AssetLoader";
import { EventBusUtilities } from "../../utils/EventBusUtilities";
import { GameConfigs } from "../../utils/GameConfigs";
import { Ball } from "../entities/Ball";
import { Fireworks } from "../entities/Fireworks";
import { Gate } from "../entities/Gate";
import { GoalPosts } from "../entities/GoalPosts";
import { MenuButton } from "../entities/MenuButton";
import { Player } from "../entities/Player";
import { GameStatus } from "../enums/GameStatus";
import { PlayerSide } from "../enums/PlayerSide";
import { GameStatusManager } from "../managers/GameStatusManager";
import { ScoreManager } from "../managers/ScoreManager";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];
    public readonly ball: Ball;
    public readonly fireworks: Fireworks;
    public readonly gates: Gate;
    public readonly menuButton: MenuButton;
    public readonly gameStatusManager: GameStatusManager;
    public readonly score: ScoreManager;

    public constructor(gameConfigs: GameConfigs, assetLoader: AssetLoader) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(Player.createHumanPlayer(gameConfigs));
        this.players.push(Player.createCpuPlayer(gameConfigs));
        this.players.push(Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player.createRightSubstitutePlayer(gameConfigs));
        this.ball = new Ball(gameConfigs);
        this.fireworks = new Fireworks(gameConfigs);
        this.gates = new Gate();
        const bus = new EventBus();
        this.score = new ScoreManager();
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager(bus);

        bus.subscribe(EventBusUtilities.statusChangedEvent, event => {
            if (event.payload === GameStatus.MENU) {
                this.resetEndGame();
            }
        });
    }

    public increaseScore(playerSide: PlayerSide): void {
        this.score.increaseScore(playerSide);
        if (this.score.isSubstitutionTime()) {
            this.gameStatusManager.changeStatus(GameStatus.SUBSTITION);
        } else {
            this.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        }
        this.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
                player.resetOnGoal();
                player.powerShotWrapper.updateScoredGoal(playerSide);
            });
        this.ball.resetOnGoal();

        if (this.score.isGameOver) {
            this.gameStatusManager.changeStatus(GameStatus.END_GAME);
            this.fireworks.initFireworks();
            this.gameStatusManager.scheduleStatusChange(Fireworks.animationTime, GameStatus.MENU);
            this.players.forEach(player => {
                player.powerShotWrapper.resetPowerShot();
            });
        }
    }

    public switchPlayerColor(playerSide: PlayerSide): void {
        this.players
            .filter(player => {
                return player.side === playerSide;
            })
            .forEach(player => player.switchColorIndex());
    }

    private resetEndGame(): void {
        this.players.forEach(player => player.resetOnGoal());
        this.ball.resetOnGoal();
        this.score.reset();
    }
}

import { EventBus } from "ts-bus";
import { AssetLoader } from "../../assets/AssetLoader";
import { GameConfigs } from "../../utils/GameConfigs";
import { Ball } from "../entities/Ball";
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
        const bus = new EventBus();
        this.score = new ScoreManager(bus);
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager(bus);
    }

    public increaseScore(playerSide: PlayerSide): void {
        this.score.increaseScore(playerSide);
        this.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        this.players.forEach(player => player.resetOnGoal());
        this.ball.resetOnGoal();

        if (this.score.isGameOver) {
            this.gameStatusManager.changeStatus(GameStatus.END_GAME);
            this.gameStatusManager.scheduleStatusChange(3000, GameStatus.MENU);
        }
    }
}

import { AssetLoader } from "../../assets/AssetLoader";
import { GameConfigs } from "../../utils/GameConfigs";
import { Ball } from "../entities/Ball";
import { GoalPosts } from "../entities/GoalPosts";
import { MenuButton } from "../entities/MenuButton";
import { Player } from "../entities/Player";
import { GameStatusManager } from "../managers/GameStatusManager";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];
    public readonly ball: Ball;
    public readonly menuButton: MenuButton;
    public readonly gameStatusManager: GameStatusManager;

    public constructor(gameConfigs: GameConfigs, assetLoader: AssetLoader) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(Player.createHumanPlayer(gameConfigs));
        this.players.push(Player.createCpuPlayer(gameConfigs));
        this.players.push(Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player.createRightSubstitutePlayer(gameConfigs));
        this.ball = new Ball(gameConfigs);
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager();
    }
}

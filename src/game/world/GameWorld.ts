import { AssetLoader } from "../../assets/AssetLoader";
import { GameConfigs } from "../../utils/GameConfigs";
import { CpuPlayer } from "../entities/CpuPlayer";
import { GoalPosts } from "../entities/GoalPosts";
import { HumanPlayer } from "../entities/HumanPlayer";
import { MenuButton } from "../entities/MenuButton";
import { Player } from "../entities/Player";
import { Substitute1Player } from "../entities/Substitute1Player";
import { Substitute2Player } from "../entities/Substitute2Player";
import { GameStatus } from "../status/GameStatus";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];
    public readonly menuButton: MenuButton;
    public gameStatus: GameStatus;

    public constructor(gameConfigs: GameConfigs, assetLoader: AssetLoader) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(new HumanPlayer(gameConfigs));
        this.players.push(new CpuPlayer(gameConfigs));
        this.players.push(new Substitute1Player(gameConfigs));
        this.players.push(new Substitute2Player(gameConfigs));
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatus = GameStatus.MENU;
    }
}

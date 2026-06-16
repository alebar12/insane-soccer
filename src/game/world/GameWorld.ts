import { GameConfigs } from "../../utils/GameConfigs";
import { CpuPlayer } from "../entities/CpuPlayer";
import { GoalPosts } from "../entities/GoalPosts";
import { HumanPlayer } from "../entities/HumanPlayer";
import { Player } from "../entities/Player";
import { Substitute1Player } from "../entities/Substitute1Player";
import { Substitute2Player } from "../entities/Substitute2Player";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(new HumanPlayer(gameConfigs));
        this.players.push(new CpuPlayer(gameConfigs));
        this.players.push(new Substitute1Player(gameConfigs));
        this.players.push(new Substitute2Player(gameConfigs));
    }
}

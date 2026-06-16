import { GameConfigs } from "../../utils/GameConfigs";
import { GoalPosts } from "../entities/GoalPosts";
import { Player } from "../entities/Player";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(Player.initHuman(gameConfigs));
        this.players.push(Player.initCpu(gameConfigs));
        this.players.push(Player.initSubstitue1(gameConfigs));
        this.players.push(Player.initSubstitue2(gameConfigs));
    }
}

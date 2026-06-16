import { GameConfigs } from "../../utils/GameConfigs";
import { GoalPosts } from "../entities/GoalPosts";
import { Player } from "../entities/Player";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(new Player(gameConfigs, true, false));
        this.players.push(new Player(gameConfigs, false, false));
        this.players.push(new Player(gameConfigs, true, true));
        this.players.push(new Player(gameConfigs, false, true));
    }
}

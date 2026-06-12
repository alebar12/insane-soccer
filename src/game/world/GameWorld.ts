import { GameConfigs } from "../../utils/GameConfigs";
import { GoalPosts } from "../entities/GoalPosts";

export class GameWorld {
    public readonly goalPosts: GoalPosts;

    public constructor(gameConfigs: GameConfigs) {
        this.goalPosts = new GoalPosts(gameConfigs);
    }
}

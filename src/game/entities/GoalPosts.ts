import { GameConfigs } from "../../utils/GameConfigs";

export class GoalPosts {
    public readonly positions: Array<{ x: number; y: number }>;

    public constructor(gameConfigs: GameConfigs) {
        this.positions = [];
        this.positions.push({
            x: gameConfigs.fieldXOffset,
            y: gameConfigs.goalYOffset,
        });
        this.positions.push({
            x: gameConfigs.fieldXOffset,
            y: gameConfigs.goalYOffset + gameConfigs.goalHeight,
        });
        this.positions.push({
            x: gameConfigs.fieldXOffset + gameConfigs.fieldWidth,
            y: gameConfigs.goalYOffset,
        });
        this.positions.push({
            x: gameConfigs.fieldXOffset + gameConfigs.fieldWidth,
            y: gameConfigs.goalYOffset + gameConfigs.goalHeight,
        });
    }
}

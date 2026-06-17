import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";

export class GoalPosts {
    public readonly positions: Array<Point>;
    public readonly radius: number;

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
        this.radius = gameConfigs.goalPostRadius;
    }
}

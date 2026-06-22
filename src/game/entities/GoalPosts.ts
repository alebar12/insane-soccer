import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../geometry/Point";

export class GoalPosts {
    public readonly positions: Array<Point>;
    public readonly radius: number;

    public constructor(gameConfigs: GameConfigs) {
        this.positions = [];

        this.positions.push(new Point(gameConfigs.fieldXOffset, gameConfigs.goalYOffset));
        this.positions.push(
            new Point(gameConfigs.fieldXOffset, gameConfigs.goalYOffset + gameConfigs.goalHeight),
        );
        this.positions.push(
            new Point(gameConfigs.fieldXOffset + gameConfigs.fieldWidth, gameConfigs.goalYOffset),
        );
        this.positions.push(
            new Point(
                gameConfigs.fieldXOffset + gameConfigs.fieldWidth,
                gameConfigs.goalYOffset + gameConfigs.goalHeight,
            ),
        );
        this.radius = gameConfigs.goalPostRadius;
    }
}

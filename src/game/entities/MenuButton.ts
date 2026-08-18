import { HoverableEntity } from "@/game/entities/HoverableEntity";
import { Dimensions } from "@/game/geometry/Dimensions";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";

export class MenuButton extends HoverableEntity {
    public readonly position: Point;
    public readonly dimension: Dimensions;

    public constructor(gameConfigs: GameConfigs, imageRation: number) {
        super();
        const height = gameConfigs.fieldHeight / 5;
        this.dimension = new Dimensions(height * imageRation, height);
        this.position = new Point(
            gameConfigs.fieldXOffset + (gameConfigs.fieldWidth - this.dimension.width) / 2,
            (gameConfigs.fieldHeight - this.dimension.height) / 2,
        );
    }

    public contains(point: Point): boolean {
        return (
            point.x >= this.position.x &&
            point.x <= this.position.x + this.dimension.width &&
            point.y >= this.position.y &&
            point.y <= this.position.y + this.dimension.height
        );
    }

    public getTransitionTime(): number {
        return 100;
    }
}

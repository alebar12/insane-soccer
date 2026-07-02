import { GameWorld } from "../../game/world/GameWorld";
import { RenderInterface } from "../RenderInterface";

export class ExplosionRender implements RenderInterface {
    private readonly gameContext: CanvasRenderingContext2D;

    public constructor(gameContext: CanvasRenderingContext2D) {
        this.gameContext = gameContext;
    }

    public render(gameWorld: GameWorld): void {
        const explosion = gameWorld.explosion;
        explosion.components.forEach(component => {
            const x =
                explosion.position.x +
                Math.cos(component.angle) * component.getFactor() * explosion.maxDistance;
            const y =
                explosion.position.y +
                Math.sin(component.angle) * component.getFactor() * explosion.maxDistance;
            const size = (1 - component.getFactor()) * explosion.maxSize;

            this.gameContext.save();
            this.gameContext.beginPath();
            this.gameContext.arc(x, y, size, 0, 2 * Math.PI, false);
            this.gameContext.fillStyle = component.color;
            this.gameContext.fill();
            this.gameContext.closePath();
            this.gameContext.restore();
        });
    }
}

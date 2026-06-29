import { FireworkDto, Fireworks } from "../../game/entities/Fireworks";
import { GameWorld } from "../../game/world/GameWorld";
import { RenderInterface } from "../RenderInterface";

export class FireworksRender implements RenderInterface {
    private readonly gameContext: CanvasRenderingContext2D;

    public constructor(gameContext: CanvasRenderingContext2D) {
        this.gameContext = gameContext;
    }

    public render(gameWorld: GameWorld): void {
        gameWorld.fireworks.fireworks.forEach(firework => {
            if (firework.isFiring()) {
                this.renderFirework(firework, gameWorld.fireworks.lineWidth);
            }
        });
    }

    private renderFirework(firework: FireworkDto, lineWidth: number): void {
        firework.components.forEach(component => {
            const lenght = Fireworks.maxLengthFactor * firework.getFactor();
            const timeFactor = firework.getTimeFactor();
            const x1 =
                firework.position.x +
                Math.cos(component["angle"]) *
                    (timeFactor * component["distance"] - component["distance"] * lenght);
            const y1 =
                firework.position.y +
                Math.sin(component["angle"]) *
                    (timeFactor * component["distance"] - component["distance"] * lenght);
            const x2 =
                firework.position.x +
                Math.cos(component["angle"]) *
                    (timeFactor * component["distance"] + component["distance"] * lenght);
            const y2 =
                firework.position.y +
                Math.sin(component["angle"]) *
                    (timeFactor * component["distance"] + component["distance"] * lenght);

            this.gameContext.save();
            this.gameContext.beginPath();
            this.gameContext.lineWidth = lineWidth;
            this.gameContext.strokeStyle = component["color"];
            this.gameContext.moveTo(Math.round(x1), Math.round(y1));
            this.gameContext.lineTo(Math.round(x2), Math.round(y2));
            this.gameContext.stroke();
            this.gameContext.closePath();
            this.gameContext.restore();
        });
    }
}

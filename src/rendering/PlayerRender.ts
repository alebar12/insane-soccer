import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";

export class PlayerRender {
    private readonly gameContext: CanvasRenderingContext2D;
    private readonly gameConfigs: GameConfigs;
    private readonly colorMap: Map<string, string> = new Map([
        ["LEFT-0", "#008000"],
        ["LEFT-1", "#338088"],
        ["RIGHT-0", "#FFA500"],
        ["RIGHT-1", "#FFFF00"],
    ]);
    private readonly stunnedColor: string = "#FFFFFF";
    private readonly borderColor: string = "#003300";

    public constructor(gameContext: CanvasRenderingContext2D, gameConfigs: GameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }

    public render(gameWorld: GameWorld): void {
        gameWorld.players.forEach(player => {
            this.gameContext.save();

            const colorKey = `${player.side}-${player.colorIndex}`;
            let color = player.isStunned ? this.stunnedColor : this.colorMap.get(colorKey);
            if (color === undefined) {
                color = "#FF0000";
            }
            this.gameContext.fillStyle = color;
            this.gameContext.strokeStyle = this.borderColor;
            this.gameContext.lineWidth = this.gameConfigs.playerBorder;

            this.gameContext.shadowColor = "#000000";
            this.gameContext.shadowOffsetX = this.gameConfigs.shadowOffset;
            this.gameContext.shadowOffsetY = this.gameConfigs.shadowOffset;
            this.gameContext.shadowBlur = this.gameConfigs.shadowBlur;

            this.gameContext.translate(
                Math.round(player.movementPosition.position.x),
                Math.round(player.movementPosition.position.y),
            );
            this.gameContext.beginPath();
            this.gameContext.arc(0, 0, player.radius, 0, 2 * Math.PI, false);
            this.gameContext.closePath();
            this.gameContext.fill();
            this.gameContext.stroke();

            this.gameContext.restore();

            if (GameConfigs.IS_DEBUG) {
                this.gameContext.save();
                this.gameContext.fillStyle = "red";
                this.gameContext.strokeStyle = "red";
                this.gameContext.translate(
                    Math.round(player.destinationPosition.position.x),
                    Math.round(player.destinationPosition.position.y),
                );
                this.gameContext.beginPath();
                this.gameContext.arc(0, 0, player.radius / 5, 0, 2 * Math.PI, false);
                this.gameContext.closePath();
                this.gameContext.fill();
                this.gameContext.stroke();

                this.gameContext.restore();
            }
        });
    }
}

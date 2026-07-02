import { AssetLoader } from "../../assets/AssetLoader";
import { Player } from "../../game/entities/Player";
import { PlayerStatus } from "../../game/enums/PlayerStatus";
import { GameWorld } from "../../game/world/GameWorld";
import { GameConfigs } from "../../utils/GameConfigs";
import { RenderInterface } from "../RenderInterface";

export class PlayerRender implements RenderInterface {
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
    private readonly starImage: HTMLImageElement;
    private readonly starMaxSize: number;
    private readonly startMaxDistance: number;

    public constructor(
        gameContext: CanvasRenderingContext2D,
        gameConfigs: GameConfigs,
        assetLoader: AssetLoader,
    ) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
        this.starImage = assetLoader.getImage("star.png");
        this.starMaxSize = this.gameConfigs.playerSizeWithoutBorder;
        this.startMaxDistance = this.starMaxSize * 5;
    }

    public render(gameWorld: GameWorld): void {
        gameWorld.players.forEach(player => {
            this.gameContext.save();

            const colorKey = `${player.side}-${player.colorIndex}`;
            const isStunned = player.playerStatus === PlayerStatus.STUNNED;
            let color = isStunned ? this.stunnedColor : this.colorMap.get(colorKey);
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

            const scale = player.getBouncingAmplitude();
            this.gameContext.scale(1 - scale, 1 + scale);

            this.gameContext.beginPath();
            this.gameContext.arc(0, 0, player.movementPosition.size, 0, 2 * Math.PI, false);
            this.gameContext.closePath();
            this.gameContext.fill();
            this.gameContext.stroke();

            this.gameContext.restore();

            if (isStunned) {
                this.renderStunnedStars(player);
            }
        });
    }

    private renderStunnedStars(player: Player): void {
        player.stunnedWrapper.stunnedStars.stars.forEach(star => {
            this.gameContext.save();
            const factor = star.getFactor();
            const x = star.position.x + Math.cos(star.direction) * (factor * this.startMaxDistance);
            const y = star.position.y + Math.sin(star.direction) * (factor * this.startMaxDistance);
            this.gameContext.translate(x, y);
            this.gameContext.rotate(star.angle);
            this.gameContext.globalAlpha = 1 - factor;
            this.gameContext.drawImage(
                this.starImage,
                -this.starMaxSize / 2,
                -this.starMaxSize / 2,
                this.starMaxSize,
                this.starMaxSize,
            );
            this.gameContext.restore();
        });
    }
}

import { Player } from "@/game/entities/Player";
import { PowerShotInterface } from "@/game/entities/powerShots/PowerShotInterface";
import { PlayerStatus } from "@/game/enums/PlayerStatus";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";

export class FirePowerShot implements PowerShotInterface {
    public readonly maxSize: number;
    public readonly minSize: number;
    private readonly maxIndex: number = 16;
    private readonly interval: number = 30;
    private lastAddedDeltaTime: number = this.interval;
    public flames: Array<FlameDto> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.maxSize = Math.round(gameConfigs.fieldHeight / 2);
        this.minSize = this.maxSize / 5;
    }

    public update(deltaMs: number, player: Player): void {
        for (let index = this.flames.length - 1; index >= 0; index--) {
            const flame = this.flames[index];
            flame.update(deltaMs);
            if (flame.isFinished()) {
                this.flames.splice(this.flames.indexOf(flame), 1);
            }
        }

        this.lastAddedDeltaTime += deltaMs;
        if (
            this.lastAddedDeltaTime >= this.interval &&
            player.powerShotWrapper.getPowerShot() &&
            player.colorIndex === 0 &&
            player.playerStatus === PlayerStatus.NORMAL
        ) {
            this.flames.push(
                new FlameDto(
                    new Point(
                        player.movementPosition.position.x,
                        player.movementPosition.position.y,
                    ),
                    Math.round(Math.random() * this.maxIndex),
                ),
            );
            this.lastAddedDeltaTime = 0;
        }
    }

    public shouldRender(_player: Player): boolean {
        return true;
    }
}

export class FlameDto {
    public duration: number = 0;
    private readonly maxDuration: number = 1000;

    public constructor(
        public readonly position: Point,
        public readonly index: number,
    ) {}

    public update(deltaMs: number): void {
        this.duration += deltaMs;
    }

    public getDurationFactor(): number {
        return this.duration / this.maxDuration;
    }

    public isFinished(): boolean {
        return this.duration >= this.maxDuration;
    }
}

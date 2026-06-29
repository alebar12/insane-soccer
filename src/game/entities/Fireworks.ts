import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../geometry/Point";

export class Fireworks {
    public static readonly animationTime: number = 5000;
    public static readonly singleDuration: number = 700;
    public static readonly maxLengthFactor: number = 0.3;
    public readonly lineWidth: number;
    private readonly colorOffset: number = 100;
    private readonly maxComponents: number = 20;
    private readonly minComponents: number = 20;
    private readonly interval: number = 100;
    private readonly numberOfFireworks: number = Math.round(
        Fireworks.animationTime / this.interval,
    );
    private readonly maxDistance: number;
    private readonly minDistance: number;
    private readonly gameConfigs: GameConfigs;
    public fireworks: Array<FireworkDto> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
        this.maxDistance = gameConfigs.playerSizeWithoutBorder * 7;
        this.minDistance = this.maxDistance / 5;
        this.lineWidth = Math.ceil(gameConfigs.playerSizeWithoutBorder / 12);
    }

    public initFireworks(): void {
        this.fireworks = [];
        for (var i = 0; i < this.numberOfFireworks; i++) {
            const red = this.getRandomColorValue();
            const green = this.getRandomColorValue();
            const blue = this.getRandomColorValue();
            const components_number =
                Math.random() * (this.maxComponents - this.minComponents) + this.minComponents;
            let components = [];

            for (var j = 0; j < components_number; j++) {
                const r = this.getColorValueWithOffset(red);
                const g = this.getColorValueWithOffset(green);
                const b = this.getColorValueWithOffset(blue);

                components.push(
                    new FireworkComponentDto(
                        "#" + r.toString(16) + g.toString(16) + b.toString(16),
                        Math.random() * Math.PI * 2,
                        Math.round(
                            Math.random() * (this.maxDistance - this.minDistance) +
                                this.minDistance,
                        ),
                    ),
                );
            }

            this.fireworks.push(
                new FireworkDto(
                    new Point(
                        this.gameConfigs.fieldXOffset + Math.random() * this.gameConfigs.fieldWidth,
                        this.gameConfigs.fieldHeight * Math.random(),
                    ),
                    -i * this.interval,
                    components,
                ),
            );
        }
    }

    public update(delta: number): void {
        this.fireworks.forEach(firework => {
            firework.startTime += delta;
        });
    }

    private getRandomColorValue(): number {
        return Math.round(Math.random() * 255);
    }

    private getColorValueWithOffset(coloValue: number): number {
        return Math.min(
            Math.max(
                coloValue +
                    Math.round(Math.random() * (this.colorOffset / 2) - this.colorOffset / 2),
                0,
            ),
            255,
        );
    }
}

export class FireworkDto {
    public constructor(
        public readonly position: Point,
        public startTime: number,
        public readonly components: Array<FireworkComponentDto> = [],
    ) {}

    public isFiring(): boolean {
        return this.startTime >= 0 && this.startTime <= Fireworks.singleDuration;
    }

    public getFactor(): number {
        return this.startTime >= Fireworks.singleDuration / 2
            ? (Fireworks.singleDuration - this.startTime) / (Fireworks.singleDuration / 2)
            : this.startTime / (Fireworks.singleDuration / 2);
    }

    public getTimeFactor(): number {
        return this.startTime / Fireworks.singleDuration;
    }
}

export class FireworkComponentDto {
    public constructor(
        public readonly color: string,
        public readonly angle: number,
        public readonly distance: number,
    ) {}
}

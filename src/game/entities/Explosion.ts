import { GameConfigs } from "../../utils/GameConfigs";
import { PowerShotType } from "../enums/PowerShotType";
import { Point } from "../geometry/Point";

export class Explosion {
    private readonly maxComponents: number = 40;
    private readonly minComponents: number = 20;
    private readonly maxTime: number = 1000;
    private readonly colorOffset: number = 80;
    public readonly maxDistance: number;
    public readonly maxSize: number;
    public position: Point = new Point(0, 0);
    public components: Array<ExplosionComponent> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.maxSize = gameConfigs.fieldHeight / 26;
        this.maxDistance = this.maxSize * 3;
    }

    public addExplosion(position: Point, powerShotType: PowerShotType): void {
        this.position = new Point(position.x, position.y);
        const numberOfComponents = Math.round(
            Math.random() * (this.maxComponents - this.minComponents) + this.minComponents,
        );
        this.components = [];

        for (let i = 0; i < numberOfComponents; i++) {
            const duration = Math.random() * this.maxTime;
            const angle = Math.random() * Math.PI * 2;

            const g = Math.round(Math.random() * this.colorOffset);
            let r, b;
            if (powerShotType === PowerShotType.FIRE) {
                r = 255 - Math.round(Math.random() * this.colorOffset);
                b = Math.round(Math.random() * this.colorOffset);
            } else {
                r = Math.round(Math.random() * this.colorOffset);
                b = 255 - Math.round(Math.random() * this.colorOffset);
            }
            const color =
                "#" +
                r.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                b.toString(16).padStart(2, "0");

            this.components.push(new ExplosionComponent(duration, angle, color));
        }
    }

    public update(delta: number): void {
        this.components.forEach(component => {
            component.update(delta);
        });
        this.components = this.components.filter(component => !component.isFinished());
    }
}

export class ExplosionComponent {
    private delta: number = 0;

    public constructor(
        public readonly duration: number,
        public readonly angle: number,
        public readonly color: string,
    ) {}

    public update(delta: number): void {
        this.delta += delta;
    }

    public isFinished(): boolean {
        return this.delta >= this.duration;
    }

    public getFactor(): number {
        return this.delta / this.duration;
    }
}

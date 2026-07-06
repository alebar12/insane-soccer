import { Point } from "../../geometry/Point";

export class StunnedStars {
    private readonly deltaBetweenStars: number = 200;
    private readonly angleStep: number = Math.PI / 800;
    public static readonly duration: number = 2000;
    public stars: Array<StarDto> = [];
    private starDelta: number = 0;

    public update(delta: number, position: Point): void {
        this.starDelta += delta;
        if (this.starDelta >= this.deltaBetweenStars) {
            this.stars.push(
                new StarDto(new Point(position.x, position.y), 0, Math.random() * 2 * Math.PI),
            );
            this.starDelta = 0;
        }

        this.stars.forEach((star, _index) => {
            star.update(delta);
            star.angle += this.angleStep * delta;
            if (star.getFactor() >= 1) {
                this.stars.splice(this.stars.indexOf(star), 1);
            }
        });
    }
}

export class StarDto {
    private duration: number = 0;

    public constructor(
        public readonly position: Point,
        public angle: number,
        public readonly direction: number,
    ) {}

    public update(delta: number): void {
        this.duration += delta;
    }

    public getFactor(): number {
        return this.duration / StunnedStars.duration;
    }
}

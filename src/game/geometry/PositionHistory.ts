import { Point } from "./Point";

export class PositionHistory {
    public positions: Array<HistoryPoint> = [];

    public constructor(public retentionTime: number) {}

    public addPosition(position: Point): void {
        this.positions.push(new HistoryPoint(position, 0));
    }

    public update(deltaMs: number) {
        this.positions.forEach(p => p.delta += deltaMs);
        this.positions = this.positions.filter(p => p.delta < this.retentionTime);
    }

    public getFactor(index: number): number {
        return this.positions[index].getFactor(this.retentionTime);
    }
}

export class HistoryPoint {
    public constructor(
        public position: Point,
        public delta: number,
    ) {}

    public getFactor(retentionTime: number): number {
        return this.delta / retentionTime;
    }
}

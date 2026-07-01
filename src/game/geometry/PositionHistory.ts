import { Point } from "./Point";

export class PositionHistory {
    public positions: Array<HistoryPoint> = [];

    public constructor(public retentionTime: number) {}

    public addPosition(position: Point): void {
        const now = Date.now();
        this.positions.push(new HistoryPoint(position, now));
        this.positions = this.positions.filter(p => now - p.timestamp < this.retentionTime);
    }
}

export class HistoryPoint {
    public constructor(
        public position: Point,
        public timestamp: number,
    ) {}
}

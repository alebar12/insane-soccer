import { Gate } from "@/game/entities/Gate";
import { beforeEach, describe, expect, it } from "vitest";

describe("Gate", () => {
    let gate: Gate;

    beforeEach(() => {
        gate = new Gate();
    });

    describe("update", () => {
        it("should open and close gate", () => {
            expect(gate.currentAngle).toBe(0);
            gate.update(100, true);
            expect(gate.currentAngle).toBeGreaterThan(0);
            gate.update(1000, true);
            expect(gate.currentAngle).toBe(Math.PI / 2);
            gate.update(100, false);
            expect(gate.currentAngle).toBeLessThan(Math.PI / 2);
            gate.update(1000, false);
            expect(gate.currentAngle).toBe(0);
        });
    });
});

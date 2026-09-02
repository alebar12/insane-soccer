import { CheckerSystem } from "@/game/systems/checkers/CheckerSystem";
import { CheckerStrategyInterface } from "@/game/systems/checkers/strategies/CheckerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { describe, expect, it, vi } from "vitest";

describe("CheckerSystem", () => {
    it("should apply only eligible strategies in registration order", () => {
        const eligible = { canBeApplied: vi.fn().mockReturnValue(true), apply: vi.fn() };
        const ineligible = { canBeApplied: vi.fn().mockReturnValue(false), apply: vi.fn() };
        const gameWorld = {} as GameWorld;

        new CheckerSystem([
            eligible as CheckerStrategyInterface,
            ineligible as CheckerStrategyInterface,
        ]).update(gameWorld, 16);

        expect(eligible.canBeApplied).toHaveBeenCalledWith(gameWorld);
        expect(eligible.apply).toHaveBeenCalledWith(gameWorld);
        expect(ineligible.apply).not.toHaveBeenCalled();
    });
});

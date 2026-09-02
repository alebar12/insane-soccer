import { GameWorld } from "@/game/world/GameWorld";
import { MainRender } from "@/rendering/MainRender";
import { RenderInterface } from "@/rendering/RenderInterface";
import { DomHandler } from "@/ui/DomHandler";
import { describe, expect, it, vi } from "vitest";

describe("MainRender", () => {
    it("should clear the game canvas before rendering every registered renderer", () => {
        const clearRect = vi.fn();
        const firstRender = { render: vi.fn() };
        const secondRender = { render: vi.fn() };
        const gameWorld = {} as GameWorld;
        const domHandler = {
            gameCanvas: { width: 600, height: 800 },
            gameContext: { clearRect },
        } as unknown as DomHandler;

        new MainRender(domHandler, [
            firstRender as RenderInterface,
            secondRender as RenderInterface,
        ]).render(gameWorld);

        expect(clearRect).toHaveBeenCalledWith(0, 0, 600, 800);
        expect(firstRender.render).toHaveBeenCalledWith(gameWorld);
        expect(secondRender.render).toHaveBeenCalledWith(gameWorld);
        expect(clearRect.mock.invocationCallOrder[0]).toBeLessThan(
            firstRender.render.mock.invocationCallOrder[0],
        );
    });
});

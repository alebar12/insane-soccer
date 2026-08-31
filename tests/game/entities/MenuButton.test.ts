import { MenuButton } from "@/game/entities/MenuButton";
import { Point } from "@/game/geometry/Point";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it } from "vitest";

describe("MenuButton", () => {
    const gameConfigs = new GameConfigs(600, 800);
    const imageRatio = 1.5;
    let menuButton: MenuButton;

    beforeEach(() => {
        menuButton = new MenuButton(gameConfigs, imageRatio);
    });

    it("should create menu button", () => {
        const dimension = menuButton.dimension;
        const ratio = dimension.width / dimension.height;
        expect(ratio).toBe(imageRatio);
    });

    it("should contain point", () => {
        const point = new Point(menuButton.position.x + 1, menuButton.position.y + 1);
        expect(menuButton.contains(point)).toBe(true);
    });

    it("should not contain point", () => {
        const point = new Point(
            menuButton.position.x + menuButton.dimension.width + 1,
            menuButton.position.y + menuButton.dimension.height + 1,
        );
        expect(menuButton.contains(point)).toBe(false);
    });

    it("should get transition time", () => {
        expect(menuButton.getTransitionTime()).toBe(100);
    });
});

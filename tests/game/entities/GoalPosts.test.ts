import { GoalPosts } from "@/game/entities/GoalPosts";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it } from "vitest";

describe("GoalPosts", () => {
    it("should create goal posts", () => {
        const gameConfigs = new GameConfigs(600, 800);
        const goalPosts = new GoalPosts(gameConfigs);
        expect(goalPosts.positions).toHaveLength(4);
        expect(goalPosts.radius).toBe(gameConfigs.goalPostRadius);
    });
});

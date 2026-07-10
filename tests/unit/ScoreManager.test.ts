import { beforeEach, describe, expect, it } from "vitest";
import { PlayerSide } from "../../src/game/enums/PlayerSide";
import { ScoreManager } from "../../src/game/managers/ScoreManager";

describe("ScoreManager", () => {
    let score: ScoreManager;

    beforeEach(() => {
        score = new ScoreManager();
    });

    describe("initial state", () => {
        it("should start with zero scores", () => {
            expect(score.leftScore).toBe(0);
            expect(score.rightScore).toBe(0);
        });

        it("should not be game over at start", () => {
            expect(score.isGameOver).toBe(false);
        });

        it("should return null winning side when game is not over", () => {
            expect(score.getWinningPlayerSide()).toBeNull();
        });
    });

    describe("increaseScore", () => {
        it("should increase left score when left side scores", () => {
            score.increaseScore(PlayerSide.LEFT);
            expect(score.leftScore).toBe(1);
            expect(score.rightScore).toBe(0);
        });

        it("should increase right score when right side scores", () => {
            score.increaseScore(PlayerSide.RIGHT);
            expect(score.leftScore).toBe(0);
            expect(score.rightScore).toBe(1);
        });
    });

    describe("getScoreAsArray", () => {
        it("should return a 4-digit array with left then right score", () => {
            score.increaseScore(PlayerSide.LEFT);
            score.increaseScore(PlayerSide.RIGHT);
            score.increaseScore(PlayerSide.RIGHT);
            expect(score.getScoreAsArray()).toEqual([0, 1, 0, 2]);
        });

        it("should pad single-digit scores with a leading zero", () => {
            expect(score.getScoreAsArray()).toEqual([0, 0, 0, 0]);
        });
    });

    describe("isGameOver", () => {
        it("should not be game over with 9 goals", () => {
            for (let i = 0; i < 9; i++) score.increaseScore(PlayerSide.LEFT);
            expect(score.isGameOver).toBe(false);
        });

        it("should be game over when left side reaches max score", () => {
            for (let i = 0; i < 10; i++) score.increaseScore(PlayerSide.LEFT);
            expect(score.isGameOver).toBe(true);
        });

        it("should return left as winning side at max score", () => {
            for (let i = 0; i < 10; i++) score.increaseScore(PlayerSide.LEFT);
            expect(score.getWinningPlayerSide()).toBe(PlayerSide.LEFT);
        });

        it("should return right as winning side at max score", () => {
            for (let i = 0; i < 10; i++) score.increaseScore(PlayerSide.RIGHT);
            expect(score.getWinningPlayerSide()).toBe(PlayerSide.RIGHT);
        });
    });

    describe("isSubstitutionTime", () => {
        it("should detect substitution time every 3 goals", () => {
            score.increaseScore(PlayerSide.LEFT);
            score.increaseScore(PlayerSide.LEFT);
            score.increaseScore(PlayerSide.RIGHT);
            expect(score.isSubstitutionTime()).toBe(true);
        });

        it("should not detect substitution time between milestones", () => {
            score.increaseScore(PlayerSide.LEFT);
            expect(score.isSubstitutionTime()).toBe(false);
        });

        it("should detect goal before substitution at total score 2", () => {
            score.increaseScore(PlayerSide.LEFT);
            score.increaseScore(PlayerSide.RIGHT);
            expect(score.isGoalBeforeSubstitution()).toBe(true);
        });
    });

    describe("shouldAnimateIndex", () => {
        it("should animate indices 0 and 1 (right score display) after right scores", () => {
            score.increaseScore(PlayerSide.RIGHT);
            expect(score.shouldAnimateIndex(0)).toBe(true);
            expect(score.shouldAnimateIndex(1)).toBe(true);
            expect(score.shouldAnimateIndex(2)).toBe(false);
        });

        it("should animate indices 2 and 3 (left score display) after left scores", () => {
            score.increaseScore(PlayerSide.LEFT);
            expect(score.shouldAnimateIndex(2)).toBe(true);
            expect(score.shouldAnimateIndex(3)).toBe(true);
            expect(score.shouldAnimateIndex(0)).toBe(false);
        });
    });

    describe("reset", () => {
        it("should reset both scores to zero", () => {
            score.increaseScore(PlayerSide.LEFT);
            score.increaseScore(PlayerSide.RIGHT);
            score.reset();
            expect(score.leftScore).toBe(0);
            expect(score.rightScore).toBe(0);
        });

        it("should clear game over state after reset", () => {
            for (let i = 0; i < 10; i++) score.increaseScore(PlayerSide.LEFT);
            score.reset();
            expect(score.isGameOver).toBe(false);
        });
    });
});

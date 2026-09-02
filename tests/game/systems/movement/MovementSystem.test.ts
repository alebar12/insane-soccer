import { MovementSystem } from "@/game/systems/movement/MovementSystem";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { describe, expect, it, vi } from "vitest";

describe("MovementSystem", () => {
    it("should process eligible strategies before updating players and ball", () => {
        const playerStrategy = { canBeApplied: vi.fn().mockReturnValue(true), apply: vi.fn() };
        const ignoredPlayerStrategy = {
            canBeApplied: vi.fn().mockReturnValue(false),
            apply: vi.fn(),
        };
        const ballStrategy = { canBeApplied: vi.fn().mockReturnValue(true), apply: vi.fn() };
        const player = {
            stunnedWrapper: { decrementStunnedValue: vi.fn() },
            updatePowerShot: vi.fn(),
            bounceWrapper: { update: vi.fn() },
            move: vi.fn(),
            movementPosition: { position: {} },
        };
        const ball = { updateTrajectory: vi.fn() };
        const gameWorld = { players: [player], ball } as unknown as GameWorld;

        new MovementSystem(
            [playerStrategy, ignoredPlayerStrategy] as PlayerStrategyInterface[],
            [ballStrategy] as BallStrategyInterface[],
        ).update(gameWorld, 16);

        expect(playerStrategy.apply).toHaveBeenCalledWith(player, gameWorld, 16);
        expect(ignoredPlayerStrategy.apply).not.toHaveBeenCalled();
        expect(player.stunnedWrapper.decrementStunnedValue).toHaveBeenCalledWith(
            16,
            player.movementPosition.position,
        );
        expect(player.updatePowerShot).toHaveBeenCalledWith(16);
        expect(player.bounceWrapper.update).toHaveBeenCalledWith(16);
        expect(player.move).toHaveBeenCalledWith(16);
        expect(ballStrategy.apply).toHaveBeenCalledWith(ball, gameWorld, 16);
        expect(ball.updateTrajectory).toHaveBeenCalledWith(16);
    });
});

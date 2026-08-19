import { SystemInterface } from "@/game/systems/SystemInterface";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { PlayerStrategyInterface } from "@/game/systems/movement/playersStrategies/PlayerStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class MovementSystem implements SystemInterface {
    public constructor(
        private playerStrategies: Array<PlayerStrategyInterface>,
        private ballStrategies: Array<BallStrategyInterface>,
    ) {}

    public update(gameWorld: GameWorld, deltaMs: number): void {
        this.updatePlayers(gameWorld, deltaMs);
        this.updateBall(gameWorld, deltaMs);
    }

    private updatePlayers(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.players.forEach(player => {
            this.playerStrategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.stunnedWrapper.decrementStunnedValue(deltaMs, player.movementPosition.position);
            player.updatePowerShot(deltaMs);
            player.bounceWrapper.update(deltaMs);
            player.move(deltaMs);
        });
    }

    private updateBall(gameWorld: GameWorld, deltaMs: number): void {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
        gameWorld.ball.updateTrajectory(deltaMs);
    }
}

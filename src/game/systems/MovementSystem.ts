import { GameConfigs } from "../../utils/GameConfigs";
import { GameWorld } from "../world/GameWorld";
import { AbstractMovementStrategy } from "./movementStrategies/AbstractMovementStrategy";
import { MenuMovementStrategy } from "./movementStrategies/MenuMovementStrategy";

export class MovementSystem {
    private strategies: Array<AbstractMovementStrategy> = [];

    public constructor(gameConfigs: GameConfigs) {
        this.strategies.push(new MenuMovementStrategy(gameConfigs));
    }

    public update(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.players.forEach(player => {
            this.strategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, deltaMs));
            player.move(deltaMs);
        });
    }
}

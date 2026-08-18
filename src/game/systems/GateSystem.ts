import { GameStatus } from "@/game/enums/GameStatus";
import { SystemInterface } from "@/game/systems/SystemInterface";
import { GameWorld } from "@/game/world/GameWorld";

export class GateSystem implements SystemInterface {
    public update(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.gates.update(
            deltaMs,
            gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITUTION,
        );
    }
}

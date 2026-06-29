import { GameStatus } from "../enums/GameStatus";
import { GameWorld } from "../world/GameWorld";
import { SystemInterface } from "./SystemInterface";

export class GateSystem implements SystemInterface {
    public update(gameWorld: GameWorld, deltaMs: number): void {
        gameWorld.gates.update(
            deltaMs,
            gameWorld.gameStatusManager.gameStatus === GameStatus.SUBSTITION,
        );
    }
}

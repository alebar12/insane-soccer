import { KeyboardInputManager } from "../../../input/KeyboardInputManager";
import { Player } from "../../entities/Player";
import { GameStatus } from "../../enums/GameStatus";
import { Keys, KeysDirection } from "../../enums/Keys";
import { GameWorld } from "../../world/GameWorld";
import { AbstractMovementStrategy } from "./AbstractPlayerMovementStrategy";

export class InputPlayerMovementStrategy extends AbstractMovementStrategy {
    private keyboardInputManager: KeyboardInputManager;

    public constructor(keyboardInputManager: KeyboardInputManager) {
        super();
        this.keyboardInputManager = keyboardInputManager;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute && !player.isCpu && gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING
        );
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        const horizontalKey = this.keyboardInputManager.getDirectionPressed(KeysDirection.HORIZONTAL);
        const verticalKey = this.keyboardInputManager.getDirectionPressed(KeysDirection.VERTICAL);

        player.movementPosition.speed.x = this.applyAxisMovement(
            player.movementPosition.speed.x,
            player.movementPosition.acceleration,
            deltaMs,
            horizontalKey,
            Keys.ARROW_LEFT,
            Keys.ARROW_RIGHT,
        );

        player.movementPosition.speed.y = this.applyAxisMovement(
            player.movementPosition.speed.y,
            player.movementPosition.acceleration,
            deltaMs,
            verticalKey,
            Keys.ARROW_UP,
            Keys.ARROW_DOWN,
        );

        player.movementPosition.adjustToMaxSpeed(player.currentMaxSpeed);
    }

    private applyAxisMovement(
        currentSpeed: number,
        acceleration: number,
        deltaMs: number,
        key: Keys | null,
        negativeKey: Keys,
        positiveKey: Keys,
    ): number {
        const delta = acceleration * deltaMs;
        if (key === negativeKey) return currentSpeed - delta;
        if (key === positiveKey) return currentSpeed + delta;
        return Math.sign(currentSpeed) * Math.max(Math.abs(currentSpeed) - delta, 0);
    }
}

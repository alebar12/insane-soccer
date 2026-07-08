import { KeyboardInputManager } from "../../../../input/KeyboardInputManager";
import { Player } from "../../../entities/Player";
import { GameStatus } from "../../../enums/GameStatus";
import { Keys, KeysDirection } from "../../../enums/Keys";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class PlayerInputStrategy implements PlayerStrategyInterface {
    private keyboardInputManager: KeyboardInputManager;

    public constructor(keyboardInputManager: KeyboardInputManager) {
        this.keyboardInputManager = keyboardInputManager;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            !player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus.NORMAL
        );
    }

    public apply(player: Player, _gameWorld: GameWorld, deltaMs: number): void {
        const horizontalKey = this.keyboardInputManager.getDirectionPressed(
            KeysDirection.HORIZONTAL,
        );
        const verticalKey = this.keyboardInputManager.getDirectionPressed(KeysDirection.VERTICAL);

        player.movementPosition.velocity.x = this.applyAxisMovement(
            player.movementPosition.velocity.x,
            player.movementPosition.acceleration,
            deltaMs,
            horizontalKey,
            Keys.ARROW_LEFT,
            Keys.ARROW_RIGHT,
        );

        player.movementPosition.velocity.y = this.applyAxisMovement(
            player.movementPosition.velocity.y,
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

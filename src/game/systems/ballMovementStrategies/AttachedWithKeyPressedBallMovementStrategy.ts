import { KeyboardInputManager } from "../../../input/KeyboardInputManager";
import { Ball } from "../../entities/Ball";
import { BallStatus } from "../../enums/BallStatus";
import { GameStatus } from "../../enums/GameStatus";
import { Keys } from "../../enums/Keys";
import { GameWorld } from "../../world/GameWorld";
import { AbstractBallMovementStrategy } from "./AbstractBallMovementStrategy";

export class AttachedWithKeyPressedBallMovementStrategy extends AbstractBallMovementStrategy {
    private readonly keyboardInputManager: KeyboardInputManager;

    public constructor(keyboardInputManager: KeyboardInputManager) {
        super();
        this.keyboardInputManager = keyboardInputManager;
    }

    public canBeApplied(ball: Ball, gameWorld: GameWorld): boolean {
        const player = ball.attachedPlayer;
        return (
            ball.ballStatus === BallStatus.ATTACHED &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player !== null &&
            !player.isCpu &&
            this.keyboardInputManager.isKeyPressed(Keys.SPACE)
        );
    }

    public apply(ball: Ball, _gameWorld: GameWorld, deltaMs: number): void {
        ball.detachFromPlayer();
        ball.move(deltaMs);
    }
}

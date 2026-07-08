import { KeyboardInputManager } from "../../../../input/KeyboardInputManager";
import { Ball } from "../../../entities/Ball";
import { BallStatus } from "../../../enums/BallStatus";
import { GameStatus } from "../../../enums/GameStatus";
import { Keys } from "../../../enums/Keys";
import { GameWorld } from "../../../world/GameWorld";
import { BallStrategyInterface } from "./BallStrategyInterface";

export class BallAttachedWithKeyPressedStrategy implements BallStrategyInterface {
    private readonly keyboardInputManager: KeyboardInputManager;

    public constructor(keyboardInputManager: KeyboardInputManager) {
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
        ball.kick();
        ball.move(deltaMs);
    }
}

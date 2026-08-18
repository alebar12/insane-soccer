import { Ball } from "@/game/entities/Ball";
import { BallStatus } from "@/game/enums/BallStatus";
import { GameStatus } from "@/game/enums/GameStatus";
import { Keys } from "@/game/enums/Keys";
import { BallStrategyInterface } from "@/game/systems/movement/ballStrategies/BallStrategyInterface";
import { GameWorld } from "@/game/world/GameWorld";
import { KeyboardInputManager } from "@/input/KeyboardInputManager";

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

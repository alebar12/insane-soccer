import { AiToolsWrapper } from "../../../../ai/AiToolsWrapper";
import { Player } from "../../../entities/Player";
import { CpuType } from "../../../enums/CpuType";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class AiCpuStrategy implements PlayerStrategyInterface {
    private readonly aiToolsWrapper: AiToolsWrapper;

    public constructor(aiToolsWrapper: AiToolsWrapper) {
        this.aiToolsWrapper = aiToolsWrapper;
    }

    public canBeApplied(player: Player, gameWorld: GameWorld): boolean {
        return (
            !player.isSubstitute &&
            player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus.NORMAL &&
            player.cpuType === CpuType.AI
        );
    }

    public apply(player: Player, gameWorld: GameWorld, deltaMs: number): void {
        const status = this.aiToolsWrapper.observationWrapper.extractObservation(gameWorld, player);
        const actions = this.aiToolsWrapper.inferenceWrapper.predict(status.toArray());

        let xAction = actions[0];
        /*if (player.side === PlayerSide.RIGHT) {
            xAction = 2 - xAction;
        }*/
        player.movementPosition.velocity.x = this.applyAxisMovement(
            player.movementPosition.velocity.x,
            player.movementPosition.acceleration,
            deltaMs,
            xAction,
        );

        player.movementPosition.velocity.y = this.applyAxisMovement(
            player.movementPosition.velocity.y,
            player.movementPosition.acceleration,
            deltaMs,
            actions[1],
        );

        player.movementPosition.adjustToMaxSpeed(player.currentMaxSpeed);

        const ball = gameWorld.ball;
        if (ball.attachedPlayer === player && actions[2] === 1) {
            gameWorld.ball.kick();
        }
    }

    private applyAxisMovement(
        currentSpeed: number,
        acceleration: number,
        deltaMs: number,
        action: number,
    ): number {
        const delta = acceleration * deltaMs;
        if (action === 0) return currentSpeed - delta;
        if (action === 2) return currentSpeed + delta;
        return Math.sign(currentSpeed) * Math.max(Math.abs(currentSpeed) - delta, 0);
    }
}

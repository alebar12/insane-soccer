import { InferenceWrapper } from "../../../../ai/InferenceWrapper";
import { ObservationWrapper } from "../../../../ai/ObservationWrapper";
import { GameConfigs } from "../../../../utils/GameConfigs";
import { Player } from "../../../entities/Player";
import { CpuType } from "../../../enums/CpuType";
import { GameStatus } from "../../../enums/GameStatus";
import { PlayerStatus } from "../../../enums/PlayerStatus";
import { GameWorld } from "../../../world/GameWorld";
import { PlayerStrategyInterface } from "./PlayerStrategyInterface";

export class AiCpuStrategy implements PlayerStrategyInterface {
    private readonly inferenceWrapper: InferenceWrapper = new InferenceWrapper();
    private readonly gameConfigs: GameConfigs;

    public constructor(gameConfigs: GameConfigs) {
        this.gameConfigs = gameConfigs;
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
        const observationWrapper = new ObservationWrapper(gameWorld, this.gameConfigs);
        const status = observationWrapper.extractObservation();
        const actions = this.inferenceWrapper.predict(status.toArray());

        player.movementPosition.velocity.x = this.applyAxisMovement(
            player.movementPosition.velocity.x,
            player.movementPosition.acceleration,
            deltaMs,
            actions[0],
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

import { Observation, ObservationWrapper } from "@/ai/ObservationWrapper";
import { Ball } from "@/game/entities/Ball";
import { Player } from "@/game/entities/Player";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { ScoreManager } from "@/game/managers/ScoreManager";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, test } from "vitest";

const defaultObservation = {
    player1X: 0,
    player1Y: 0,
    player1SpeedX: 0,
    player1SpeedY: 0,
    player1HasPowerShot: 0,
    player1IsStunned: 0,
    player2X: 0,
    player2Y: 0,
    player2SpeedX: 0,
    player2SpeedY: 0,
    player2HasPowerShot: 0,
    player2IsStunned: 0,
    ballX: 0,
    ballY: 0,
    ballSpeedX: 0,
    ballSpeedY: 0,
    ballAttachedPlayer: 0,
    ballHasPowerShot: 0,
    player1Color: 0,
    normalizedScorePlayer: 0,
    normalizedScoreOpponent: 0,
    scorePlayer: 0,
    scoreOpponent: 0,
};

function createObservation(overrides: Partial<typeof defaultObservation> = {}): Observation {
    const observation = { ...defaultObservation, ...overrides };
    return new Observation(
        observation.player1X,
        observation.player1Y,
        observation.player1SpeedX,
        observation.player1SpeedY,
        observation.player1HasPowerShot,
        observation.player1IsStunned,
        observation.player2X,
        observation.player2Y,
        observation.player2SpeedX,
        observation.player2SpeedY,
        observation.player2HasPowerShot,
        observation.player2IsStunned,
        observation.ballX,
        observation.ballY,
        observation.ballSpeedX,
        observation.ballSpeedY,
        observation.ballAttachedPlayer,
        observation.ballHasPowerShot,
        observation.player1Color,
        observation.normalizedScorePlayer,
        observation.normalizedScoreOpponent,
        observation.scorePlayer,
        observation.scoreOpponent,
    );
}

function createRewardContext(isKickDirectedToGoal = false): {
    gameWorld: GameWorld;
    refPlayer: Player;
} {
    const ball: Pick<Ball, "isKickDirectedToGoal"> = {
        isKickDirectedToGoal: () => isKickDirectedToGoal,
    };
    const gameWorld: Pick<GameWorld, "ball"> = { ball: ball as Ball };
    const refPlayer: Pick<Player, "side"> = { side: PlayerSide.LEFT };

    return { gameWorld: gameWorld as GameWorld, refPlayer: refPlayer as Player };
}

describe("ObservationWrapper", () => {
    let gameConfigs: GameConfigs;
    let observationWrapper: ObservationWrapper;

    beforeEach(() => {
        gameConfigs = new GameConfigs(400, 800);
        observationWrapper = new ObservationWrapper(gameConfigs);
    });

    describe("extractObservation", () => {
        it("should throw if other player not found", () => {
            const refPlayer = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            const fakeGameWorld: Pick<GameWorld, "players" | "ball"> = {
                players: [refPlayer],
                ball: new Ball(gameConfigs),
            };
            expect(() =>
                observationWrapper.extractObservation(fakeGameWorld as GameWorld, refPlayer),
            ).toThrow();
        });

        test.each([
            [PlayerSide.LEFT, PlayerSide.RIGHT],
            [PlayerSide.RIGHT, PlayerSide.LEFT],
        ])("should return an Observation", (player1Side, player2Side) => {
            const refPlayer = Player.createHumanPlayer(gameConfigs, player1Side);
            const otherPlayer = Player.createScriptedCpuPlayer(gameConfigs, player2Side);

            const scorePlayer = 1;
            const scoreCpu = 0;

            const fakeScoreManager: Pick<ScoreManager, "leftScore" | "rightScore" | "getMaxScore"> =
                {
                    leftScore: player1Side === PlayerSide.LEFT ? scorePlayer : scoreCpu,
                    rightScore: player1Side === PlayerSide.RIGHT ? scorePlayer : scoreCpu,
                    getMaxScore: () => 10,
                };

            const fakeGameWorld: Pick<GameWorld, "players" | "ball" | "score"> = {
                players: [refPlayer, otherPlayer],
                ball: new Ball(gameConfigs),
                score: fakeScoreManager as ScoreManager,
            };

            const observation = observationWrapper.extractObservation(
                fakeGameWorld as GameWorld,
                refPlayer,
            );
            expect(observation).toBeInstanceOf(Observation);
            expect(observation.scorePlayer).toBe(1);
            expect(observation.scoreOpponent).toBe(0);
            expect(observation.normalizedScorePlayer).toBe(0.1);
            expect(observation.normalizedScoreOpponent).toBe(0);
        });
    });

    describe("calculateReward", () => {
        it("nothing happens, should return penalty for position unchanged and step", () => {
            const previousStatus = createObservation();
            const currentStatus = createObservation();
            const { gameWorld, refPlayer } = createRewardContext();

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                gameWorld,
                refPlayer,
            );
            expect(reward).toBe(-0.03);
        });

        it("possession gained, should return 0.97", () => {
            const previousStatus = createObservation();
            const currentStatus = createObservation({ ballAttachedPlayer: 1 });
            const { gameWorld, refPlayer } = createRewardContext();

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                gameWorld,
                refPlayer,
            );
            expect(reward).toBe(0.97);
        });

        it("possession held, should return -0.025", () => {
            const previousStatus = createObservation({ ballAttachedPlayer: 1 });
            const currentStatus = createObservation({ ballAttachedPlayer: 1 });
            const { gameWorld, refPlayer } = createRewardContext();

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                gameWorld,
                refPlayer,
            );
            expect(reward).toBe(-0.025);
        });

        it("possession lost, should return -1.03", () => {
            const previousStatus = createObservation({ ballAttachedPlayer: 1 });
            const currentStatus = createObservation();
            const { gameWorld, refPlayer } = createRewardContext();

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                gameWorld,
                refPlayer,
            );
            expect(reward).toBe(-1.03);
        });

        test.each([
            [true, false, 1.97],
            [false, false, 0.47],
            [false, true, -0.53],
        ])(
            "ball kicked, is kicked to goal %j, is kicked on opposite side %j, expected reward %j",
            (isKickedToGoal, isKickedOnOppositeSide, expectedReward) => {
                const previousStatus = createObservation({ ballAttachedPlayer: 1 });
                const currentStatus = createObservation({
                    ballSpeedX: isKickedOnOppositeSide ? -0.5 : 0.5,
                });
                const { gameWorld, refPlayer } = createRewardContext(isKickedToGoal);

                const reward = observationWrapper.calculateReward(
                    previousStatus,
                    currentStatus,
                    true,
                    gameWorld,
                    refPlayer,
                );
                expect(reward).toBe(expectedReward);
            },
        );

        it("toArray should return an array with the correct order", () => {
            const status = createObservation();
            expect(status.toArray()).toEqual([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
        });
    });
});

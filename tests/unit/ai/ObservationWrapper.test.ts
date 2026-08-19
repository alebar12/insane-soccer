import { Observation, ObservationWrapper } from "@/ai/ObservationWrapper";
import { Ball } from "@/game/entities/Ball";
import { Player } from "@/game/entities/Player";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it, test } from "vitest";

describe("ObservationWrapper", () => {
    let gameConfigs: GameConfigs;
    let observationWrapper: ObservationWrapper;

    beforeEach(() => {
        gameConfigs = { fieldHeight: 800, fieldWidth: 400, fieldXOffset: 0 } as GameConfigs;
        observationWrapper = new ObservationWrapper(gameConfigs);
    });

    describe("extractObservation", () => {
        it("should throw if other player not found", () => {
            const refPlayer = Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT);
            const fakeGameWorld = {
                players: [refPlayer],
                ball: new Ball(gameConfigs),
            } as GameWorld;
            expect(() => observationWrapper.extractObservation(fakeGameWorld, refPlayer)).toThrow();
        });

        test.each([
            [PlayerSide.LEFT, PlayerSide.RIGHT],
            [PlayerSide.RIGHT, PlayerSide.LEFT],
        ])("should return an Observation", (player1Side, player2Side) => {
            const refPlayer = Player.createHumanPlayer(gameConfigs, player1Side);
            const otherPlayer = Player.createScriptedCpuPlayer(gameConfigs, player2Side);

            const scorePlayer = 1;
            const scoreCpu = 0;

            const fakeScoreManager = {
                leftScore: player1Side === PlayerSide.LEFT ? scorePlayer : scoreCpu,
                rightScore: player1Side === PlayerSide.RIGHT ? scorePlayer : scoreCpu,
                getMaxScore: () => 10,
            };

            const fakeGameWorld = {
                score: fakeScoreManager,
                players: [refPlayer, otherPlayer],
                ball: new Ball(gameConfigs),
            } as GameWorld;

            const observation = observationWrapper.extractObservation(fakeGameWorld, refPlayer);
            expect(observation).toBeInstanceOf(Observation);
            expect(observation.scorePlayer).toBe(1);
            expect(observation.scoreOpponent).toBe(0);
            expect(observation.normalizedScorePlayer).toBe(0.1);
            expect(observation.normalizedScoreOpponent).toBe(0);
        });
    });

    describe("calculateReward", () => {
        it("nothing happens, should return penalty for position unchanged and step", () => {
            const previousStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            );
            const currentStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            );

            const fakeGameWorld = {
                ball: { isKickDirectedToGoal: () => false },
            } as unknown as GameWorld;

            const fakePlayer = {
                side: PlayerSide.LEFT,
            } as Player;

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                fakeGameWorld,
                fakePlayer,
            );
            expect(reward).toBe(-0.03);
        });

        it("possession gained, should return 0.97", () => {
            const previousStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            );
            const currentStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
            );

            const fakeGameWorld = {
                ball: { isKickDirectedToGoal: () => false },
            } as unknown as GameWorld;

            const fakePlayer = {
                side: PlayerSide.LEFT,
            } as Player;

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                fakeGameWorld,
                fakePlayer,
            );
            expect(reward).toBe(0.97);
        });

        it("possession held, should return -0.025", () => {
            const previousStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
            );
            const currentStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
            );

            const fakeGameWorld = {
                ball: { isKickDirectedToGoal: () => false },
            } as unknown as GameWorld;

            const fakePlayer = {
                side: PlayerSide.LEFT,
            } as Player;

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                fakeGameWorld,
                fakePlayer,
            );
            expect(reward).toBe(-0.025);
        });

        it("possession lost, should return -1.03", () => {
            const previousStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
            );
            const currentStatus = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            );

            const fakeGameWorld = {
                ball: { isKickDirectedToGoal: () => false },
            } as unknown as GameWorld;

            const fakePlayer = {
                side: PlayerSide.LEFT,
            } as Player;

            const reward = observationWrapper.calculateReward(
                previousStatus,
                currentStatus,
                false,
                fakeGameWorld,
                fakePlayer,
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
                const previousStatus = new Observation(
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                );
                const currentStatus = new Observation(
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    isKickedOnOppositeSide ? -0.5 : 0.5,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                );

                const fakeGameWorld = {
                    ball: { isKickDirectedToGoal: () => isKickedToGoal },
                } as unknown as GameWorld;

                const fakePlayer = {
                    side: PlayerSide.LEFT,
                } as Player;

                const reward = observationWrapper.calculateReward(
                    previousStatus,
                    currentStatus,
                    true,
                    fakeGameWorld,
                    fakePlayer,
                );
                expect(reward).toBe(expectedReward);
            },
        );

        it("toArray should return an array with the correct order", () => {
            const status = new Observation(
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            );
            expect(status.toArray()).toEqual([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
        });
    });
});

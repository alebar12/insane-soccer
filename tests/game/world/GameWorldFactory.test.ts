import { Ball } from "@/game/entities/Ball";
import { Explosion } from "@/game/entities/Explosion";
import { Fireworks } from "@/game/entities/Fireworks";
import { Gate } from "@/game/entities/Gate";
import { GoalPosts } from "@/game/entities/GoalPosts";
import { MenuButton } from "@/game/entities/MenuButton";
import { CpuType } from "@/game/enums/CpuType";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { ScoreManager } from "@/game/managers/ScoreManager";
import { GameWorldFactory } from "@/game/world/GameWorldFactory";
import { GameConfigs } from "@/utils/GameConfigs";
import { beforeEach, describe, expect, it } from "vitest";

describe("GameWorldFactory", () => {
    let gameConfigs: GameConfigs;

    beforeEach(() => {
        gameConfigs = new GameConfigs(600, 800);
    });

    it("should create a playing world with a human and scripted CPU player", () => {
        const gameWorld = GameWorldFactory.createPlayingGameWorldWithScriptedCpu(gameConfigs, 2);

        expectPlayers(gameWorld, CpuType.SCRIPTED);
        expect(gameWorld.menuButton.dimension.width / gameWorld.menuButton.dimension.height).toBe(
            2,
        );
        expectWorldCollaborators(gameWorld);
    });

    it("should create a playing world with a human and AI CPU player", () => {
        const gameWorld = GameWorldFactory.createPlayingGameWorldWithAiCpu(gameConfigs, 1.5);

        expectPlayers(gameWorld, CpuType.AI);
        expect(gameWorld.menuButton.dimension.width / gameWorld.menuButton.dimension.height).toBe(
            1.5,
        );
        expectWorldCollaborators(gameWorld);
    });

    it("should create a reinforcement-learning world with the requested CPU speed", () => {
        const speedFactor = 0.5;
        const gameWorld = GameWorldFactory.createWorldForReinforcementLearning(
            gameConfigs,
            speedFactor,
        );
        const cpuPlayer = gameWorld.players.find(player => player.isCpu);

        expectPlayers(gameWorld, CpuType.SCRIPTED);
        expect(cpuPlayer?.normalMaxSpeed).toBeCloseTo(
            (gameConfigs.fieldHeight / 700) * 0.8 * speedFactor,
        );
        expect(gameWorld.menuButton.dimension.width).toBe(gameWorld.menuButton.dimension.height);
    });

    function expectPlayers(
        gameWorld: ReturnType<typeof GameWorldFactory.createPlayingGameWorldWithAiCpu>,
        cpuType: CpuType,
    ): void {
        expect(
            gameWorld.players.map(player => ({
                side: player.side,
                isCpu: player.isCpu,
                isSubstitute: player.isSubstitute,
                cpuType: player.cpuType,
                colorIndex: player.colorIndex,
            })),
        ).toEqual([
            {
                side: PlayerSide.LEFT,
                isCpu: false,
                isSubstitute: false,
                cpuType: null,
                colorIndex: 0,
            },
            { side: PlayerSide.RIGHT, isCpu: true, isSubstitute: false, cpuType, colorIndex: 0 },
            {
                side: PlayerSide.LEFT,
                isCpu: false,
                isSubstitute: true,
                cpuType: null,
                colorIndex: 1,
            },
            {
                side: PlayerSide.RIGHT,
                isCpu: false,
                isSubstitute: true,
                cpuType: null,
                colorIndex: 1,
            },
        ]);
    }

    function expectWorldCollaborators(
        gameWorld: ReturnType<typeof GameWorldFactory.createPlayingGameWorldWithAiCpu>,
    ): void {
        expect(gameWorld.goalPosts).toBeInstanceOf(GoalPosts);
        expect(gameWorld.ball).toBeInstanceOf(Ball);
        expect(gameWorld.fireworks).toBeInstanceOf(Fireworks);
        expect(gameWorld.gates).toBeInstanceOf(Gate);
        expect(gameWorld.explosion).toBeInstanceOf(Explosion);
        expect(gameWorld.menuButton).toBeInstanceOf(MenuButton);
        expect(gameWorld.gameStatusManager).toBeInstanceOf(GameStatusManager);
        expect(gameWorld.score).toBeInstanceOf(ScoreManager);
    }
});

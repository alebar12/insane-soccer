import { Ball } from "@/game/entities/Ball";
import { Explosion } from "@/game/entities/Explosion";
import { Fireworks } from "@/game/entities/Fireworks";
import { Gate } from "@/game/entities/Gate";
import { GoalPosts } from "@/game/entities/GoalPosts";
import { MenuButton } from "@/game/entities/MenuButton";
import { Player } from "@/game/entities/Player";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { ScoreManager } from "@/game/managers/ScoreManager";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import { EventBus } from "ts-bus";

export class GameWorldFactory {
    public static createPlayingGameWorldWithScriptedCpu(
        gameConfigs: GameConfigs,
        menuButtonImageRatio: number,
    ): GameWorld {
        return this.create(gameConfigs, menuButtonImageRatio, [
            Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT),
            Player.createScriptedCpuPlayer(gameConfigs, PlayerSide.RIGHT),
        ]);
    }

    public static createPlayingGameWorldWithAiCpu(
        gameConfigs: GameConfigs,
        menuButtonImageRatio: number,
    ): GameWorld {
        return this.create(gameConfigs, menuButtonImageRatio, [
            Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT),
            Player.createAiCpuPlayer(gameConfigs, PlayerSide.RIGHT),
        ]);
    }

    public static createWorldForReinforcementLearning(
        gameConfigs: GameConfigs,
        speedFactor: number,
    ): GameWorld {
        return this.create(gameConfigs, 1, [
            Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT),
            Player.createScriptedCpuPlayer(gameConfigs, PlayerSide.RIGHT, speedFactor),
        ]);
    }

    private static create(
        gameConfigs: GameConfigs,
        menuButtonImageRatio: number,
        players: Array<Player>,
    ): GameWorld {
        const bus = new EventBus();
        return new GameWorld(
            new GoalPosts(gameConfigs),
            [
                ...players,
                Player.createLeftSubstitutePlayer(gameConfigs),
                Player.createRightSubstitutePlayer(gameConfigs),
            ],
            new Ball(gameConfigs),
            new Fireworks(gameConfigs),
            new Gate(),
            new Explosion(gameConfigs),
            new MenuButton(gameConfigs, menuButtonImageRatio),
            new GameStatusManager(bus),
            new ScoreManager(),
            bus,
        );
    }
}

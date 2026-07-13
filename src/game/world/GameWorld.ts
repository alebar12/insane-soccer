import { EventBus } from "ts-bus";
import { EventBusUtilities } from "../../utils/EventBusUtilities";
import { GameConfigs } from "../../utils/GameConfigs";
import { Ball } from "../entities/Ball";
import { Explosion } from "../entities/Explosion";
import { Fireworks } from "../entities/Fireworks";
import { Gate } from "../entities/Gate";
import { GoalPosts } from "../entities/GoalPosts";
import { MenuButton } from "../entities/MenuButton";
import { Player } from "../entities/Player";
import { GameStatus } from "../enums/GameStatus";
import { PlayerSide } from "../enums/PlayerSide";
import { PowerShotType } from "../enums/PowerShotType";
import { GameStatusManager } from "../managers/GameStatusManager";
import { ScoreManager } from "../managers/ScoreManager";

export class GameWorld {
    public readonly goalPosts: GoalPosts;
    public readonly players: Array<Player> = [];
    public readonly ball: Ball;
    public readonly fireworks: Fireworks;
    public readonly gates: Gate;
    public readonly explosion: Explosion;
    public readonly menuButton: MenuButton;
    public readonly gameStatusManager: GameStatusManager;
    public readonly score: ScoreManager;

    private constructor(
        gameConfigs: GameConfigs,
        menuButtonImageRatio: number,
        players: Array<Player>,
    ) {
        this.goalPosts = new GoalPosts(gameConfigs);
        this.players.push(...players);
        this.players.push(Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player.createRightSubstitutePlayer(gameConfigs));
        this.ball = new Ball(gameConfigs);
        this.fireworks = new Fireworks(gameConfigs);
        this.explosion = new Explosion(gameConfigs);
        this.gates = new Gate();
        const bus = new EventBus();
        this.score = new ScoreManager();
        this.menuButton = new MenuButton(gameConfigs, menuButtonImageRatio);
        this.gameStatusManager = new GameStatusManager(bus);

        bus.subscribe(EventBusUtilities.statusChangedEvent, event => {
            if (event.payload === GameStatus.MENU) {
                this.resetEndGame();
            }
        });
    }

    public static createPlayingGameWorld(
        gameConfigs: GameConfigs,
        menuButtonImageRatio: number,
    ): GameWorld {
        const players = [
            Player.createHumanPlayer(gameConfigs, PlayerSide.LEFT),
            Player.createCpuPlayer(gameConfigs, PlayerSide.RIGHT),
        ];
        return new GameWorld(gameConfigs, menuButtonImageRatio, players);
    }

    public static createSimulatedGameWorld(gameConfigs: GameConfigs): GameWorld {
        const players = [
            Player.createCpuPlayer(gameConfigs, PlayerSide.LEFT),
            Player.createCpuPlayer(gameConfigs, PlayerSide.RIGHT),
        ];
        return new GameWorld(gameConfigs, 1, players);
    }

    public increaseScore(playerSide: PlayerSide): void {
        this.score.increaseScore(playerSide);
        if (this.score.isSubstitutionTime()) {
            this.gameStatusManager.changeStatus(GameStatus.SUBSTITUTION);
        } else {
            this.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        }
        this.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
                player.resetOnGoal();
                player.powerShotWrapper.updateScoredGoal(playerSide);
            });
        if (this.ball.ballPowerShot.isPowerShot) {
            this.explosion.addExplosion(
                this.ball.movementPosition.position,
                this.ball.ballPowerShot.getPowerShotType() ?? PowerShotType.FIRE,
            );
        }
        this.ball.resetOnGoal();

        if (this.score.isGameOver) {
            this.gameStatusManager.changeStatus(GameStatus.END_GAME);
            this.fireworks.initFireworks();
            this.gameStatusManager.scheduleStatusChange(Fireworks.animationTime, GameStatus.MENU);
            this.players.forEach(player => {
                player.powerShotWrapper.resetPowerShot();
            });
        }
    }

    public switchPlayerColor(playerSide: PlayerSide): void {
        this.players
            .filter(player => {
                return player.side === playerSide;
            })
            .forEach(player => player.switchColorIndex());
    }

    public update(delta: number): void {
        this.gameStatusManager.update(delta);
        this.fireworks.update(delta);
        this.explosion.update(delta);
        this.score.update(delta);
    }

    public resetEndGame(): void {
        this.players.forEach(player => player.resetOnGoal());
        this.ball.resetOnGoal();
        this.score.reset();
    }
}

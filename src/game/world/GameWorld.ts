import { Ball } from "@/game/entities/Ball";
import { Explosion } from "@/game/entities/Explosion";
import { Fireworks } from "@/game/entities/Fireworks";
import { Gate } from "@/game/entities/Gate";
import { GoalPosts } from "@/game/entities/GoalPosts";
import { MenuButton } from "@/game/entities/MenuButton";
import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { PlayerSide } from "@/game/enums/PlayerSide";
import { PowerShotType } from "@/game/enums/PowerShotType";
import { GameStatusManager } from "@/game/managers/GameStatusManager";
import { ScoreManager } from "@/game/managers/ScoreManager";
import { EventBusUtilities } from "@/utils/EventBusUtilities";
import { EventBus } from "ts-bus";

export class GameWorld {
    public constructor(
        public readonly goalPosts: GoalPosts,
        public readonly players: ReadonlyArray<Player>,
        public readonly ball: Ball,
        public readonly fireworks: Fireworks,
        public readonly gates: Gate,
        public readonly explosion: Explosion,
        public readonly menuButton: MenuButton,
        public readonly gameStatusManager: GameStatusManager,
        public readonly score: ScoreManager,
        bus: EventBus,
    ) {
        bus.subscribe(EventBusUtilities.statusChangedEvent, event => {
            if (event.payload === GameStatus.MENU) {
                this.resetEndGame();
            }
        });
    }

    public increaseScore(playerSide: PlayerSide): void {
        this.score.increaseScore(playerSide);
        if (this.score.isSubstitutionTime()) {
            this.gameStatusManager.changeStatus(GameStatus.SUBSTITUTION);
        } else {
            this.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        }

        const activePlayers = this.getActivePlayers();
        this.handleGoal(activePlayers, playerSide)

        if (this.score.isGameOver) {
            this.handleGameOver(activePlayers);
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
        this.players.forEach(player => {
            player.resetOnGoal();
        });
        this.ball.resetOnGoal();
        this.score.reset();
    }

    private getActivePlayers(): Array<Player> {
        return this.players.filter(player => !player.isSubstitute);
    }

    private handleGoal(activePlayers: Array<Player>, playerSide: PlayerSide): void {
        activePlayers.forEach(player => {
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
    }

    private handleGameOver(activePlayers: Array<Player>): void {
        this.gameStatusManager.changeStatus(GameStatus.END_GAME);
            this.fireworks.initFireworks();
            this.gameStatusManager.scheduleStatusChange(Fireworks.animationTime, GameStatus.MENU);
            activePlayers
                .forEach(player => {
                    player.powerShotWrapper.resetPowerShot();
                });
    }
}

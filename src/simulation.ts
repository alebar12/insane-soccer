import { GameStatus } from "./game/enums/GameStatus";
import { MainSystem } from "./game/systems/MainSystem";
import { GameWorld } from "./game/world/GameWorld";
import { GameConfigs } from "./utils/GameConfigs";

const gameConfigs = new GameConfigs(800, 550);
const gameWorld = GameWorld.createSimulaterGameWorld(gameConfigs);
const mainSystem = new MainSystem(gameConfigs);

gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
gameWorld.fireworks.reset();

const delta = 1000 / 60;
let frames = 0;
let totalTime = 0;
let totalTimePlaying = 0;
while (true) {
    if (gameWorld.gameStatusManager.gameStatus === GameStatus.PLAYING) {
        totalTimePlaying += delta;
    }
    frames++;
    totalTime += delta;
    gameWorld.update(delta);
    mainSystem.update(gameWorld, delta);
    if (gameWorld.score.isGameOver) {
        break;
    }
}
console.log(
    gameWorld.score.getScoreAsArray() +
        " " +
        frames +
        " " +
        totalTime / 1000 +
        " " +
        totalTimePlaying / 1000,
);

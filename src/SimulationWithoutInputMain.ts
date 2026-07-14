import { GameStatus } from "./game/enums/GameStatus";
import { MainSystem } from "./game/systems/MainSystem";
import { GameWorld } from "./game/world/GameWorld";
import { GameConfigs } from "./utils/GameConfigs";

const gameConfigs = new GameConfigs(800, 550);
let gameWorld = GameWorld.createSimulatedGameWorldWithScriptedCpu(gameConfigs);
const mainSystem = new MainSystem(gameConfigs);

gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
gameWorld.fireworks.reset();

const delta = 1000 / 60;
let frames = 0;
let startTime = Date.now();
while (true) {
    updateWorld(delta);
    frames++;
    if (gameWorld.score.isGameOver) {
        break;
    }
}
const duration = Date.now() - startTime;
console.log(
    gameWorld.score.getScoreAsArray() + " - frames: " + frames + " - duration: " + duration,
);

function updateWorld(delta: number): void {
    gameWorld.update(delta);
    mainSystem.update(gameWorld, delta);
}

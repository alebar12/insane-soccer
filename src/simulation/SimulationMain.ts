import * as readline from "readline";
import { GameStatus } from "../game/enums/GameStatus";
import { Keys } from "../game/enums/Keys";
import { MainSystem } from "../game/systems/MainSystem";
import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";
import { LearningRequest } from "./LearningRequest";
import { LearningResponse } from "./LearningResponse";
import { LearningWrapper } from "./LearningWrapper";

const gameConfigs = new GameConfigs(800, 550);
const gameWorld = GameWorld.createPlayingGameWorld(gameConfigs, 1);
const mainSystem = new MainSystem(gameConfigs);
const statusExtractor = new LearningWrapper(gameWorld, gameConfigs);

gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
gameWorld.fireworks.reset();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

rl.on("line", async line => {
    let response: LearningResponse = {
        status: [],
        isFinished: false,
        hasErrors: false,
        reward: 0,
    };
    const previousStatus = statusExtractor.extractStatus();
    try {
        const request: LearningRequest = JSON.parse(line);
        if (request.action === "reset") {
            gameWorld.resetEndGame();
            gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
        } else {
            processInput(request.inputs);
        }
    } catch (error) {
        response.hasErrors = true;
        console.log("error during input process", error);
    }

    const currentStatus = statusExtractor.extractStatus();
    const reward = statusExtractor.calculateReward(previousStatus, currentStatus);
    response.status = currentStatus.toArray();
    response.isFinished = gameWorld.score.isGameOver;
    response.reward = reward;
    process.stdout.write(JSON.stringify(response) + "\n");
});

function processInput(requestInputs: Array<number>): void {
    const delta = 1000 / 60;
    const keys = parseRequestToKeySet(requestInputs);
    mainSystem.forceKeyboardInput(keys);
    while (gameWorld.gameStatusManager.gameStatus !== GameStatus.PLAYING) {
        updateWorld(delta);
    }
    updateWorld(delta);
}

function parseRequestToKeySet(requestInputs: Array<number>): Set<Keys> {
    const keys = new Set<Keys>();
    if (requestInputs[0] === 0) {
        keys.add(Keys.ARROW_UP);
    } else if (requestInputs[0] === 2) {
        keys.add(Keys.ARROW_DOWN);
    }
    if (requestInputs[1] === 0) {
        keys.add(Keys.ARROW_LEFT);
    } else if (requestInputs[1] === 2) {
        keys.add(Keys.ARROW_RIGHT);
    }
    if (requestInputs[2] === 1) {
        keys.add(Keys.SPACE);
    }
    return keys;
}

function updateWorld(delta: number): void {
    gameWorld.update(delta);
    mainSystem.update(gameWorld, delta);
}

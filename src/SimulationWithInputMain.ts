import * as readline from "readline";
import { ObservationWrapper } from "./ai/ObservationWrapper";
import { Player } from "./game/entities/Player";
import { GameStatus } from "./game/enums/GameStatus";
import { Keys } from "./game/enums/Keys";
import { PlayerSide } from "./game/enums/PlayerSide";
import { MainSystem } from "./game/systems/MainSystem";
import { GameWorld } from "./game/world/GameWorld";
import { GameConfigs } from "./utils/GameConfigs";

const gameConfigs = new GameConfigs(800, 550);
const mainSystem = new MainSystem(gameConfigs);
const statusExtractor = new ObservationWrapper(gameConfigs);

let [gameWorld, refPlayer] = initGameWorldAndRefPlayer();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

let finishedGames = 0;
let gamesWon = 0;

rl.on("line", async line => {
    let response: LearningResponse = {
        status: [],
        isFinished: false,
        hasErrors: false,
        reward: 0,
        info: {
            score1: gameWorld.score.leftScore,
            score2: gameWorld.score.rightScore,
        },
    };
    const previousStatus = statusExtractor.extractObservation(gameWorld, refPlayer);
    try {
        const request: LearningRequest = JSON.parse(line);
        if (request.action === "reset") {
            [gameWorld, refPlayer] = initGameWorldAndRefPlayer();
        } else {
            processInput(request.inputs);
        }
    } catch (error) {
        response.hasErrors = true;
        console.log("error during input process", error);
    }

    const currentStatus = statusExtractor.extractObservation(gameWorld, refPlayer);
    const reward = statusExtractor.calculateReward(previousStatus, currentStatus);
    response.status = currentStatus.toArray();
    if (gameWorld.score.isGameOver) {
        finishedGames++;
        if (gameWorld.score.getWinningPlayerSide() === PlayerSide.LEFT) {
            gamesWon++;
        }
        response.isFinished = true;
        response.info = {
            finishedGames: finishedGames,
            gamesWon: gamesWon,
        };
    }

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

function initGameWorldAndRefPlayer(): [GameWorld, Player] {
    let gameWorld = GameWorld.createPlayingGameWorldWithScriptedCpu(gameConfigs, 1);
    gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
    gameWorld.fireworks.reset();
    let refPlayer = gameWorld.players.find(
        player => !player.isSubstitute && player.side === PlayerSide.LEFT,
    );
    if (refPlayer === undefined) {
        throw new Error("Ref player not found");
    }
    return [gameWorld, refPlayer];
}

export interface LearningRequest {
    action: string;
    inputs: Array<number>;
}

export interface LearningResponse {
    status: Array<number>;
    isFinished: boolean;
    hasErrors: boolean;
    reward: number;
    info: Record<string, unknown>;
}

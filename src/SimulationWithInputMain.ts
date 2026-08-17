import { AiToolsWrapper } from "@/ai/AiToolsWrapper";
import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { ObservationWrapper } from "@/ai/ObservationWrapper";
import { Player } from "@/game/entities/Player";
import { GameStatus } from "@/game/enums/GameStatus";
import { Keys } from "@/game/enums/Keys";
import { MainSystem } from "@/game/systems/MainSystem";
import { GameWorld } from "@/game/world/GameWorld";
import { GameConfigs } from "@/utils/GameConfigs";
import * as fs from "fs";
import * as readline from "readline";

const gameConfigs = new GameConfigs(800, 550);
const aiToolsWrapper = new AiToolsWrapper(
    new InferenceWrapper(),
    new ObservationWrapper(gameConfigs),
);
const mainSystem = new MainSystem(gameConfigs, aiToolsWrapper);
const statusExtractor = new ObservationWrapper(gameConfigs);
let positionsFileName = "positions-" + Date.now() + ".txt";
let savePositions = false;

let delta = 16;
let frameSkip = 4;

let [gameWorld, refPlayer] = initGameWorldAndRefPlayer(1);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

let gameTime = 0;

rl.on("line", async line => {
    gameTime += delta;
    let response: LearningResponse = {
        status: [],
        isFinished: false,
        hasErrors: false,
        reward: 0,
        info: {},
    };
    const previousStatus = statusExtractor.extractObservation(gameWorld, refPlayer);
    let kicked = false;
    try {
        const request: LearningRequest = JSON.parse(line);
        if (request.action === "reset") {
            [gameWorld, refPlayer] = initGameWorldAndRefPlayer(request.opponentSpeedFactor);
            gameTime = 0;
            positionsFileName = "positions-" + Date.now() + ".txt";
            savePositions = request.savePositions || false;
            delta = request.frameTime || 16;
            frameSkip = request.frameSkip || 4;
            const maxScore = request.maxScore || 10;
            gameWorld.score.forceMaxScore(maxScore);
        } else {
            kicked = processInput(request.inputs);
        }
    } catch (error) {
        response.hasErrors = true;
        console.log("error during input process", error);
    }

    const currentStatus = statusExtractor.extractObservation(gameWorld, refPlayer);
    const reward = statusExtractor.calculateReward(
        previousStatus,
        currentStatus,
        kicked,
        gameWorld,
        refPlayer,
    );

    response.status = currentStatus.toArray();
    response.info = {
        score1: gameWorld.score.leftScore,
        score2: gameWorld.score.rightScore,
        gameTime: gameTime,
    };

    if (gameWorld.score.isGameOver) {
        response.isFinished = true;
        response.info["won"] = gameWorld.score.getWinningPlayerSide() === refPlayer.side;
    }

    response.reward = reward;
    process.stdout.write(JSON.stringify(response) + "\n");
});

function processInput(requestInputs: Array<number>): boolean {
    const isBallAttached = gameWorld.ball.attachedPlayer === refPlayer;

    const keys = parseRequestToKeySet(requestInputs);
    mainSystem.forceKeyboardInput(keys);
    while (gameWorld.gameStatusManager.gameStatus !== GameStatus.PLAYING) {
        updateWorld(delta);
    }

    for (let i = 0; i < frameSkip; i++) {
        updateWorld(delta);
    }

    return isBallAttached && keys.has(Keys.SPACE);
}

function savePositionsToFile(): void {
    if (savePositions) {
        const players = gameWorld.players.filter(player => !player.isSubstitute);
        const ball = gameWorld.ball;
        const lineToSave =
            players[0].movementPosition.position.x +
            " " +
            players[0].movementPosition.position.y +
            " " +
            players[1].movementPosition.position.x +
            " " +
            players[1].movementPosition.position.y +
            " " +
            ball.movementPosition.position.x +
            " " +
            ball.movementPosition.position.y;
        fs.appendFileSync(positionsFileName, lineToSave + "\n");
    }
}

function parseRequestToKeySet(requestInputs: Array<number>): Set<Keys> {
    const keys = new Set<Keys>();
    if (requestInputs[0] === 0) {
        keys.add(Keys.ARROW_LEFT);
    } else if (requestInputs[0] === 2) {
        keys.add(Keys.ARROW_RIGHT);
    }
    if (requestInputs[1] === 0) {
        keys.add(Keys.ARROW_UP);
    } else if (requestInputs[1] === 2) {
        keys.add(Keys.ARROW_DOWN);
    }
    if (requestInputs[2] === 1) {
        keys.add(Keys.SPACE);
    }
    return keys;
}

function updateWorld(delta: number): void {
    savePositionsToFile();
    gameWorld.update(delta);
    mainSystem.update(gameWorld, delta);
}

function initGameWorldAndRefPlayer(speedFactor: number): [GameWorld, Player] {
    let gameWorld = GameWorld.createWorldForReinforcementLearning(gameConfigs, speedFactor);
    gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
    gameWorld.fireworks.reset();
    let refPlayer = gameWorld.players.find(player => !player.isSubstitute && !player.isCpu);
    if (refPlayer === undefined) {
        throw new Error("Ref player not found");
    }
    return [gameWorld, refPlayer];
}

export interface LearningRequest {
    action: string;
    opponentSpeedFactor: number;
    savePositions: boolean | undefined;
    inputs: Array<number>;
    frameTime: number;
    frameSkip: number;
    maxScore: number;
}

export interface LearningResponse {
    status: Array<number>;
    isFinished: boolean;
    hasErrors: boolean;
    reward: number;
    info: Record<string, unknown>;
}

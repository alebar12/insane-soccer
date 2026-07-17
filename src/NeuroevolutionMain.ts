import * as readline from "readline";
import { AiToolsWrapper } from "./ai/AiToolsWrapper";
import { InferenceWrapper } from "./ai/InferenceWrapper";
import { ObservationWrapper } from "./ai/ObservationWrapper";
import { GameStatus } from "./game/enums/GameStatus";
import { PlayerSide } from "./game/enums/PlayerSide";
import { MainSystem } from "./game/systems/MainSystem";
import { GameWorld } from "./game/world/GameWorld";
import { GameConfigs } from "./utils/GameConfigs";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

rl.on("line", async line => {
    const gameConfigs = new GameConfigs(800, 550);
    const aiToolsWrapper = new AiToolsWrapper(
        new InferenceWrapper(),
        new ObservationWrapper(gameConfigs),
    );
    if (line.trim() !== "") {
        aiToolsWrapper.inferenceWrapper.overrideModel(line);
    }
    let gameWorld = GameWorld.createWorldForNeuroevolution(gameConfigs);
    gameWorld.gameStatusManager.changeStatus(GameStatus.WAITING_BALL);
    const mainSystem = new MainSystem(gameConfigs, aiToolsWrapper);

    const delta = 1000 / 60;
    let frames = 0;
    let startTime = Date.now();
    const maxFrames = 50000;
    let framesWithBall = 0;

    //const players = gameWorld.players.filter(player => !player.isSubstitute);

    const ball = gameWorld.ball;
    const refPlayer = gameWorld.players.find(
        player => !player.isSubstitute && player.side === PlayerSide.RIGHT,
    );

    //fs.appendFileSync("history.txt", "---------------\n");

    while (true && frames < maxFrames) {
        gameWorld.update(delta);
        mainSystem.update(gameWorld, delta);
        frames++;
        if (gameWorld.score.isGameOver) {
            break;
        }

        if (ball.attachedPlayer === refPlayer) {
            framesWithBall++;
        }

        /*const lineToSave =
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
        fs.appendFileSync("history.txt", lineToSave + "\n");*/
    }
    //fs.appendFileSync("history.txt", "---------------\n");
    const duration = Date.now() - startTime;

    let response: LearningResponse = {
        scoreLeft: gameWorld.score.leftScore,
        scoreRight: gameWorld.score.rightScore,
        frames: frames,
        duration: duration,
        error: frames >= maxFrames,
        framesWithBall: framesWithBall,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
});

export interface LearningResponse {
    scoreLeft: number;
    scoreRight: number;
    frames: number;
    framesWithBall: number;
    duration: number;
    error: boolean;
}

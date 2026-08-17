import json
import os
import subprocess
import torch
from datetime import datetime

import numpy as np
import gymnasium as gym
from gymnasium import spaces

from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env


MODEL_PATH = "network"
TIMESTEPS_THIS_RUN = 1_000_000
FRAME_TIME = 16
FRAME_SKIP = 5
MAX_STEPS = (5 * 60 * 1000) / (FRAME_TIME * FRAME_SKIP)
OPPONENT_SPEED_FACTOR = 1
MAX_SCORE = 10
SAVE_POSITIONS = False


class MyEnv(gym.Env):
    metadata = {"render_modes": []}
    proc = None
    totalReset = 0
    totalGames = 0
    totalWins = 0
    gameFramesArray = []
    resetFramesArray = []
    gameFrames = 0
    lastGameTerminated = False
    model = None

    def __init__(self):
        super().__init__()

        self.observation_space = spaces.Box(
            low=-2.0,
            high=2.0,
            shape=(21,),
            dtype=np.float32
        )

        self.action_space = spaces.MultiDiscrete([3, 3, 2])

        self.step_count = 0

        self.proc = subprocess.Popen(["npx", 
            "ts-node", 
            "../src/SimulationWithInputMain.ts"], 
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        if self.step_count > 0 and not self.lastGameTerminated:
            self.resetFramesArray.append(self.gameFrames)

        self.step_count = 0
        self.gameFrames = 0
        self.lastGameTerminated = False

        self.proc.stdin.write(f"{json.dumps({\
            'action': 'reset', \
            'opponentSpeedFactor': OPPONENT_SPEED_FACTOR, \
            'savePositions': SAVE_POSITIONS, \
            'frameTime': FRAME_TIME, \
            'frameSkip': FRAME_SKIP, \
            'maxScore': MAX_SCORE \
        })}\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        response = json.loads(line)

        observation = np.array(response["status"], dtype=np.float32)
        info = {}
        print("restarted")
        self.totalReset += 1

        self.save_all()
        self.print_stats()

        return observation, info

    def step(self, action):

        self.step_count += 1
        self.gameFrames += 1

        action_list = [int(action)] if np.ndim(action) == 0 else [int(x) for x in action]
        self.proc.stdin.write(f"{json.dumps({'action': 'step', 'inputs': action_list})}\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        response = json.loads(line)
        #print(response)
        observation = np.array(response["status"], dtype=np.float32)
        reward = response["reward"]
        terminated = response["isFinished"]

        if self.step_count % 10000 == 0:
            print(response["info"])

        if terminated:
            print(response["info"])
            self.totalGames += 1
            if response["info"]["won"]:
                self.totalWins += 1
            self.gameFramesArray.append(self.gameFrames)
            self.lastGameTerminated = True
        truncated = self.step_count >= MAX_STEPS
        info = {}

        return observation, reward, terminated, truncated, info

    def set_model(self, model):
        self.model = model

    def dump_actor_weights(self, policy, path):
        activation_map = {
            torch.nn.ReLU: "relu",
            torch.nn.Tanh: "tanh",
            torch.nn.Sigmoid: "sigmoid",
        }

        layers = []
        modules = list(policy.mlp_extractor.policy_net.children())
        i = 0
        while i < len(modules):
            m = modules[i]
            if isinstance(m, torch.nn.Linear):
                activation = "linear"
                if i + 1 < len(modules) and type(modules[i + 1]) in activation_map:
                    activation = activation_map[type(modules[i + 1])]
                    i += 1
                layers.append({
                    "weights": m.weight.detach().cpu().numpy().tolist(),  # [out, in]
                    "biases": m.bias.detach().cpu().numpy().tolist(),
                    "activation": activation,
                })
            i += 1

        a = policy.action_net
        layers.append({
            "weights": a.weight.detach().cpu().numpy().tolist(),
            "biases": a.bias.detach().cpu().numpy().tolist(),
            "activation": "linear",
        })
        with open(path, "w") as f:
            json.dump({"layers": layers, "nvec": [3, 3, 2]}, f)

    def save_all(self):
        if self.model is None:
            return

        self.model.save(MODEL_PATH)
        policy = self.model.policy
        policy.set_training_mode(False)
        jsonPath = MODEL_PATH + ".json"
        self.dump_actor_weights(policy, jsonPath)
        print("Network saved")

    def print_stats(self):
        print(f"STATS - Total resets: {self.totalReset}, total games: {self.totalGames}, total wins: {self.totalWins}")



env = MyEnv()

check_env(env)

policy_kwargs = dict(
    net_arch=dict(
        pi=[32, 32],   # actor
        vf=[32, 32]    # critic
    )
)

if os.path.exists(MODEL_PATH + ".zip"):
    print("Loading existing model...")
    model = PPO.load(MODEL_PATH, env=env, device="cpu")
else:
    print("Creating new model...")
    model = PPO(
        policy="MlpPolicy",
        env=env,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        gamma=0.995,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,
        verbose=1,
        policy_kwargs=policy_kwargs,
        device="cpu",
    )

env.set_model(model)
model.learn(total_timesteps=TIMESTEPS_THIS_RUN)
env.save_all()
env.print_stats()
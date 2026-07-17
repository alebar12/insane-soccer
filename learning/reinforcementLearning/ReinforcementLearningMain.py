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


# =====================================================
# Ambiente di esempio
# =====================================================

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

    def __init__(self):
        super().__init__()

        self.observation_space = spaces.Box(
            low=-1.0,
            high=1.0,
            shape=(19,),
            dtype=np.float32
        )

        self.action_space = spaces.MultiDiscrete([3, 3, 2])

        self.max_steps = 25000
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

        self.proc.stdin.write(f"{json.dumps({'action': 'reset'})}\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        response = json.loads(line)

        observation = np.array(response["status"], dtype=np.float32)
        info = {}
        print("restarted")
        self.totalReset += 1

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
        if terminated:
            print(response["info"])
            self.totalGames += 1
            if response["info"]["won"]:
                self.totalWins += 1
            self.gameFramesArray.append(self.gameFrames)
            self.lastGameTerminated = True
        truncated = self.step_count >= self.max_steps
        info = {}

        return observation, reward, terminated, truncated, info


# =====================================================
# Creazione ambiente
# =====================================================

env = MyEnv()

check_env(env)

# =====================================================
# Architettura della rete neurale
# 16 -> 64 -> 64 -> Policy(3)
# =====================================================

policy_kwargs = dict(
    net_arch=dict(
        pi=[64, 64],   # actor
        vf=[64, 64]    # critic
    )
)

# =====================================================
# Training log
# =====================================================

log_path = "training_log.json"

def load_log():
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            return json.load(f)
    return {"total_timesteps": 0, "runs": 0, "history": [], "total_games": 0, "total_wins": 0, "total_resets": 0}

def save_log(log, timesteps_this_run, env):
    log["total_timesteps"] += timesteps_this_run
    log["total_games"] += env.totalGames
    log["total_wins"] += env.totalWins
    log["total_resets"] += env.totalReset
    log["runs"] += 1
    avg_frames_finished = sum(env.gameFramesArray) / len(env.gameFramesArray) if env.gameFramesArray else 0
    avg_frames_reset = sum(env.resetFramesArray) / len(env.resetFramesArray) if env.resetFramesArray else 0
    log["history"].append({
        "run": log["runs"],
        "date": datetime.now().isoformat(timespec="seconds"),
        "timesteps_this_run": timesteps_this_run,
        "total_timesteps": log["total_timesteps"],
        "games_this_run": env.totalGames,
        "wins_this_run": env.totalWins,
        "resets_this_run": env.totalReset,
        "total_games": log["total_games"],
        "total_wins": log["total_wins"],
        "total_resets": log["total_resets"],
        "avg_frames_per_finished_game": round(avg_frames_finished, 2),
        "avg_frames_per_reset_game": round(avg_frames_reset, 2),
        "finished_game_frames": env.gameFramesArray[:],
        "reset_game_frames": env.resetFramesArray[:],
    })
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)

training_log = load_log()
print(f"[LOG] Cumulative timesteps so far: {training_log['total_timesteps']:,} over {training_log['runs']} run(s) | total games: {training_log['total_games']:,}, total wins: {training_log['total_wins']:,}, total resets: {training_log['total_resets']:,}")

# =====================================================
# PPO
# =====================================================

model_path = "ppo_soccer_model"
TIMESTEPS_THIS_RUN = 100000

if os.path.exists(model_path + ".zip"):
    print("Loading existing model...")
    model = PPO.load(model_path, env=env)
else:
    print("Creating new model...")
    model = PPO(
        policy="MlpPolicy",
        env=env,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,
        verbose=1,
        policy_kwargs=policy_kwargs,
    )

# =====================================================
# Training
# =====================================================

model.learn(total_timesteps=TIMESTEPS_THIS_RUN)
model.save(model_path)

print(f"Total resets: {env.totalReset}, total games: {env.totalGames}, total wins: {env.totalWins}")
save_log(training_log, TIMESTEPS_THIS_RUN, env)
print(f"Model saved to {model_path}.zip")
print(f"[LOG] Total cumulative timesteps: {training_log['total_timesteps']:,} over {training_log['runs']} run(s) | total games: {training_log['total_games']:,}, total wins: {training_log['total_wins']:,}, total resets: {training_log['total_resets']:,}")

# =====================================================
# Export actor network weights to JSON (cross-language, sync-friendly)
# =====================================================

policy = model.policy
policy.set_training_mode(False)
jsonPath = "../src/ai/weights.json"

def dump_actor_weights(policy, path=jsonPath):
    layers = []
    for layer in policy.mlp_extractor.policy_net:
        if isinstance(layer, torch.nn.Linear):
            layers.append({
                "type": "linear",
                "weight": layer.weight.detach().cpu().numpy().tolist(),  # [out, in]
                "bias": layer.bias.detach().cpu().numpy().tolist(),
            })
        elif isinstance(layer, torch.nn.Tanh):
            layers.append({"type": "tanh"})
        elif isinstance(layer, torch.nn.ReLU):
            layers.append({"type": "relu"})
    a = policy.action_net
    layers.append({
        "type": "linear",
        "weight": a.weight.detach().cpu().numpy().tolist(),
        "bias": a.bias.detach().cpu().numpy().tolist(),
    })
    with open(path, "w") as f:
        json.dump({"layers": layers, "nvec": [3, 3, 2]}, f)

dump_actor_weights(policy)
print("Actor exported to ppo_actor_weights.json")


# =====================================================
# Test
# =====================================================

# obs, info = env.reset()

# for _ in range(20):

#     action, _ = model.predict(obs, deterministic=True)

#     print("Azione:", action)

#     obs, reward, terminated, truncated, info = env.step(action)

#     if terminated or truncated:
#         obs, info = env.reset()


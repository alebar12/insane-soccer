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

    def __init__(self):
        super().__init__()

        self.observation_space = spaces.Box(
            low=-1.0,
            high=1.0,
            shape=(19,),
            dtype=np.float32
        )

        self.action_space = spaces.MultiDiscrete([3, 3, 2])

        self.max_steps = 15000
        self.step_count = 0

        self.proc = subprocess.Popen(["npx", 
            "ts-node", 
            "../src/SimulationWithInputMain.ts"], 
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.step_count = 0

        self.proc.stdin.write(f"{json.dumps({'action': 'reset'})}\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        response = json.loads(line)

        observation = np.array(response["status"], dtype=np.float32)
        info = {}
        print("restarted")

        return observation, info

    def step(self, action):

        self.step_count += 1

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
        #print(response["info"])
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
    return {"total_timesteps": 0, "runs": 0, "history": []}

def save_log(log, timesteps_this_run):
    log["total_timesteps"] += timesteps_this_run
    log["runs"] += 1
    log["history"].append({
        "run": log["runs"],
        "date": datetime.now().isoformat(timespec="seconds"),
        "timesteps_this_run": timesteps_this_run,
        "total_timesteps": log["total_timesteps"],
    })
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)

training_log = load_log()
print(f"[LOG] Cumulative timesteps so far: {training_log['total_timesteps']:,} over {training_log['runs']} run(s)")

# =====================================================
# PPO
# =====================================================

model_path = "ppo_soccer_model"
TIMESTEPS_THIS_RUN = 50000

if os.path.exists(model_path + ".zip"):
    print("Loading existing model...")
    model = PPO.load(model_path, env=env)
else:
    print("Creating new model...")
    model = PPO(
        policy="MlpPolicy",
        env=env,
        learning_rate=3e-4,
        n_steps=1024,
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
save_log(training_log, TIMESTEPS_THIS_RUN)
print(f"Model saved to {model_path}.zip")
print(f"[LOG] Total cumulative timesteps: {training_log['total_timesteps']:,} over {training_log['runs']} run(s)")

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


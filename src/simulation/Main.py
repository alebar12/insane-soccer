import json
import subprocess
import torch

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
            shape=(21,),
            dtype=np.float32
        )

        self.action_space = spaces.MultiDiscrete([3, 3, 2])

        self.max_steps = 100
        self.step_count = 0

        self.proc = subprocess.Popen(["npx", 
            "ts-node", 
            "./SimulationMain.ts"], 
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

        return observation, info

    def step(self, action):

        self.step_count += 1

        action_list = [int(action)] if np.ndim(action) == 0 else [int(x) for x in action]
        self.proc.stdin.write(f"{json.dumps({'action': 'step', 'inputs': action_list})}\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        response = json.loads(line)
        observation = np.array(response["status"], dtype=np.float32)
        reward = response["reward"]
        terminated = response["isFinished"]
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
# PPO
# =====================================================

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

model.learn(total_timesteps=10000)

# =====================================================
# Salvataggio
# =====================================================
# model.save("ppo_model")

# =====================================================
# Export actor network to ONNX (cross-language)
# =====================================================

class ActorOnly(torch.nn.Module):
    """Wraps only the actor path of the SB3 PPO policy."""
    def __init__(self, policy):
        super().__init__()
        self.policy = policy

    def forward(self, obs: torch.Tensor) -> torch.Tensor:
        features = self.policy.extract_features(obs, self.policy.pi_features_extractor)
        latent_pi = self.policy.mlp_extractor.forward_actor(features)
        return self.policy.action_net(latent_pi)   # raw logits

policy = model.policy
policy.set_training_mode(False)

actor = ActorOnly(policy)
dummy_obs = torch.zeros(1, 21)   # batch=1, obs_size=21

torch.onnx.export(
    actor,
    dummy_obs,
    "ppo_actor.onnx",
    input_names=["obs"],
    output_names=["logits"],
    dynamic_axes={"obs": {0: "batch"}, "logits": {0: "batch"}},
    opset_version=11,
)
print("Actor exported to ppo_actor.onnx")


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


# to read from typescript
# npm install onnxruntime-node

# import * as ort from 'onnxruntime-node';
# const session = await ort.InferenceSession.create('./ppo_actor.onnx');
# const obs = new ort.Tensor('float32', new Float32Array(21), [1, 21]);
# const { logits } = await session.run({ obs });
# // split logits and argmax per head
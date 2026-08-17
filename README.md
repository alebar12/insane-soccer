# Insane Soccer 

![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white)
![Build](https://img.shields.io/badge/build-vite-646cff?logo=vite&logoColor=white)

![Typecheck](https://img.shields.io/endpoint?url=https://alebar12.github.io/insane-soccer/badges/typecheck-badge.json)
![Lint](https://img.shields.io/endpoint?url=https://alebar12.github.io/insane-soccer/badges/lint-badge.json)
![Semgrep](https://img.shields.io/endpoint?url=https://alebar12.github.io/insane-soccer/badges/semgrep-badge.json)

![Tests](https://img.shields.io/endpoint?url=https://alebar12.github.io/insane-soccer/badges/tests-badge.json)
![Tests coverage](https://img.shields.io/endpoint?url=https://alebar12.github.io/insane-soccer/badges/testscoverage-badge.json)

<p>
  <img src="public/favicon.png" alt="Insane Soccer icon" height="100"/>
  <img src="public/images/title.png" alt="Insane Soccer title" height="100"/>
</p>

## Screenshot

![Insane Soccer screenshot](meta/screenshots/insanesoccer1.png)

## Play

- [alebar12.github.io/insane-soccer/](https://alebar12.github.io/insane-soccer/)

## About

**Insane Soccer** is an open-source, browser-based HTML5 soccer game built entirely in **TypeScript**. Play 1-on-1 against a CPU opponent on a top-down pitch rendered through multiple HTML5 Canvas layers.

The game features:
- Fast-paced 1v1 soccer gameplay (player vs. CPU)
- A CPU opponent controlled by a neural network trained with reinforcement learning
- Power Shots
- Substitute players
- Goal celebrations with fireworks and explosions

## CPU AI

The CPU opponent it's a **neural network policy trained with reinforcement learning**, using a Python training pipeline that plays real games against the TypeScript game engine.

- **Algorithm**: PPO (Proximal Policy Optimization) via [Stable-Baselines3](https://github.com/DLR-RM/stable-baselines3), built on [PyTorch](https://pytorch.org/) and [Gymnasium](https://gymnasium.farama.org/).
- **Training environment**: [`learning/ReinforcementLearningMain.py`](learning/ReinforcementLearningMain.py) launches the actual game (`src/SimulationWithInputMain.ts`) as a headless subprocess, training directly against the real game logic.
- **Reward shaping**: goals scored/conceded, gaining/holding/losing ball possession, closing the distance to the ball, kicks aimed at the opponent's goal, and small penalties for idling/standing still.
- **Network architecture**: a compact MLP policy (two hidden layers of 32 units each).
- **Deployment**: once trained, the actor network's weights are exported to JSON and used to run pure client-side inference in the browser via [`src/ai/InferenceWrapper.ts`](src/ai/InferenceWrapper.ts).

### Retraining the AI

```bash
cd learning
pip install -r requirements.txt
python ReinforcementLearningMain.py
```

Training resumes from `network.zip` if present, plays games live against the TypeScript engine, and periodically saves the updated policy to `network.json` / `network.zip`.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 6.x |
| Bundler | Vite |
| CPU AI training | Python, PyTorch, Gymnasium, Stable-Baselines3 (PPO) |
| CPU AI inference | Hand-rolled TypeScript MLP forward pass (no runtime ML dependency) |

## How do I build and run this?

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended) with `npm`

### 1. Clone the repository

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

This starts the Vite dev server with HMR.
Open your browser at **http://localhost:5173** to play.

### 4. Production build

```bash
npm run build
```

The optimised bundle is written to the `dist/` folder.

### 5. Preview the production build

```bash
npm run preview
```

Serves the `dist/` folder locally so you can verify the production build before deploying.

## How do I play this?

1. Open the game in your browser.
2. Move your player to intercept the ball and kick it into the CPU's goal.
3. First player to reach 10 goals wins!

## Controls

| Key | Action |
|---|---|
| `↑` `↓` `←` `→` | Move player |
| `SPACE` | Shot |

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production bundle via Vite |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript type-check without emitting |
| `npm run lint` | ESLint check on `src/` |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format `src/**/*.ts` |
| `npm run format:check` | Prettier format check |

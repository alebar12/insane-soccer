import json

from evolution import Evolution
from environment import Environment

POPULATION = 50
GENERATIONS = 5
MUTATION_SIGMA = 0.1
MODEL_PATH = "best_brain.pt"

evolution = Evolution(POPULATION, MUTATION_SIGMA, MODEL_PATH)

env = Environment()
bestBrain = None

for generation in range(GENERATIONS):

    print(f"Generation {generation}")

    for genome in evolution.population:

        print(f"Playing genome {evolution.population.index(genome)}")
        genome.fitness = env.play(
            genome
        )

    evolution.population.sort(
        key=lambda g: g.fitness,
        reverse=True
    )

    print(
        "Best fitness:",
        evolution.population[0].fitness,
        " - Info: ",
        evolution.population[0].info
    )

    bestBrain = evolution.population[0].brain
    bestBrain.save(MODEL_PATH)
    jsonModel = bestBrain.export_as_json();
    with open("best_brain.json", "w") as f:
        json.dump(jsonModel, f)

    evolution.next_generation()
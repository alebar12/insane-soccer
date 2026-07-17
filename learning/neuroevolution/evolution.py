import copy
import random
import torch

from genome import Genome

class Evolution:

    def __init__(self,
                 population_size=100,
                 mutation_sigma=0.05,
                 path: str = None):

        self.population = [
            Genome(path)
            for _ in range(population_size)
        ]

        self.sigma = mutation_sigma

    def mutate(self, genome):

        child = copy.deepcopy(genome)

        with torch.no_grad():

            for p in child.brain.parameters():

                noise = torch.randn_like(p) * self.sigma

                p += noise

        return child

    def crossover(self, g1, g2):

        child = Genome()

        for cp, p1, p2 in zip(
            child.brain.parameters(),
            g1.brain.parameters(),
            g2.brain.parameters()
        ):

            mask = torch.rand_like(cp) > 0.5

            cp.data = torch.where(mask,
                                  p1.data,
                                  p2.data)

        return child

    def next_generation(self):

        self.population.sort(
            key=lambda g: g.fitness,
            reverse=True
        )

        elite = self.population[:5]

        new_population = []

        # mantieni i migliori
        for e in elite:
            new_population.append(copy.deepcopy(e))

        while len(new_population) < len(self.population):

            p1 = random.choice(elite)
            p2 = random.choice(elite)

            child = self.crossover(p1, p2)
            child = self.mutate(child)

            new_population.append(child)

        self.population = new_population
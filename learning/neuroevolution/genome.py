from brain import Brain

class Genome:

    def __init__(self, path: str = None):

        self.brain = Brain(path)

        self.fitness = 0

        self.info = {}
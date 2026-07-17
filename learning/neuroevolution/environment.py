from base64 import b64encode
import json
import subprocess

class Environment:

    proc = None

    def __init__(self):
        self.proc = subprocess.Popen(["npx", 
            "ts-node", 
            "../../src/NeuroevolutionMain.ts"], 
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def play(self, genome):

        brain = genome.brain
        network_weights = brain.export_as_json()
        base64Model = b64encode(json.dumps(network_weights).encode()).decode()

        tries = 3
        fitness = 0
        complete = 0
        infos = []
        for i in range(tries):
            self.proc.stdin.write(f"{base64Model}\n")
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
            response = json.loads(line)
            #print(response)
            if not response["error"]:
                complete += 1
                fitness += (response["scoreRight"] - response["scoreLeft"]) * 100 + response["framesWithBall"] / response["frames"] * 200;
                infos.append(response)

        if complete == 0:
            return -10000000
       
        fitness /= complete
        genome.info = infos

        return fitness
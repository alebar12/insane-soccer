import os
import torch
import torch.nn as nn

NVEC = [3, 3, 2]

class Brain(nn.Module):

    def __init__(self, path: str = None):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(19, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, sum(NVEC))
        )

        if path and os.path.isfile(path):
            self.load(path)

    def save(self, path: str):
        torch.save(self.state_dict(), path)

    def load(self, path: str):
        self.load_state_dict(torch.load(path, weights_only=True))

    def export_as_json(self):
        layers = []
        activation_map = {
            nn.ReLU: "relu",
            nn.Tanh: "tanh",
            nn.Sigmoid: "sigmoid",
        }

        modules = list(self.net.children())
        i = 0
        while i < len(modules):
            m = modules[i]
            if isinstance(m, nn.Linear):
                activation = "linear"
                if i + 1 < len(modules) and type(modules[i + 1]) in activation_map:
                    activation = activation_map[type(modules[i + 1])]
                    i += 1
                layers.append({
                    "weights": m.weight.detach().tolist(),
                    "biases": m.bias.detach().tolist(),
                    "activation": activation,
                })
            i += 1

        return {"layers": layers, "nvec": NVEC}


    def forward(self, x):
        return self.net(x)

    def action(self, state):

        x = torch.tensor(state, dtype=torch.float32)

        with torch.no_grad():
            y = self(x)

        actions = []
        offset = 0
        for n in NVEC:
            actions.append(torch.argmax(y[offset:offset + n]).item())
            offset += n
        return actions
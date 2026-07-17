type Layer = {
    weights: number[][];
    biases: number[];
    activation: "relu" | "tanh" | "sigmoid" | "linear";
};

type Model = {
    layers: Layer[];
    nvec: number[];
};

import modelData from "./weights.json";

export class InferenceWrapper {
    private model: Model | null = null;

    public constructor() {
        this.model = modelData as unknown as Model;
    }

    public overrideModel(base64Model: string): void {
        const jsonModel = JSON.parse(atob(base64Model));
        this.model = jsonModel as Model;
    }

    public predict(obs: number[]): number[] {
        if (!this.model) throw new Error("Model not loaded. Call load() first.");

        let x = obs;
        for (const layer of this.model.layers) {
            x = this.linear(x, layer.weights, layer.biases);
            if (layer.activation === "relu") x = x.map(v => Math.max(0, v));
            else if (layer.activation === "tanh") x = x.map(Math.tanh);
            else if (layer.activation === "sigmoid") x = x.map(v => 1 / (1 + Math.exp(-v)));
        }

        const actions: number[] = [];
        let offset = 0;
        for (const n of this.model.nvec) {
            const slice = x.slice(offset, offset + n);
            actions.push(slice.indexOf(Math.max(...slice)));
            offset += n;
        }
        return actions;
    }

    private linear(x: number[], w: number[][], b: number[]): number[] {
        return w.map((row, i) => row.reduce((s, wij, j) => s + wij * x[j], b[i]));
    }
}

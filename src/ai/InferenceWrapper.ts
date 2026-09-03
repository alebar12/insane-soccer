export type InferenceLayer = {
    weights: number[][];
    biases: number[];
    activation: "relu" | "tanh" | "sigmoid" | "linear";
};

export type InferenceModel = {
    layers: InferenceLayer[];
    nvec: number[];
};

import modelData from "@/ai/weights.json";

export class InferenceWrapper {
    private readonly model: InferenceModel;

    public constructor(model: InferenceModel = modelData as unknown as InferenceModel) {
        this.model = model;
    }

    public predict(obs: number[]): number[] {
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

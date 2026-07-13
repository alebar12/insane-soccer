import model from "./ppo_actor_weights.json";

export class InferenceWrapper {
    public predict(obs: number[]): Array<number> {
        let x = obs;
        for (const l of model.layers) {
            if (l.type === "linear" && l.weight !== undefined && l.bias !== undefined)
                x = this.linear(x, l.weight, l.bias);
            else if (l.type === "tanh") x = x.map(Math.tanh);
            else if (l.type === "relu") x = x.map(v => Math.max(0, v));
        }

        const out: number[] = [];
        let off = 0;
        for (const n of model.nvec) {
            let best = off;
            for (let i = off; i < off + n; i++) if (x[i] > x[best]) best = i;
            out.push(best - off);
            off += n;
        }
        return out;
    }

    private linear(x: number[], w: number[][], b: number[]): number[] {
        return w.map((row, i) => row.reduce((s, wij, j) => s + wij * x[j], b[i]));
    }
}

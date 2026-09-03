import { InferenceModel, InferenceWrapper } from "@/ai/InferenceWrapper";
import { describe, expect, it } from "vitest";

describe("InferenceWrapper", () => {
    describe("predict", () => {
        it("should apply every supported activation and select the highest logit per action", () => {
            const model: InferenceModel = {
                layers: [
                    { activation: "relu", weights: [[1]], biases: [-2] },
                    { activation: "tanh", weights: [[1]], biases: [0] },
                    { activation: "sigmoid", weights: [[1]], biases: [0] },
                    {
                        activation: "linear",
                        weights: [[0], [0], [0], [0], [0], [0]],
                        biases: [0, 1, 2, 0, -1, 3],
                    },
                ],
                nvec: [2, 2, 2],
            };

            expect(new InferenceWrapper(model).predict([3])).toEqual([1, 0, 1]);
        });

        it("should return valid action indexes for the bundled model", () => {
            const actions = new InferenceWrapper().predict(Array<number>(21).fill(0));

            expect(actions).toHaveLength(3);
            expect(actions[0]).toBeGreaterThanOrEqual(0);
            expect(actions[0]).toBeLessThan(3);
            expect(actions[1]).toBeGreaterThanOrEqual(0);
            expect(actions[1]).toBeLessThan(3);
            expect(actions[2]).toBeGreaterThanOrEqual(0);
            expect(actions[2]).toBeLessThan(2);
        });
    });
});

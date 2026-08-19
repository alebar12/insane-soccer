import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { beforeEach, describe, expect, it } from "vitest";

describe("InferenceWrapper", () => {
    let inferenceWrapper: InferenceWrapper;

    beforeEach(() => {});

    describe("predict", () => {
        it("should return an array of actions", () => {
            inferenceWrapper = new InferenceWrapper();
            const actions = inferenceWrapper.predict([1, 2, 3]);
            expect(actions).toBeInstanceOf(Array);
            expect(actions).toHaveLength(3);
        });

        it("should override model and return an array of actions", () => {
            inferenceWrapper = new InferenceWrapper();

            const model = {
                layers: [
                    {
                        weights: [
                            [1, 2],
                            [1, 2],
                        ],
                        biases: [1, 2, 3],
                        activation: "tanh",
                    },
                    {
                        weights: [
                            [1, 2],
                            [1, 2],
                        ],
                        biases: [1, 2, 3],
                        activation: "tanh",
                    },
                    {
                        weights: [
                            [1, 2],
                            [1, 2],
                        ],
                        biases: [1, 2, 3],
                        activation: "linear",
                    },
                    {
                        weights: [
                            [1, 2],
                            [1, 2],
                        ],
                        biases: [1, 2, 3],
                        activation: "sigmoid",
                    },
                    {
                        weights: [
                            [1, 2],
                            [1, 2],
                        ],
                        biases: [1, 2, 3],
                        activation: "relu",
                    },
                ],
                nvec: [3, 3, 2],
            };

            inferenceWrapper.overrideModel(btoa(JSON.stringify(model)));

            const actions = inferenceWrapper.predict([1, 2, 3]);
            expect(actions).toBeInstanceOf(Array);
            expect(actions).toHaveLength(3);
        });
    });
});

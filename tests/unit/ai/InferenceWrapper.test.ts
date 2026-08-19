import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { beforeEach, describe, expect, it } from "vitest";

describe("InferenceWrapper", () => {
    let inferenceWrapper: InferenceWrapper;

    beforeEach(() => {});

    describe("predict", () => {
        it("should return an array of actions", () => {
            inferenceWrapper = new InferenceWrapper();
            const actions = inferenceWrapper.predict([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ]);
            expect(actions).toBeInstanceOf(Array);
            expect(actions).toHaveLength(3);
        });
    });
});

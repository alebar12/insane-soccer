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
    });
});

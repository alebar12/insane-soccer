import { InferenceWrapper } from "@/ai/InferenceWrapper";
import { ObservationWrapper } from "@/ai/ObservationWrapper";

export class AiToolsWrapper {
    public constructor(
        public inferenceWrapper: InferenceWrapper,
        public observationWrapper: ObservationWrapper,
    ) {}
}

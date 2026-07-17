import { InferenceWrapper } from "./InferenceWrapper";
import { ObservationWrapper } from "./ObservationWrapper";

export class AiToolsWrapper {
    public constructor(
        public inferenceWrapper: InferenceWrapper,
        public observationWrapper: ObservationWrapper,
    ) {}
}

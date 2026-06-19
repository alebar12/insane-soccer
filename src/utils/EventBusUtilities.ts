import { createEventDefinition } from "ts-bus";

export class EventBusUtilities {
    public static readonly statusSwitchedToWaitingBallEvent = createEventDefinition<void>()(
        "statusSwitchedToWaitingBall",
    );
}

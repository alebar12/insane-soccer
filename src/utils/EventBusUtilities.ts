import { createEventDefinition } from "ts-bus";
import { GameStatus } from "../game/enums/GameStatus";

export class EventBusUtilities {
    public static readonly statusChangedEvent =
        createEventDefinition<GameStatus>()("statusChanged");
}

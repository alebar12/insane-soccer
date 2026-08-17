import { GameStatus } from "@/game/enums/GameStatus";
import { createEventDefinition } from "ts-bus";

export class EventBusUtilities {
    public static readonly statusChangedEvent =
        createEventDefinition<GameStatus>()("statusChanged");
}

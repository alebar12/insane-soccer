import { Player } from "@/game/entities/Player";

export interface PowerShotInterface {
    update(deltaMs: number, player: Player): void;

    shouldRender(player: Player): boolean;
}

import { Player } from "../Player";

export interface PowerShotInterface {
    update(deltaMs: number, player: Player): void;

    shouldRender(player: Player): boolean;
}

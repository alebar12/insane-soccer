import { GameWorld } from "../game/world/GameWorld";
import { GameConfigs } from "../utils/GameConfigs";
import { FieldRender } from "./FieldRender";

export class MainRender {
    private fieldRender : FieldRender;

    public constructor(gameConfigs : GameConfigs, backgroundContext : CanvasRenderingContext2D) {
        this.fieldRender = new FieldRender(backgroundContext, gameConfigs);
    }

    public render (gameWorld : GameWorld) {
        this.fieldRender.render(gameWorld);
    }
}
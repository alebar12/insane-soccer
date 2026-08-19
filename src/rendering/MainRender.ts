import { GameWorld } from "@/game/world/GameWorld";
import { RenderInterface } from "@/rendering/RenderInterface";
import { DomHandler } from "@/ui/DomHandler";

export class MainRender {
    public constructor(
        private readonly domHandler: DomHandler,
        private readonly renders: Array<RenderInterface>,
    ) {}

    public render(gameWorld: GameWorld): void {
        this.clear();
        this.renders.forEach(render => render.render(gameWorld));
    }

    private clear(): void {
        this.domHandler.gameContext.clearRect(
            0,
            0,
            this.domHandler.gameCanvas.width,
            this.domHandler.gameCanvas.height,
        );
    }
}

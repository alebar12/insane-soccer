import { AssetLoader } from "@/assets/AssetLoader";
import { MainRender } from "@/rendering/MainRender";
import { MainRenderFactory } from "@/rendering/MainRenderFactory";
import { RenderInterface } from "@/rendering/RenderInterface";
import { BallRender } from "@/rendering/impl/BallRender";
import { BallTrajectoryRender } from "@/rendering/impl/BallTrajectoryRender";
import { ExplosionRender } from "@/rendering/impl/ExplosionRender";
import { FieldRender } from "@/rendering/impl/FieldRender";
import { FireworksRender } from "@/rendering/impl/FireworksRender";
import { GatesRender } from "@/rendering/impl/GatesRender";
import { MenuRender } from "@/rendering/impl/MenuRender";
import { PlayerPowerShotRender } from "@/rendering/impl/PlayerPowerShotRender";
import { PlayerRender } from "@/rendering/impl/PlayerRender";
import { ScoreRender } from "@/rendering/impl/ScoreRender";
import { DomHandler } from "@/ui/DomHandler";
import { GameConfigs } from "@/utils/GameConfigs";
import { describe, expect, it, vi } from "vitest";

interface MainRenderDependencies {
    renders: Array<RenderInterface>;
}

describe("MainRenderFactory", () => {
    it("should register renderers in visual layer order", () => {
        const canvas = { width: 600, height: 800 } as HTMLCanvasElement;
        const context = { canvas } as CanvasRenderingContext2D;
        const domHandler = {
            backgroundContext: context,
            gameContext: context,
            scoreContext: context,
            menuContext: context,
        } as DomHandler;
        const assetLoader = {
            getImage: vi.fn().mockReturnValue({ width: 100, height: 100 } as HTMLImageElement),
        } as unknown as AssetLoader;

        const mainRender = MainRenderFactory.create(
            new GameConfigs(600, 800),
            domHandler,
            assetLoader,
        );
        const dependencies = mainRender as unknown as MainRenderDependencies;

        expect(mainRender).toBeInstanceOf(MainRender);
        expect(dependencies.renders.map(render => render.constructor)).toEqual([
            FieldRender,
            BallTrajectoryRender,
            ScoreRender,
            GatesRender,
            PlayerRender,
            BallRender,
            ExplosionRender,
            MenuRender,
            PlayerPowerShotRender,
            FireworksRender,
        ]);
    });
});

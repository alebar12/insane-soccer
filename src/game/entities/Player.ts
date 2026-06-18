import { GameConfigs } from "../../utils/GameConfigs";
import { Point } from "../../utils/Point";
import { PlayerSide } from "../status/PlayerSide";

export class Player {
    public position: Point = new Point(0, 0);
    public initialPosition: Point = new Point(0, 0);
    public isCpu: boolean;
    public isSubstitute: boolean;
    public side: PlayerSide;
    public isStunned: boolean = false;
    public colorIndex: number = 0;
    public radius: number;

    private constructor(
        gameConfigs: GameConfigs,
        isCpu: boolean,
        isSubstitute: boolean,
        side: PlayerSide,
        colorIndex: number,
    ) {
        this.radius = gameConfigs.playerSizeWithBorder;
        this.isCpu = isCpu;
        this.isSubstitute = isSubstitute;
        this.side = side;
        this.colorIndex = colorIndex;
        this.calculateInitialPosition(gameConfigs);
    }

    public static createHumanPlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, false, PlayerSide.LEFT, 0);
    }

    public static createCpuPlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, true, false, PlayerSide.RIGHT, 0);
    }

    public static createLeftSubstitutePlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, true, PlayerSide.LEFT, 1);
    }

    public static createRightSubstitutePlayer(gameConfigs: GameConfigs): Player {
        return new Player(gameConfigs, false, true, PlayerSide.RIGHT, 1);
    }

    private calculateInitialPosition(gameConfigs: GameConfigs): void {
        let offsetX = 0;
        if (this.isSubstitute) {
            this.initialPosition.y = gameConfigs.substituteStartPositionYOffset;
            offsetX =
                this.side === PlayerSide.LEFT
                    ? gameConfigs.substitutionOffsetX
                    : gameConfigs.fieldWidth - gameConfigs.substitutionOffsetX;
        } else {
            this.initialPosition.y = gameConfigs.playerStartPositionYOffset;
            offsetX =
                this.side === PlayerSide.LEFT
                    ? gameConfigs.playerStartPositionXOffset
                    : gameConfigs.fieldWidth - gameConfigs.playerStartPositionXOffset;
        }

        this.initialPosition.x = gameConfigs.fieldXOffset + offsetX;

        this.position = this.initialPosition;
    }
}

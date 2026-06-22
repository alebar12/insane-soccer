/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/assets/AssetLoader.ts"
/*!***********************************!*\
  !*** ./src/assets/AssetLoader.ts ***!
  \***********************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssetLoader = void 0;
class AssetLoader {
    constructor() {
        this.IMAGE_FOLDER = "images/";
        this.IMAGE_NAMES = [
            "balls.png",
            "field.png",
            "track.jpg",
            "RedParticle.png",
            "digits.png",
            "goal_field.png",
            "star.png",
            "play.png",
        ];
        this.images = new Map();
    }
    async init() {
        await Promise.all(this.IMAGE_NAMES.map(fileName => this.loadImage(fileName, `${this.IMAGE_FOLDER}${fileName}`)));
    }
    getImage(imageName) {
        const image = this.images.get(imageName);
        if (image === undefined) {
            throw new Error(`${imageName} image not found`);
        }
        return image;
    }
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(name, img);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
}
exports.AssetLoader = AssetLoader;


/***/ },

/***/ "./src/core/GameLoop.ts"
/*!******************************!*\
  !*** ./src/core/GameLoop.ts ***!
  \******************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameLoop = void 0;
const MovementSystem_1 = __webpack_require__(/*! ../game/systems/MovementSystem */ "./src/game/systems/MovementSystem.ts");
const GameWorld_1 = __webpack_require__(/*! ../game/world/GameWorld */ "./src/game/world/GameWorld.ts");
const MouseInputManager_1 = __webpack_require__(/*! ../input/MouseInputManager */ "./src/input/MouseInputManager.ts");
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
const UIInteractionSystem_1 = __webpack_require__(/*! ../ui/UIInteractionSystem */ "./src/ui/UIInteractionSystem.ts");
const GameStatus_1 = __webpack_require__(/*! ../game/status/GameStatus */ "./src/game/status/GameStatus.ts");
const CollisionSystem_1 = __webpack_require__(/*! ../game/systems/CollisionSystem */ "./src/game/systems/CollisionSystem.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.delta = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld_1.GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem_1.UIInteractionSystem(new MouseInputManager_1.MouseInputManager(domHandler.menuCanvas));
        this.movementSystem = new MovementSystem_1.MovementSystem(gameConfigs);
        this.collisionSystem = new CollisionSystem_1.CollisionSystem(gameConfigs);
    }
    main() {
        const tick = (time) => {
            if (this.prevTime !== 0) {
                this.delta = time - this.prevTime;
                this.updateInputs(this.delta);
                this.update();
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    update() {
        this.gameWorld.gameStatusManager.update(this.delta);
        this.movementSystem.update(this.gameWorld, this.delta);
        this.collisionSystem.update(this.gameWorld);
    }
    updateInputs(deltaMs) {
        this.uiInteractionSystem.update(this.gameWorld.menuButton, () => {
            this.gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        }, deltaMs);
    }
    render() {
        this.mainRender.render(this.gameWorld);
    }
}
exports.GameLoop = GameLoop;


/***/ },

/***/ "./src/game/entities/Ball.ts"
/*!***********************************!*\
  !*** ./src/game/entities/Ball.ts ***!
  \***********************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Ball = void 0;
const MovementPoint_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../utils/MovementPoint'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class Ball {
    constructor(gameConfigs) {
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.isSetForStart = false;
        this.gameConfigs = gameConfigs;
        this.movementPosition.acceleration = gameConfigs.fieldHeight / 800000;
        this.movementPosition.size = gameConfigs.ballSizeWithBorder;
        this.maxSpeed = gameConfigs.fieldHeight / 400;
    }
    setForStartGame() {
        if (!this.isSetForStart) {
            this.movementPosition.position = new Point_1.Point(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2, this.gameConfigs.fieldBorderSize + this.movementPosition.size);
            const speed = Math.random() * (this.maxSpeed - this.maxSpeed / 3.33) + this.maxSpeed / 3.33;
            const angle = Math.PI / 2 + ((Math.random() * Math.PI) / 4.5 - Math.PI / 9);
            this.movementPosition.setSpeed(speed, angle);
            this.isSetForStart = true;
        }
    }
    move(deltaMs) {
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);
    }
}
exports.Ball = Ball;


/***/ },

/***/ "./src/game/entities/GoalPosts.ts"
/*!****************************************!*\
  !*** ./src/game/entities/GoalPosts.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoalPosts = void 0;
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class GoalPosts {
    constructor(gameConfigs) {
        this.positions = [];
        this.positions.push(new Point_1.Point(gameConfigs.fieldXOffset, gameConfigs.goalYOffset));
        this.positions.push(new Point_1.Point(gameConfigs.fieldXOffset, gameConfigs.goalYOffset + gameConfigs.goalHeight));
        this.positions.push(new Point_1.Point(gameConfigs.fieldXOffset + gameConfigs.fieldWidth, gameConfigs.goalYOffset));
        this.positions.push(new Point_1.Point(gameConfigs.fieldXOffset + gameConfigs.fieldWidth, gameConfigs.goalYOffset + gameConfigs.goalHeight));
        this.radius = gameConfigs.goalPostRadius;
    }
}
exports.GoalPosts = GoalPosts;


/***/ },

/***/ "./src/game/entities/HoverableEntity.ts"
/*!**********************************************!*\
  !*** ./src/game/entities/HoverableEntity.ts ***!
  \**********************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HoverableEntity = void 0;
class HoverableEntity {
    constructor() {
        this.hovered = false;
        this.hoverProgress = 0;
    }
}
exports.HoverableEntity = HoverableEntity;


/***/ },

/***/ "./src/game/entities/MenuButton.ts"
/*!*****************************************!*\
  !*** ./src/game/entities/MenuButton.ts ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuButton = void 0;
const Dimensions_1 = __webpack_require__(/*! ../geometry/Dimensions */ "./src/game/geometry/Dimensions.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
const HoverableEntity_1 = __webpack_require__(/*! ./HoverableEntity */ "./src/game/entities/HoverableEntity.ts");
class MenuButton extends HoverableEntity_1.HoverableEntity {
    constructor(gameConfigs, refWidth, refHeight) {
        super();
        const height = gameConfigs.fieldHeight / 5;
        this.dimension = new Dimensions_1.Dimensions(height * (refWidth / refHeight), height);
        this.position = new Point_1.Point(gameConfigs.fieldXOffset + (gameConfigs.fieldWidth - this.dimension.width) / 2, (gameConfigs.fieldHeight - this.dimension.height) / 2);
    }
    contains(point) {
        return (point.x >= this.position.x &&
            point.x <= this.position.x + this.dimension.width &&
            point.y >= this.position.y &&
            point.y <= this.position.y + this.dimension.height);
    }
    getTransitionTime() {
        return 100;
    }
}
exports.MenuButton = MenuButton;


/***/ },

/***/ "./src/game/entities/Player.ts"
/*!*************************************!*\
  !*** ./src/game/entities/Player.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Player = void 0;
const MovementPoint_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '../../utils/MovementPoint'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
const PlayerSide_1 = __webpack_require__(/*! ../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.currentMaxSpeed = 0;
        this.isStunned = false;
        this.colorIndex = 0;
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = gameConfigs.fieldHeight / 666;
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = gameConfigs.fieldHeight / 150000;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;
        this.movementPosition.size = gameConfigs.playerSizeWithBorder;
        this.isCpu = isCpu;
        this.isSubstitute = isSubstitute;
        this.side = side;
        this.colorIndex = colorIndex;
        this.initPositions(gameConfigs);
    }
    static createHumanPlayer(gameConfigs) {
        return new Player(gameConfigs, false, false, PlayerSide_1.PlayerSide.LEFT, 0);
    }
    static createCpuPlayer(gameConfigs) {
        return new Player(gameConfigs, true, false, PlayerSide_1.PlayerSide.RIGHT, 0);
    }
    static createLeftSubstitutePlayer(gameConfigs) {
        return new Player(gameConfigs, false, true, PlayerSide_1.PlayerSide.LEFT, 1);
    }
    static createRightSubstitutePlayer(gameConfigs) {
        return new Player(gameConfigs, false, true, PlayerSide_1.PlayerSide.RIGHT, 1);
    }
    reachedDestinationPosition() {
        return (Point_1.Point.getDistance(this.movementPosition.position, this.destinationPosition.position) <
            this.reachedDistanceTolerance);
    }
    move(deltaMs) {
        this.movementPosition.updatePosition(deltaMs);
    }
    adjustSpeedToDestinationPoint(deltaMs) {
        const projectedPosition = this.movementPosition.projectToFinalPosition();
        const angle = Point_1.Point.getAngleBetweenPoints(this.movementPosition.position, this.destinationPosition.position);
        if (Point_1.Point.getDistance(projectedPosition, this.destinationPosition.position) <
            this.reachedDistanceTolerance) {
            const currentSpeed = this.movementPosition.getSpeed();
            if (currentSpeed > 0) {
                const newSpeed = Math.max(currentSpeed - this.movementPosition.acceleration * deltaMs, 0);
                const ratio = newSpeed / currentSpeed;
                this.movementPosition.speed.x *= ratio;
                this.movementPosition.speed.y *= ratio;
            }
        }
        else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;
            let steerX = desiredSpeedX - this.movementPosition.speed.x;
            let steerY = desiredSpeedY - this.movementPosition.speed.y;
            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.movementPosition.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }
            this.movementPosition.speed.x += steerX;
            this.movementPosition.speed.y += steerY;
        }
        if (this.reachedDestinationPosition()) {
            this.movementPosition.speed = new Point_1.Point(0, 0);
            this.movementPosition.position = new Point_1.Point(this.destinationPosition.position.x, this.destinationPosition.position.y);
        }
        this.movementPosition.adjustToMaxSpeed(this.currentMaxSpeed);
    }
    resetToStartGame() {
        this.currentMaxSpeed = this.normalMaxSpeed;
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(this.initialPosition.x, this.initialPosition.y), new Point_1.Point(0, 0), 0, 0);
    }
    initPositions(gameConfigs) {
        let offsetX = 0;
        if (this.isSubstitute) {
            this.initialPosition.y = gameConfigs.substituteStartPositionYOffset;
            offsetX =
                this.side === PlayerSide_1.PlayerSide.LEFT
                    ? gameConfigs.substitutionOffsetX
                    : gameConfigs.fieldWidth - gameConfigs.substitutionOffsetX;
        }
        else {
            this.initialPosition.y = gameConfigs.playerStartPositionYOffset;
            offsetX =
                this.side === PlayerSide_1.PlayerSide.LEFT
                    ? gameConfigs.playerStartPositionXOffset
                    : gameConfigs.fieldWidth - gameConfigs.playerStartPositionXOffset;
        }
        this.initialPosition.x = gameConfigs.fieldXOffset + offsetX;
        this.movementPosition.position = new Point_1.Point(this.initialPosition.x, this.initialPosition.y);
        this.destinationPosition.position = new Point_1.Point(this.initialPosition.x, this.initialPosition.y);
    }
}
exports.Player = Player;


/***/ },

/***/ "./src/game/geometry/BorderLimits.ts"
/*!*******************************************!*\
  !*** ./src/game/geometry/BorderLimits.ts ***!
  \*******************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BorderLimits = void 0;
class BorderLimits {
    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
}
exports.BorderLimits = BorderLimits;


/***/ },

/***/ "./src/game/geometry/Dimensions.ts"
/*!*****************************************!*\
  !*** ./src/game/geometry/Dimensions.ts ***!
  \*****************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Dimensions = void 0;
class Dimensions {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}
exports.Dimensions = Dimensions;


/***/ },

/***/ "./src/game/geometry/Point.ts"
/*!************************************!*\
  !*** ./src/game/geometry/Point.ts ***!
  \************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Point = void 0;
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static getDistance(point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }
    static getAngleBetweenPoints(point1, point2) {
        return Math.atan2(point2.y - point1.y, point2.x - point1.x);
    }
}
exports.Point = Point;


/***/ },

/***/ "./src/game/managers/GameStatusManager.ts"
/*!************************************************!*\
  !*** ./src/game/managers/GameStatusManager.ts ***!
  \************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameStatusManager = void 0;
const GameStatus_1 = __webpack_require__(/*! ../status/GameStatus */ "./src/game/status/GameStatus.ts");
class GameStatusManager {
    constructor() {
        this._gameStatus = GameStatus_1.GameStatus.MENU;
        this.statusStartTime = 0;
        this.scheduledEvents = [];
        this.time = 0;
    }
    changeStatus(gameStatus) {
        this._gameStatus = gameStatus;
        this.statusStartTime = Date.now();
    }
    get gameStatus() {
        return this._gameStatus;
    }
    isStatusChangedRecently() {
        return Date.now() - this.statusStartTime < 1000;
    }
    scheduleStatusChange(delay, gameStatus) {
        const existingEvent = this.scheduledEvents.find(e => e.gameStatus === gameStatus);
        if (!existingEvent) {
            this.scheduledEvents.push({
                time: this.time + delay,
                gameStatus: gameStatus,
            });
        }
    }
    update(delta) {
        this.time += delta;
        for (const e of this.scheduledEvents) {
            if (this.time >= e.time) {
                this.changeStatus(e.gameStatus);
            }
        }
        this.scheduledEvents = this.scheduledEvents.filter(e => this.time < e.time);
    }
}
exports.GameStatusManager = GameStatusManager;


/***/ },

/***/ "./src/game/status/GameStatus.ts"
/*!***************************************!*\
  !*** ./src/game/status/GameStatus.ts ***!
  \***************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["MENU"] = "MENU";
    GameStatus["WAITING_BALL"] = "WAITING_BALL";
    GameStatus["PLAYING"] = "PLAYING";
})(GameStatus || (exports.GameStatus = GameStatus = {}));


/***/ },

/***/ "./src/game/status/PlayerSide.ts"
/*!***************************************!*\
  !*** ./src/game/status/PlayerSide.ts ***!
  \***************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerSide = void 0;
var PlayerSide;
(function (PlayerSide) {
    PlayerSide["LEFT"] = "LEFT";
    PlayerSide["RIGHT"] = "RIGHT";
})(PlayerSide || (exports.PlayerSide = PlayerSide = {}));


/***/ },

/***/ "./src/game/systems/CollisionSystem.ts"
/*!*********************************************!*\
  !*** ./src/game/systems/CollisionSystem.ts ***!
  \*********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CollisionSystem = void 0;
const BorderLimits_1 = __webpack_require__(/*! ../geometry/BorderLimits */ "./src/game/geometry/BorderLimits.ts");
class CollisionSystem {
    constructor(gameConfigs) {
        this.gameConfigs = gameConfigs;
    }
    update(gameWorld) {
        this.checkBallCollisions(gameWorld);
        //this.checkPlayerCollisions(gameWorld);
    }
    checkBallCollisions(gameWorld) {
        // TODO to add handleGoalPostsCollision
        this.handleBorderCollision(gameWorld.ball.movementPosition, this.getFieldBorderLimits(gameWorld.ball.movementPosition.size), true);
    }
    /*private checkPlayerCollisions(gameWorld: GameWorld): void {
        
    }*/
    getFieldBorderLimits(size) {
        const cfg = this.gameConfigs;
        return new BorderLimits_1.BorderLimits(cfg.fieldXOffset + size, cfg.fieldXOffset + cfg.fieldWidth - size, cfg.fieldBorderSize + size, cfg.fieldHeight - cfg.fieldBorderSize - size);
    }
    handleBorderCollision(movementPoint, borderLimits, invertSpeed) {
        if (movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            if (invertSpeed) {
                movementPoint.speed.x = Math.abs(movementPoint.speed.x);
            }
        }
        if (movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            if (invertSpeed) {
                movementPoint.speed.x = -Math.abs(movementPoint.speed.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            if (invertSpeed) {
                movementPoint.speed.y = Math.abs(movementPoint.speed.y);
            }
        }
        if (movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            if (invertSpeed) {
                movementPoint.speed.y = -Math.abs(movementPoint.speed.y);
            }
        }
    }
}
exports.CollisionSystem = CollisionSystem;


/***/ },

/***/ "./src/game/systems/MovementSystem.ts"
/*!********************************************!*\
  !*** ./src/game/systems/MovementSystem.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementSystem = void 0;
const GameStatus_1 = __webpack_require__(/*! ../status/GameStatus */ "./src/game/status/GameStatus.ts");
const MenuMovementStrategy_1 = __webpack_require__(/*! ./playersMovementStrategies/MenuMovementStrategy */ "./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts");
const WaitingBallMovementStrategy_1 = __webpack_require__(/*! ./playersMovementStrategies/WaitingBallMovementStrategy */ "./src/game/systems/playersMovementStrategies/WaitingBallMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs) {
        this.strategies = [];
        this.strategies.push(new MenuMovementStrategy_1.MenuMovementStrategy(gameConfigs));
        this.strategies.push(new WaitingBallMovementStrategy_1.WaitingBallMovementStrategy());
    }
    update(gameWorld, deltaMs) {
        this.updatePlayers(gameWorld, deltaMs);
        this.updateBall(gameWorld, deltaMs);
    }
    updatePlayers(gameWorld, deltaMs) {
        gameWorld.players.forEach(player => {
            this.strategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.move(deltaMs);
        });
    }
    updateBall(gameWorld, deltaMs) {
        switch (gameWorld.gameStatusManager.gameStatus) {
            case GameStatus_1.GameStatus.WAITING_BALL:
                gameWorld.ball.setForStartGame();
                break;
            case GameStatus_1.GameStatus.PLAYING:
                gameWorld.ball.move(deltaMs);
                break;
        }
    }
}
exports.MovementSystem = MovementSystem;


/***/ },

/***/ "./src/game/systems/playersMovementStrategies/AbstractPlayerMovementStrategy.ts"
/*!**************************************************************************************!*\
  !*** ./src/game/systems/playersMovementStrategies/AbstractPlayerMovementStrategy.ts ***!
  \**************************************************************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractMovementStrategy = void 0;
class AbstractMovementStrategy {
}
exports.AbstractMovementStrategy = AbstractMovementStrategy;


/***/ },

/***/ "./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuMovementStrategy = void 0;
const Point_1 = __webpack_require__(/*! ../../geometry/Point */ "./src/game/geometry/Point.ts");
const GameStatus_1 = __webpack_require__(/*! ../../status/GameStatus */ "./src/game/status/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
const AbstractPlayerMovementStrategy_1 = __webpack_require__(/*! ./AbstractPlayerMovementStrategy */ "./src/game/systems/playersMovementStrategies/AbstractPlayerMovementStrategy.ts");
class MenuMovementStrategy extends AbstractPlayerMovementStrategy_1.AbstractMovementStrategy {
    constructor(gameConfigs) {
        super();
        this.gameConfigs = gameConfigs;
    }
    canBeApplied(player, gameWorld) {
        return !player.isSubstitute && gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU;
    }
    apply(player, _gameWorld, deltaMs) {
        if (player.reachedDestinationPosition()) {
            player.destinationPosition.position.y =
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition.position.x =
                this.gameConfigs.fieldXOffset +
                    ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
            if (player.side === PlayerSide_1.PlayerSide.RIGHT) {
                player.destinationPosition.position.x += this.gameConfigs.fieldWidth / 2;
            }
            player.destinationPosition.speed = new Point_1.Point(0, 0);
            player.destinationPosition.acceleration = 0;
            player.currentMaxSpeed =
                (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}
exports.MenuMovementStrategy = MenuMovementStrategy;


/***/ },

/***/ "./src/game/systems/playersMovementStrategies/WaitingBallMovementStrategy.ts"
/*!***********************************************************************************!*\
  !*** ./src/game/systems/playersMovementStrategies/WaitingBallMovementStrategy.ts ***!
  \***********************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaitingBallMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../status/GameStatus */ "./src/game/status/GameStatus.ts");
const AbstractPlayerMovementStrategy_1 = __webpack_require__(/*! ./AbstractPlayerMovementStrategy */ "./src/game/systems/playersMovementStrategies/AbstractPlayerMovementStrategy.ts");
class WaitingBallMovementStrategy extends AbstractPlayerMovementStrategy_1.AbstractMovementStrategy {
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL);
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            player.resetToStartGame();
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
        if (player.reachedDestinationPosition()) {
            gameWorld.gameStatusManager.scheduleStatusChange(2000, GameStatus_1.GameStatus.PLAYING);
        }
    }
}
exports.WaitingBallMovementStrategy = WaitingBallMovementStrategy;


/***/ },

/***/ "./src/game/world/GameWorld.ts"
/*!*************************************!*\
  !*** ./src/game/world/GameWorld.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameWorld = void 0;
const Ball_1 = __webpack_require__(/*! ../entities/Ball */ "./src/game/entities/Ball.ts");
const GoalPosts_1 = __webpack_require__(/*! ../entities/GoalPosts */ "./src/game/entities/GoalPosts.ts");
const MenuButton_1 = __webpack_require__(/*! ../entities/MenuButton */ "./src/game/entities/MenuButton.ts");
const Player_1 = __webpack_require__(/*! ../entities/Player */ "./src/game/entities/Player.ts");
const GameStatusManager_1 = __webpack_require__(/*! ../managers/GameStatusManager */ "./src/game/managers/GameStatusManager.ts");
class GameWorld {
    constructor(gameConfigs, assetLoader) {
        this.players = [];
        this.goalPosts = new GoalPosts_1.GoalPosts(gameConfigs);
        this.players.push(Player_1.Player.createHumanPlayer(gameConfigs));
        this.players.push(Player_1.Player.createCpuPlayer(gameConfigs));
        this.players.push(Player_1.Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player_1.Player.createRightSubstitutePlayer(gameConfigs));
        this.ball = new Ball_1.Ball(gameConfigs);
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton_1.MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager_1.GameStatusManager();
    }
}
exports.GameWorld = GameWorld;


/***/ },

/***/ "./src/input/MouseInputManager.ts"
/*!****************************************!*\
  !*** ./src/input/MouseInputManager.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MouseInputManager = void 0;
const Point_1 = __webpack_require__(/*! ../game/geometry/Point */ "./src/game/geometry/Point.ts");
class MouseInputManager {
    constructor(element) {
        this.mousePosition = new Point_1.Point(0, 0);
        this.isMousePressed = false;
        this.onMouseMove = (event) => {
            const rect = this.element.getBoundingClientRect();
            this.mousePosition = new Point_1.Point(event.clientX - rect.left, event.clientY - rect.top);
        };
        this.onClick = () => {
            this.isMousePressed = true;
        };
        this.element = element;
        element.addEventListener("mousemove", this.onMouseMove);
        element.addEventListener("click", this.onClick);
    }
    reset() {
        this.isMousePressed = false;
    }
}
exports.MouseInputManager = MouseInputManager;


/***/ },

/***/ "./src/rendering/BallRender.ts"
/*!*************************************!*\
  !*** ./src/rendering/BallRender.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallRender = void 0;
const GameStatus_1 = __webpack_require__(/*! ../game/status/GameStatus */ "./src/game/status/GameStatus.ts");
class BallRender {
    constructor(gameContext, gameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        this.gameContext.save();
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING) {
            this.gameContext.translate(gameWorld.ball.movementPosition.position.x, gameWorld.ball.movementPosition.position.y);
            this.gameContext.shadowColor = "#000000";
            this.gameContext.shadowOffsetX = this.gameConfigs.ballSizeWithoutBorder * 0.5;
            this.gameContext.shadowOffsetY = this.gameConfigs.ballSizeWithoutBorder * 0.5;
            this.gameContext.shadowBlur = this.gameConfigs.ballSizeWithoutBorder;
            this.gameContext.beginPath();
            this.gameContext.arc(0, 0, this.gameConfigs.ballSizeWithoutBorder, 0, 2 * Math.PI, false);
            this.gameContext.closePath();
            this.gameContext.fillStyle = "#FF3333";
            this.gameContext.fill();
            this.gameContext.lineWidth = this.gameConfigs.ballBorder;
            this.gameContext.strokeStyle = "#330000";
            this.gameContext.stroke();
        }
        this.gameContext.restore();
    }
}
exports.BallRender = BallRender;


/***/ },

/***/ "./src/rendering/FieldRender.ts"
/*!**************************************!*\
  !*** ./src/rendering/FieldRender.ts ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FieldRender = void 0;
class FieldRender {
    constructor(backgroundContext, gameConfigs, assetLoader) {
        this.alreadyRendered = false;
        this.fieldImage = assetLoader.getImage("field.png");
        this.goalImage = assetLoader.getImage("goal_field.png");
        this.trackFieldImage = assetLoader.getImage("track.jpg");
        this.backgroundContext = backgroundContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        if (this.alreadyRendered) {
            return;
        }
        this.backgroundContext.clearRect(0, 0, this.backgroundContext.canvas.width, this.backgroundContext.canvas.height);
        this.backgroundContext.save();
        this.renderBackground();
        this.renderAthleticTrack();
        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowBlur = this.gameConfigs.shadowBlur;
        this.renderBorder();
        this.renderGoalPosts(gameWorld);
        this.backgroundContext.restore();
        this.alreadyRendered = true;
    }
    renderBackground() {
        this.backgroundContext.drawImage(this.fieldImage, this.gameConfigs.fieldXOffset, 0, this.gameConfigs.fieldWidth, this.gameConfigs.fieldHeight);
        this.backgroundContext.drawImage(this.goalImage, 0, this.gameConfigs.goalYOffset, this.gameConfigs.fieldXOffset, this.gameConfigs.goalHeight);
        this.backgroundContext.drawImage(this.goalImage, this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset, this.gameConfigs.fieldXOffset, this.gameConfigs.goalHeight);
    }
    renderBorder() {
        this.backgroundContext.fillStyle = "#FFFFFF";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
        this.backgroundContext.beginPath();
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize, 0, this.gameConfigs.fieldWidth + this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldHeight, this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.fieldXOffset -
            this.gameConfigs.gatesLength / 2 +
            this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.playerSubstitutionX + this.gameConfigs.gatesLength / 2, this.gameConfigs.fieldHeight, this.gameConfigs.cpuSubstitutionX -
            this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.cpuSubstitutionX + this.gameConfigs.gatesLength / 2, this.gameConfigs.fieldHeight, this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.fieldXOffset -
            this.gameConfigs.gatesLength / 2, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize, -this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(-this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldXOffset + this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(-this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset + this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(0, this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalHeight + this.gameConfigs.fieldBorderSize * 2);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, -this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset + this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldXOffset, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset, this.gameConfigs.fieldBorderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset * 2 +
            this.gameConfigs.fieldWidth -
            this.gameConfigs.fieldBorderSize, this.gameConfigs.goalYOffset - this.gameConfigs.fieldBorderSize, this.gameConfigs.fieldBorderSize, this.gameConfigs.goalHeight + this.gameConfigs.fieldBorderSize * 2);
        this.backgroundContext.fill();
    }
    renderGoalPosts(gameWorld) {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
        gameWorld.goalPosts.positions.forEach(position => {
            this.backgroundContext.beginPath();
            this.backgroundContext.arc(position.x, position.y, gameWorld.goalPosts.radius, 0, 2 * Math.PI, false);
            this.backgroundContext.closePath();
            this.backgroundContext.fill();
            this.backgroundContext.stroke();
        });
    }
    renderAthleticTrack() {
        this.backgroundContext.drawImage(this.trackFieldImage, this.gameConfigs.fieldXOffset, this.gameConfigs.fieldHeight + this.gameConfigs.athleticTrackYOffset, this.gameConfigs.fieldWidth, this.gameConfigs.athleticTrackHeight);
    }
}
exports.FieldRender = FieldRender;


/***/ },

/***/ "./src/rendering/GatesRender.ts"
/*!**************************************!*\
  !*** ./src/rendering/GatesRender.ts ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatesRender = void 0;
class GatesRender {
    constructor(gameContext, gameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render() {
        this.gameContext.save();
        this.gameContext.fillStyle = "#FF0000";
        this.gameContext.lineWidth = 1;
        this.gameContext.translate(this.gameConfigs.playerSubstitutionX - this.gameConfigs.gatesLength / 2, this.gameConfigs.fieldHeight);
        const angle = 0; // TODO da rivedere
        this.gameContext.rotate(angle);
        this.gameContext.fillRect(0, 0, this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.gameContext.strokeRect(0, 0, this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.gameContext.rotate(angle);
        this.gameContext.translate(this.gameConfigs.cpuSubstitutionX -
            this.gameConfigs.playerSubstitutionX +
            this.gameConfigs.gatesLength, -this.gameConfigs.fieldBorderSize);
        this.gameContext.rotate(Math.PI - angle);
        this.gameContext.fillRect(0, -this.gameConfigs.fieldBorderSize * 2, this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.gameContext.strokeRect(0, -this.gameConfigs.fieldBorderSize * 2, this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.gameContext.restore();
    }
}
exports.GatesRender = GatesRender;


/***/ },

/***/ "./src/rendering/MainRender.ts"
/*!*************************************!*\
  !*** ./src/rendering/MainRender.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MainRender = void 0;
const BallRender_1 = __webpack_require__(/*! ./BallRender */ "./src/rendering/BallRender.ts");
const FieldRender_1 = __webpack_require__(/*! ./FieldRender */ "./src/rendering/FieldRender.ts");
const GatesRender_1 = __webpack_require__(/*! ./GatesRender */ "./src/rendering/GatesRender.ts");
const MenuRender_1 = __webpack_require__(/*! ./MenuRender */ "./src/rendering/MenuRender.ts");
const PlayerRender_1 = __webpack_require__(/*! ./PlayerRender */ "./src/rendering/PlayerRender.ts");
const ScoreRender_1 = __webpack_require__(/*! ./ScoreRender */ "./src/rendering/ScoreRender.ts");
class MainRender {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.domHandler = domHandler;
        this.fieldRender = new FieldRender_1.FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader);
        this.scoreRender = new ScoreRender_1.ScoreRender(domHandler.scoreContext, assetLoader);
        this.gatesRender = new GatesRender_1.GatesRender(domHandler.gameContext, gameConfigs);
        this.playerRender = new PlayerRender_1.PlayerRender(domHandler.gameContext, gameConfigs);
        this.menuRender = new MenuRender_1.MenuRender(domHandler.menuContext, assetLoader);
        this.ballRender = new BallRender_1.BallRender(domHandler.gameContext, gameConfigs);
    }
    render(gameWorld) {
        this.clear();
        this.fieldRender.render(gameWorld);
        this.scoreRender.render();
        this.playerRender.render(gameWorld);
        this.ballRender.render(gameWorld);
        this.gatesRender.render();
        this.menuRender.render(gameWorld);
    }
    clear() {
        this.domHandler.gameContext.clearRect(0, 0, this.domHandler.gameCanvas.width, this.domHandler.gameCanvas.height);
    }
}
exports.MainRender = MainRender;


/***/ },

/***/ "./src/rendering/MenuRender.ts"
/*!*************************************!*\
  !*** ./src/rendering/MenuRender.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuRender = void 0;
const GameStatus_1 = __webpack_require__(/*! ../game/status/GameStatus */ "./src/game/status/GameStatus.ts");
class MenuRender {
    constructor(menuContext, assetLoader) {
        this.hoverFactor = 1.3;
        this.menuContext = menuContext;
        this.playImage = assetLoader.getImage("play.png");
    }
    render(gameWorld) {
        this.menuContext.clearRect(0, 0, this.menuContext.canvas.width, this.menuContext.canvas.height);
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU) {
            const scale = 1 + (this.hoverFactor - 1) * gameWorld.menuButton.hoverProgress;
            const width = gameWorld.menuButton.dimension.width * scale;
            const height = gameWorld.menuButton.dimension.height * scale;
            this.menuContext.drawImage(this.playImage, gameWorld.menuButton.position.x -
                (width - gameWorld.menuButton.dimension.width) / 2, gameWorld.menuButton.position.y -
                (height - gameWorld.menuButton.dimension.height) / 2, width, height);
        }
    }
}
exports.MenuRender = MenuRender;


/***/ },

/***/ "./src/rendering/PlayerRender.ts"
/*!***************************************!*\
  !*** ./src/rendering/PlayerRender.ts ***!
  \***************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerRender = void 0;
const GameConfigs_1 = __webpack_require__(/*! ../utils/GameConfigs */ "./src/utils/GameConfigs.ts");
class PlayerRender {
    constructor(gameContext, gameConfigs) {
        this.colorMap = new Map([
            ["LEFT-0", "#008000"],
            ["LEFT-1", "#338088"],
            ["RIGHT-0", "#FFA500"],
            ["RIGHT-1", "#FFFF00"],
        ]);
        this.stunnedColor = "#FFFFFF";
        this.borderColor = "#003300";
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        gameWorld.players.forEach(player => {
            this.gameContext.save();
            const colorKey = `${player.side}-${player.colorIndex}`;
            let color = player.isStunned ? this.stunnedColor : this.colorMap.get(colorKey);
            if (color === undefined) {
                color = "#FF0000";
            }
            this.gameContext.fillStyle = color;
            this.gameContext.strokeStyle = this.borderColor;
            this.gameContext.lineWidth = this.gameConfigs.playerBorder;
            this.gameContext.shadowColor = "#000000";
            this.gameContext.shadowOffsetX = this.gameConfigs.shadowOffset;
            this.gameContext.shadowOffsetY = this.gameConfigs.shadowOffset;
            this.gameContext.shadowBlur = this.gameConfigs.shadowBlur;
            this.gameContext.translate(Math.round(player.movementPosition.position.x), Math.round(player.movementPosition.position.y));
            this.gameContext.beginPath();
            this.gameContext.arc(0, 0, player.movementPosition.size, 0, 2 * Math.PI, false);
            this.gameContext.closePath();
            this.gameContext.fill();
            this.gameContext.stroke();
            this.gameContext.restore();
            if (GameConfigs_1.GameConfigs.IS_DEBUG) {
                this.gameContext.save();
                this.gameContext.fillStyle = "red";
                this.gameContext.strokeStyle = "red";
                this.gameContext.translate(Math.round(player.destinationPosition.position.x), Math.round(player.destinationPosition.position.y));
                this.gameContext.beginPath();
                this.gameContext.arc(0, 0, player.movementPosition.size / 5, 0, 2 * Math.PI, false);
                this.gameContext.closePath();
                this.gameContext.fill();
                this.gameContext.stroke();
                this.gameContext.restore();
            }
        });
    }
}
exports.PlayerRender = PlayerRender;


/***/ },

/***/ "./src/rendering/ScoreRender.ts"
/*!**************************************!*\
  !*** ./src/rendering/ScoreRender.ts ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreRender = void 0;
const Dimensions_1 = __webpack_require__(/*! ../game/geometry/Dimensions */ "./src/game/geometry/Dimensions.ts");
const Point_1 = __webpack_require__(/*! ../game/geometry/Point */ "./src/game/geometry/Point.ts");
class ScoreRender {
    constructor(scoreContext, assetLoader) {
        this.frameForNumber = 6;
        this.totalNumbers = 10;
        this.scoreContext = scoreContext;
        this.digitsImages = assetLoader.getImage("digits.png");
        this.innerImageDimensions = new Dimensions_1.Dimensions(this.digitsImages.width, this.digitsImages.height / (this.totalNumbers * this.frameForNumber));
        const scoreHeight = (scoreContext.canvas.height * 9) / 10;
        this.scoreDimensions = new Dimensions_1.Dimensions((scoreHeight * this.innerImageDimensions.width) / this.innerImageDimensions.height, scoreHeight);
        const yPosition = (scoreContext.canvas.height - this.scoreDimensions.height) / 2;
        this.positionArray = [
            new Point_1.Point(0, yPosition),
            new Point_1.Point(this.scoreDimensions.width, yPosition),
            new Point_1.Point(scoreContext.canvas.width - this.scoreDimensions.width * 2, yPosition),
            new Point_1.Point(scoreContext.canvas.width - this.scoreDimensions.width, yPosition),
        ];
    }
    render() {
        this.scoreContext.clearRect(0, 0, this.scoreContext.canvas.width, this.scoreContext.canvas.height);
        // TODO gestire aggiornamento punteggio
        this.positionArray.forEach(position => {
            this.scoreContext.drawImage(this.digitsImages, 0, this.innerImageDimensions.height * 0, this.innerImageDimensions.width, this.innerImageDimensions.height, position.x, position.y, this.scoreDimensions.width, this.scoreDimensions.height);
        });
    }
}
exports.ScoreRender = ScoreRender;


/***/ },

/***/ "./src/ui/UIInteractionSystem.ts"
/*!***************************************!*\
  !*** ./src/ui/UIInteractionSystem.ts ***!
  \***************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UIInteractionSystem = void 0;
class UIInteractionSystem {
    constructor(input) {
        this.input = input;
    }
    update(hoverable, onClick, deltaMs) {
        hoverable.hovered = hoverable.contains(this.input.mousePosition);
        if (hoverable.hovered && this.input.isMousePressed) {
            onClick();
            this.input.reset();
        }
        const step = (deltaMs / hoverable.getTransitionTime()) * (hoverable.hovered ? 1 : -1);
        hoverable.hoverProgress = Math.max(0, Math.min(1, hoverable.hoverProgress + step));
    }
}
exports.UIInteractionSystem = UIInteractionSystem;


/***/ },

/***/ "./src/utils/GameConfigs.ts"
/*!**********************************!*\
  !*** ./src/utils/GameConfigs.ts ***!
  \**********************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameConfigs = void 0;
class GameConfigs {
    constructor(canvasWidth, canvasHeight) {
        this.playerBorder = 2;
        this.ballBorder = 1;
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.fieldHeight = Math.round((this.height * 4.5) / 6);
        this.fieldXOffset = Math.round(this.width / 16);
        this.fieldWidth = Math.round(this.width - this.fieldXOffset * 2);
        this.goalHeight = Math.round(this.fieldHeight / 5);
        this.goalYOffset = Math.round((this.fieldHeight - this.goalHeight) / 2);
        this.goalPostRadius = Math.round(this.goalHeight / 20);
        this.athleticTrackHeight = Math.round(((this.height - this.fieldHeight) * 5) / 7);
        this.athleticTrackYOffset = Math.round((this.height - this.fieldHeight - this.athleticTrackHeight) / 2);
        this.playerSizeWithoutBorder = Math.floor(this.fieldHeight / 26);
        this.playerSizeWithBorder = this.playerSizeWithoutBorder + this.playerBorder;
        this.substitutionOffsetX = Math.round(this.fieldWidth / 4);
        this.playerSubstitutionX = this.fieldXOffset + this.substitutionOffsetX;
        this.cpuSubstitutionX = this.fieldXOffset + (this.fieldWidth - this.substitutionOffsetX);
        this.shadowBlur = this.playerSizeWithoutBorder;
        this.shadowOffset = this.playerSizeWithoutBorder * 0.3;
        this.fieldBorderSize = Math.round(this.fieldHeight / 100);
        this.playerStartPositionXOffset = this.fieldWidth / 8;
        this.playerStartPositionYOffset = this.fieldHeight / 2;
        this.substituteStartPositionYOffset =
            this.fieldHeight + this.athleticTrackYOffset + this.athleticTrackHeight / 2;
        this.gatesLength = this.playerSizeWithBorder * 3;
        this.ballSizeWithoutBorder = Math.round(this.fieldHeight / 80);
        this.ballSizeWithBorder = this.ballSizeWithoutBorder + this.ballBorder;
    }
}
exports.GameConfigs = GameConfigs;
GameConfigs.IS_DEBUG = true;


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const AssetLoader_1 = __webpack_require__(/*! ./assets/AssetLoader */ "./src/assets/AssetLoader.ts");
const GameLoop_1 = __webpack_require__(/*! ./core/GameLoop */ "./src/core/GameLoop.ts");
const DomHandler_1 = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './utils/DomHandler'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const GameConfigs_1 = __webpack_require__(/*! ./utils/GameConfigs */ "./src/utils/GameConfigs.ts");
class Main {
    async init() {
        const assetLoader = new AssetLoader_1.AssetLoader();
        await assetLoader.init();
        const domHandler = new DomHandler_1.DomHandler();
        const gameConfigs = new GameConfigs_1.GameConfigs(domHandler.backgroundCanvas.width, domHandler.backgroundCanvas.height);
        this.closeLoadingWindow();
        const gameLoop = new GameLoop_1.GameLoop(gameConfigs, domHandler, assetLoader);
        gameLoop.main();
    }
    closeLoadingWindow() {
        const element = document.getElementById("loadingDiv");
        if (!element) {
            return;
        }
        element.style.opacity = "0";
        element.addEventListener("transitionend", function onTransitionEnd() {
            element.style.display = "none";
            element.removeEventListener("transitionend", onTransitionEnd);
            //domHandler.menuCanvas.style.display = "block";
        }, { once: true });
    }
}
const main = new Main();
main.init();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7QUFDbkI7Ozs7Ozs7VUNuQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7Ozs7OztBQzVCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxzQkFBc0IsbUJBQU8sQ0FBQyx5REFBc0I7QUFDcEQsbUJBQW1CLG1CQUFPLENBQUMsK0NBQWlCO0FBQzVDLHFCQUFxQixtQkFBTyxDQUFDLGlKQUFvQjtBQUNqRCxzQkFBc0IsbUJBQU8sQ0FBQyx1REFBcUI7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsSUFBSSxZQUFZO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2Fzc2V0cy9Bc3NldExvYWRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvY29yZS9HYW1lTG9vcC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9CYWxsLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0dvYWxQb3N0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Ib3ZlcmFibGVFbnRpdHkudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvTWVudUJ1dHRvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9QbGF5ZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvQm9yZGVyTGltaXRzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3RhdHVzL1BsYXllclNpZGUudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9Db2xsaXNpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9Nb3ZlbWVudFN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL3BsYXllcnNNb3ZlbWVudFN0cmF0ZWdpZXMvQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvcGxheWVyc01vdmVtZW50U3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL3BsYXllcnNNb3ZlbWVudFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3dvcmxkL0dhbWVXb3JsZC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvTW91c2VJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9CYWxsUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvRmllbGRSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9HYXRlc1JlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01haW5SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NZW51UmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvUGxheWVyUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvU2NvcmVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3VpL1VJSW50ZXJhY3Rpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0dhbWVDb25maWdzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSB2b2lkIDA7XG5jbGFzcyBBc3NldExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuSU1BR0VfRk9MREVSID0gXCJpbWFnZXMvXCI7XG4gICAgICAgIHRoaXMuSU1BR0VfTkFNRVMgPSBbXG4gICAgICAgICAgICBcImJhbGxzLnBuZ1wiLFxuICAgICAgICAgICAgXCJmaWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwidHJhY2suanBnXCIsXG4gICAgICAgICAgICBcIlJlZFBhcnRpY2xlLnBuZ1wiLFxuICAgICAgICAgICAgXCJkaWdpdHMucG5nXCIsXG4gICAgICAgICAgICBcImdvYWxfZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInN0YXIucG5nXCIsXG4gICAgICAgICAgICBcInBsYXkucG5nXCIsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBnZXRJbWFnZShpbWFnZU5hbWUpIHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSB0aGlzLmltYWdlcy5nZXQoaW1hZ2VOYW1lKTtcbiAgICAgICAgaWYgKGltYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpbWFnZU5hbWV9IGltYWdlIG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9XG4gICAgbG9hZEltYWdlKG5hbWUsIHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChuYW1lLCBpbWcpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gQXNzZXRMb2FkZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUxvb3AgPSB2b2lkIDA7XG5jb25zdCBNb3ZlbWVudFN5c3RlbV8xID0gcmVxdWlyZShcIi4uL2dhbWUvc3lzdGVtcy9Nb3ZlbWVudFN5c3RlbVwiKTtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgTW91c2VJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlclwiKTtcbmNvbnN0IE1haW5SZW5kZXJfMSA9IHJlcXVpcmUoXCIuLi9yZW5kZXJpbmcvTWFpblJlbmRlclwiKTtcbmNvbnN0IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi91aS9VSUludGVyYWN0aW9uU3lzdGVtXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXNcIik7XG5jb25zdCBDb2xsaXNpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvQ29sbGlzaW9uU3lzdGVtXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmRlbHRhID0gMDtcbiAgICAgICAgdGhpcy5wcmV2VGltZSA9IDA7XG4gICAgICAgIHRoaXMubWFpblJlbmRlciA9IG5ldyBNYWluUmVuZGVyXzEuTWFpblJlbmRlcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZCA9IG5ldyBHYW1lV29ybGRfMS5HYW1lV29ybGQoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtID0gbmV3IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMS5VSUludGVyYWN0aW9uU3lzdGVtKG5ldyBNb3VzZUlucHV0TWFuYWdlcl8xLk1vdXNlSW5wdXRNYW5hZ2VyKGRvbUhhbmRsZXIubWVudUNhbnZhcykpO1xuICAgICAgICB0aGlzLm1vdmVtZW50U3lzdGVtID0gbmV3IE1vdmVtZW50U3lzdGVtXzEuTW92ZW1lbnRTeXN0ZW0oZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLmNvbGxpc2lvblN5c3RlbSA9IG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZWx0YSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSW5wdXRzKHRoaXMuZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHJldlRpbWUgPSB0aW1lO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgfVxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIudXBkYXRlKHRoaXMuZGVsdGEpO1xuICAgICAgICB0aGlzLm1vdmVtZW50U3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZCwgdGhpcy5kZWx0YSk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxuICAgIHVwZGF0ZUlucHV0cyhkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQubWVudUJ1dHRvbiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIH0sIGRlbHRhTXMpO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMubWFpblJlbmRlci5yZW5kZXIodGhpcy5nYW1lV29ybGQpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUxvb3AgPSBHYW1lTG9vcDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsID0gdm9pZCAwO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgQmFsbCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDgwMDAwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMubWF4U3BlZWQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDQwMDtcbiAgICB9XG4gICAgc2V0Rm9yU3RhcnRHYW1lKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNTZXRGb3JTdGFydCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSArIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplKTtcbiAgICAgICAgICAgIGNvbnN0IHNwZWVkID0gTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heFNwZWVkIC0gdGhpcy5tYXhTcGVlZCAvIDMuMzMpICsgdGhpcy5tYXhTcGVlZCAvIDMuMzM7XG4gICAgICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGguUEkgLyAyICsgKChNYXRoLnJhbmRvbSgpICogTWF0aC5QSSkgLyA0LjUgLSBNYXRoLlBJIC8gOSk7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmRlY3JlbWVudFNwZWVkKGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbCA9IEJhbGw7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR29hbFBvc3RzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEdvYWxQb3N0cyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzO1xuICAgIH1cbn1cbmV4cG9ydHMuR29hbFBvc3RzID0gR29hbFBvc3RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IHZvaWQgMDtcbmNsYXNzIEhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmhvdmVyUHJvZ3Jlc3MgPSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gSG92ZXJhYmxlRW50aXR5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVCdXR0b24gPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBIb3ZlcmFibGVFbnRpdHlfMSA9IHJlcXVpcmUoXCIuL0hvdmVyYWJsZUVudGl0eVwiKTtcbmNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBIb3ZlcmFibGVFbnRpdHlfMS5Ib3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCByZWZXaWR0aCwgcmVmSGVpZ2h0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTtcbiAgICAgICAgdGhpcy5kaW1lbnNpb24gPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoaGVpZ2h0ICogKHJlZldpZHRoIC8gcmVmSGVpZ2h0KSwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIChnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5kaW1lbnNpb24ud2lkdGgpIC8gMiwgKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5kaW1lbnNpb24uaGVpZ2h0KSAvIDIpO1xuICAgIH1cbiAgICBjb250YWlucyhwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5wb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucG9zaXRpb24ueCArIHRoaXMuZGltZW5zaW9uLndpZHRoICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMucG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpO1xuICAgIH1cbiAgICBnZXRUcmFuc2l0aW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIDEwMDtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVCdXR0b24gPSBNZW51QnV0dG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllciA9IHZvaWQgMDtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9zdGF0dXMvUGxheWVyU2lkZVwiKTtcbmNsYXNzIFBsYXllciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGlzQ3B1LCBpc1N1YnN0aXR1dGUsIHNpZGUsIGNvbG9ySW5kZXgpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXhTcGVlZCA9IDA7XG4gICAgICAgIHRoaXMuaXNTdHVubmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IDA7XG4gICAgICAgIHRoaXMubm9ybWFsTWF4U3BlZWQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDUwMDtcbiAgICAgICAgdGhpcy5tYXhTcGVlZFdpdGhCYWxsID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA2NjY7XG4gICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMTUwMDAwO1xuICAgICAgICB0aGlzLmNsb3NlVG9Qb2ludERpc3RhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLmlzQ3B1ID0gaXNDcHU7XG4gICAgICAgIHRoaXMuaXNTdWJzdGl0dXRlID0gaXNTdWJzdGl0dXRlO1xuICAgICAgICB0aGlzLnNpZGUgPSBzaWRlO1xuICAgICAgICB0aGlzLmNvbG9ySW5kZXggPSBjb2xvckluZGV4O1xuICAgICAgICB0aGlzLmluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIHRydWUsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDEpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDEpO1xuICAgIH1cbiAgICByZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKSA8XG4gICAgICAgICAgICB0aGlzLnJlYWNoZWREaXN0YW5jZVRvbGVyYW5jZSk7XG4gICAgfVxuICAgIG1vdmUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udXBkYXRlUG9zaXRpb24oZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdGVkUG9zaXRpb24gPSB0aGlzLm1vdmVtZW50UG9zaXRpb24ucHJvamVjdFRvRmluYWxQb3NpdGlvbigpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocHJvamVjdGVkUG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTcGVlZCA9IE1hdGgubWF4KGN1cnJlbnRTcGVlZCAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54ICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC55ICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWCA9IE1hdGguY29zKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWSA9IE1hdGguc2luKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgbGV0IHN0ZWVyWCA9IGRlc2lyZWRTcGVlZFggLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueDtcbiAgICAgICAgICAgIGxldCBzdGVlclkgPSBkZXNpcmVkU3BlZWRZIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLnk7XG4gICAgICAgICAgICBjb25zdCBzdGVlck1hZ25pdHVkZSA9IE1hdGguc3FydChzdGVlclggKiBzdGVlclggKyBzdGVlclkgKiBzdGVlclkpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RlZXIgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgICAgIGlmIChzdGVlck1hZ25pdHVkZSA+IG1heFN0ZWVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBtYXhTdGVlciAvIHN0ZWVyTWFnbml0dWRlO1xuICAgICAgICAgICAgICAgIHN0ZWVyWCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICBzdGVlclkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueCArPSBzdGVlclg7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSArPSBzdGVlclk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hZGp1c3RUb01heFNwZWVkKHRoaXMuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgcmVzZXRUb1N0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICB9XG4gICAgaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncykge1xuICAgICAgICBsZXQgb2Zmc2V0WCA9IDA7XG4gICAgICAgIGlmICh0aGlzLmlzU3Vic3RpdHV0ZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFhcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnggPSBnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBvZmZzZXRYO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXIgPSBQbGF5ZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gdm9pZCAwO1xuY2xhc3MgQm9yZGVyTGltaXRzIHtcbiAgICBjb25zdHJ1Y3RvcihsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pIHtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcbiAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICAgICAgdGhpcy5ib3R0b20gPSBib3R0b207XG4gICAgfVxufVxuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSBCb3JkZXJMaW1pdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5Qb2ludHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocG9pbnQyLnkgLSBwb2ludDEueSwgcG9pbnQyLnggLSBwb2ludDEueCk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL3N0YXR1cy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgR2FtZVN0YXR1c01hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgIH1cbiAgICBjaGFuZ2VTdGF0dXMoZ2FtZVN0YXR1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gZ2FtZVN0YXR1cztcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhdHVzU3RhcnRUaW1lIDwgMTAwMDtcbiAgICB9XG4gICAgc2NoZWR1bGVTdGF0dXNDaGFuZ2UoZGVsYXksIGdhbWVTdGF0dXMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdFdmVudCA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbmQoZSA9PiBlLmdhbWVTdGF0dXMgPT09IGdhbWVTdGF0dXMpO1xuICAgICAgICBpZiAoIWV4aXN0aW5nRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIHRpbWU6IHRoaXMudGltZSArIGRlbGF5LFxuICAgICAgICAgICAgICAgIGdhbWVTdGF0dXM6IGdhbWVTdGF0dXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy50aW1lICs9IGRlbHRhO1xuICAgICAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy5zY2hlZHVsZWRFdmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWUgPj0gZS50aW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGF0dXMoZS5nYW1lU3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbHRlcihlID0+IHRoaXMudGltZSA8IGUudGltZSk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IEdhbWVTdGF0dXNNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXMgPSB2b2lkIDA7XG52YXIgR2FtZVN0YXR1cztcbihmdW5jdGlvbiAoR2FtZVN0YXR1cykge1xuICAgIEdhbWVTdGF0dXNbXCJNRU5VXCJdID0gXCJNRU5VXCI7XG4gICAgR2FtZVN0YXR1c1tcIldBSVRJTkdfQkFMTFwiXSA9IFwiV0FJVElOR19CQUxMXCI7XG4gICAgR2FtZVN0YXR1c1tcIlBMQVlJTkdcIl0gPSBcIlBMQVlJTkdcIjtcbn0pKEdhbWVTdGF0dXMgfHwgKGV4cG9ydHMuR2FtZVN0YXR1cyA9IEdhbWVTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclNpZGUgPSB2b2lkIDA7XG52YXIgUGxheWVyU2lkZTtcbihmdW5jdGlvbiAoUGxheWVyU2lkZSkge1xuICAgIFBsYXllclNpZGVbXCJMRUZUXCJdID0gXCJMRUZUXCI7XG4gICAgUGxheWVyU2lkZVtcIlJJR0hUXCJdID0gXCJSSUdIVFwiO1xufSkoUGxheWVyU2lkZSB8fCAoZXhwb3J0cy5QbGF5ZXJTaWRlID0gUGxheWVyU2lkZSA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgQm9yZGVyTGltaXRzXzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvQm9yZGVyTGltaXRzXCIpO1xuY2xhc3MgQ29sbGlzaW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5jaGVja0JhbGxDb2xsaXNpb25zKGdhbWVXb3JsZCk7XG4gICAgICAgIC8vdGhpcy5jaGVja1BsYXllckNvbGxpc2lvbnMoZ2FtZVdvcmxkKTtcbiAgICB9XG4gICAgY2hlY2tCYWxsQ29sbGlzaW9ucyhnYW1lV29ybGQpIHtcbiAgICAgICAgLy8gVE9ETyB0byBhZGQgaGFuZGxlR29hbFBvc3RzQ29sbGlzaW9uXG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplKSwgdHJ1ZSk7XG4gICAgfVxuICAgIC8qcHJpdmF0ZSBjaGVja1BsYXllckNvbGxpc2lvbnMoZ2FtZVdvcmxkOiBHYW1lV29ybGQpOiB2b2lkIHtcbiAgICAgICAgXG4gICAgfSovXG4gICAgZ2V0RmllbGRCb3JkZXJMaW1pdHMoc2l6ZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoIC0gc2l6ZSwgY2ZnLmZpZWxkQm9yZGVyU2l6ZSArIHNpemUsIGNmZy5maWVsZEhlaWdodCAtIGNmZy5maWVsZEJvcmRlclNpemUgLSBzaXplKTtcbiAgICB9XG4gICAgaGFuZGxlQm9yZGVyQ29sbGlzaW9uKG1vdmVtZW50UG9pbnQsIGJvcmRlckxpbWl0cywgaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8IGJvcmRlckxpbWl0cy5sZWZ0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMubGVmdDtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQuc3BlZWQueCA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQuc3BlZWQueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+IGJvcmRlckxpbWl0cy5yaWdodCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLnJpZ2h0O1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5zcGVlZC54ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQuc3BlZWQueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8IGJvcmRlckxpbWl0cy50b3ApIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy50b3A7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnNwZWVkLnkgPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnNwZWVkLnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPiBib3JkZXJMaW1pdHMuYm90dG9tKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMuYm90dG9tO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5zcGVlZC55ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQuc3BlZWQueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IENvbGxpc2lvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9zdGF0dXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzTW92ZW1lbnRTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzTW92ZW1lbnRTdHJhdGVnaWVzL1dhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNsYXNzIE1vdmVtZW50U3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEuTWVudU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneV8xLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICAgICAgdGhpcy51cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgfVxuICAgIHVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RyYXRlZ2llc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICAgICAgcGxheWVyLm1vdmUoZGVsdGFNcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBzd2l0Y2ggKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTDpcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5zZXRGb3JTdGFydEdhbWUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORzpcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IE1vdmVtZW50U3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNsYXNzIEFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSB7XG59XG5leHBvcnRzLkFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSA9IEFic3RyYWN0TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vc3RhdHVzL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vc3RhdHVzL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNsYXNzIE1lbnVNb3ZlbWVudFN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQ7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi54ID1cbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArXG4gICAgICAgICAgICAgICAgICAgICgoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpIC8gMjtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi54ICs9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5zcGVlZCA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24uYWNjZWxlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPVxuICAgICAgICAgICAgICAgIChwbGF5ZXIubm9ybWFsTWF4U3BlZWQgLyA1KSAqIE1hdGgucmFuZG9tKCkgKyBwbGF5ZXIubm9ybWFsTWF4U3BlZWQgLyA3O1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gTWVudU1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL3N0YXR1cy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdFBsYXllck1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5pc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpKSB7XG4gICAgICAgICAgICBwbGF5ZXIucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuc2NoZWR1bGVTdGF0dXNDaGFuZ2UoMjAwMCwgR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lV29ybGQgPSB2b2lkIDA7XG5jb25zdCBCYWxsXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvQmFsbFwiKTtcbmNvbnN0IEdvYWxQb3N0c18xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0dvYWxQb3N0c1wiKTtcbmNvbnN0IE1lbnVCdXR0b25fMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9NZW51QnV0dG9uXCIpO1xuY29uc3QgUGxheWVyXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvUGxheWVyXCIpO1xuY29uc3QgR2FtZVN0YXR1c01hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9tYW5hZ2Vycy9HYW1lU3RhdHVzTWFuYWdlclwiKTtcbmNsYXNzIEdhbWVXb3JsZCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICB0aGlzLmdvYWxQb3N0cyA9IG5ldyBHb2FsUG9zdHNfMS5Hb2FsUG9zdHMoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGwgPSBuZXcgQmFsbF8xLkJhbGwoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICBjb25zdCBwbGF5SW1nID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9uID0gbmV3IE1lbnVCdXR0b25fMS5NZW51QnV0dG9uKGdhbWVDb25maWdzLCBwbGF5SW1nLndpZHRoLCBwbGF5SW1nLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIgPSBuZXcgR2FtZVN0YXR1c01hbmFnZXJfMS5HYW1lU3RhdHVzTWFuYWdlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVdvcmxkID0gR2FtZVdvcmxkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTW91c2VJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbk1vdXNlTW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQsIGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljayk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IE1vdXNlSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9zdGF0dXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEJhbGxSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRjMzMzNcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMzMwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFJlbmRlciA9IEJhbGxSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmllbGRSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImdvYWxfZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLnRyYWNrRmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBpZiAodGhpcy5hbHJlYWR5UmVuZGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmVuZGVyQmFja2dyb3VuZCgpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5maWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgIH1cbiAgICByZW5kZXJCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKiAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNBQUFBQUFcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja1lPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrSGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gRmllbGRSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBHYXRlc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSAwOyAvLyBUT0RPIGRhIHJpdmVkZXJlXG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlUmVjdCgwLCAwLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShNYXRoLlBJIC0gYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxSZWN0KDAsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VSZWN0KDAsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlc1JlbmRlciA9IEdhdGVzUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5SZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBCYWxsUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9CYWxsUmVuZGVyXCIpO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0ZpZWxkUmVuZGVyXCIpO1xuY29uc3QgR2F0ZXNSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0dhdGVzUmVuZGVyXCIpO1xuY29uc3QgTWVudVJlbmRlcl8xID0gcmVxdWlyZShcIi4vTWVudVJlbmRlclwiKTtcbmNvbnN0IFBsYXllclJlbmRlcl8xID0gcmVxdWlyZShcIi4vUGxheWVyUmVuZGVyXCIpO1xuY29uc3QgU2NvcmVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3JlUmVuZGVyXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlciA9IGRvbUhhbmRsZXI7XG4gICAgICAgIHRoaXMuZmllbGRSZW5kZXIgPSBuZXcgRmllbGRSZW5kZXJfMS5GaWVsZFJlbmRlcihkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnNjb3JlUmVuZGVyID0gbmV3IFNjb3JlUmVuZGVyXzEuU2NvcmVSZW5kZXIoZG9tSGFuZGxlci5zY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYXRlc1JlbmRlciA9IG5ldyBHYXRlc1JlbmRlcl8xLkdhdGVzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJSZW5kZXIgPSBuZXcgUGxheWVyUmVuZGVyXzEuUGxheWVyUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5tZW51UmVuZGVyID0gbmV3IE1lbnVSZW5kZXJfMS5NZW51UmVuZGVyKGRvbUhhbmRsZXIubWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5iYWxsUmVuZGVyID0gbmV3IEJhbGxSZW5kZXJfMS5CYWxsUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuZmllbGRSZW5kZXIucmVuZGVyKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuc2NvcmVSZW5kZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMucGxheWVyUmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLmJhbGxSZW5kZXIucmVuZGVyKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuZ2F0ZXNSZW5kZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMubWVudVJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlci5nYW1lQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMud2lkdGgsIHRoaXMuZG9tSGFuZGxlci5nYW1lQ2FudmFzLmhlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluUmVuZGVyID0gTWFpblJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBNZW51UmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihtZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5ob3ZlckZhY3RvciA9IDEuMztcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dCA9IG1lbnVDb250ZXh0O1xuICAgICAgICB0aGlzLnBsYXlJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwicGxheS5wbmdcIik7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSAxICsgKHRoaXMuaG92ZXJGYWN0b3IgLSAxKSAqIGdhbWVXb3JsZC5tZW51QnV0dG9uLmhvdmVyUHJvZ3Jlc3M7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCAqIHNjYWxlO1xuICAgICAgICAgICAgdGhpcy5tZW51Q29udGV4dC5kcmF3SW1hZ2UodGhpcy5wbGF5SW1hZ2UsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnggLVxuICAgICAgICAgICAgICAgICh3aWR0aCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCkgLyAyLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi55IC1cbiAgICAgICAgICAgICAgICAoaGVpZ2h0IC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCkgLyAyLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuTWVudVJlbmRlciA9IE1lbnVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9HYW1lQ29uZmlnc1wiKTtcbmNsYXNzIFBsYXllclJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuY29sb3JNYXAgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcIkxFRlQtMFwiLCBcIiMwMDgwMDBcIl0sXG4gICAgICAgICAgICBbXCJMRUZULTFcIiwgXCIjMzM4MDg4XCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMFwiLCBcIiNGRkE1MDBcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0xXCIsIFwiI0ZGRkYwMFwiXSxcbiAgICAgICAgXSk7XG4gICAgICAgIHRoaXMuc3R1bm5lZENvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBcIiMwMDMzMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleSA9IGAke3BsYXllci5zaWRlfS0ke3BsYXllci5jb2xvckluZGV4fWA7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSBwbGF5ZXIuaXNTdHVubmVkID8gdGhpcy5zdHVubmVkQ29sb3IgOiB0aGlzLmNvbG9yTWFwLmdldChjb2xvcktleSk7XG4gICAgICAgICAgICBpZiAoY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gXCIjRkYwMDAwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCksIE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICBpZiAoR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncy5JU19ERUJVRykge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCJyZWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCJyZWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngpLCBNYXRoLnJvdW5kKHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUgLyA1LCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSBQbGF5ZXJSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU2NvcmVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKHNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5mcmFtZUZvck51bWJlciA9IDY7XG4gICAgICAgIHRoaXMudG90YWxOdW1iZXJzID0gMTA7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0ID0gc2NvcmVDb250ZXh0O1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyh0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aCwgdGhpcy5kaWdpdHNJbWFnZXMuaGVpZ2h0IC8gKHRoaXMudG90YWxOdW1iZXJzICogdGhpcy5mcmFtZUZvck51bWJlcikpO1xuICAgICAgICBjb25zdCBzY29yZUhlaWdodCA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAqIDkpIC8gMTA7XG4gICAgICAgIHRoaXMuc2NvcmVEaW1lbnNpb25zID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKChzY29yZUhlaWdodCAqIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgpIC8gdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQsIHNjb3JlSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgeVBvc2l0aW9uID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0IC0gdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KSAvIDI7XG4gICAgICAgIHRoaXMucG9zaXRpb25BcnJheSA9IFtcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KDAsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCAqIDIsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgIF07XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5zY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIC8vIFRPRE8gZ2VzdGlyZSBhZ2dpb3JuYW1lbnRvIHB1bnRlZ2dpb1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkuZm9yRWFjaChwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5kaWdpdHNJbWFnZXMsIDAsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0ICogMCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQsIHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gU2NvcmVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IHZvaWQgMDtcbmNsYXNzIFVJSW50ZXJhY3Rpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB9XG4gICAgdXBkYXRlKGhvdmVyYWJsZSwgb25DbGljaywgZGVsdGFNcykge1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJlZCA9IGhvdmVyYWJsZS5jb250YWlucyh0aGlzLmlucHV0Lm1vdXNlUG9zaXRpb24pO1xuICAgICAgICBpZiAoaG92ZXJhYmxlLmhvdmVyZWQgJiYgdGhpcy5pbnB1dC5pc01vdXNlUHJlc3NlZCkge1xuICAgICAgICAgICAgb25DbGljaygpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ZXAgPSAoZGVsdGFNcyAvIGhvdmVyYWJsZS5nZXRUcmFuc2l0aW9uVGltZSgpKSAqIChob3ZlcmFibGUuaG92ZXJlZCA/IDEgOiAtMSk7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgKyBzdGVwKSk7XG4gICAgfVxufVxuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gVUlJbnRlcmFjdGlvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy5iYWxsQm9yZGVyID0gMTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDI2KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkV2lkdGggLyA0KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIHRoaXMuY3B1U3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgKHRoaXMuZmllbGRXaWR0aCAtIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICAgICAgdGhpcy5maWVsZEJvcmRlclNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyAxMDApO1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0ID0gdGhpcy5maWVsZFdpZHRoIC8gODtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldCA9IHRoaXMuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCA9XG4gICAgICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ICsgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCArIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuZ2F0ZXNMZW5ndGggPSB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyICogMztcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA4MCk7XG4gICAgICAgIHRoaXMuYmFsbFNpemVXaXRoQm9yZGVyID0gdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLmJhbGxCb3JkZXI7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSB0cnVlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91dGlscy9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
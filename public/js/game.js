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
const GameStatus_1 = __webpack_require__(/*! ../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const CollisionSystem_1 = __webpack_require__(/*! ../game/systems/CollisionSystem */ "./src/game/systems/CollisionSystem.ts");
const KeyboardInputManager_1 = __webpack_require__(/*! ../input/KeyboardInputManager */ "./src/input/KeyboardInputManager.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.delta = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld_1.GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem_1.UIInteractionSystem(new MouseInputManager_1.MouseInputManager(domHandler.menuCanvas));
        this.movementSystem = new MovementSystem_1.MovementSystem(gameConfigs, new KeyboardInputManager_1.KeyboardInputManager());
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
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
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
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
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

/***/ "./src/game/enums/GameStatus.ts"
/*!**************************************!*\
  !*** ./src/game/enums/GameStatus.ts ***!
  \**************************************/
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

/***/ "./src/game/enums/Keys.ts"
/*!********************************!*\
  !*** ./src/game/enums/Keys.ts ***!
  \********************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KeysUtilities = exports.KeysDirection = exports.Keys = void 0;
var Keys;
(function (Keys) {
    Keys["ARROW_DOWN"] = "ArrowDown";
    Keys["ARROW_UP"] = "ArrowUp";
    Keys["ARROW_LEFT"] = "ArrowLeft";
    Keys["ARROW_RIGHT"] = "ArrowRight";
    Keys["SPACE"] = " ";
})(Keys || (exports.Keys = Keys = {}));
var KeysDirection;
(function (KeysDirection) {
    KeysDirection["HORIZONTAL"] = "HORIZONTAL";
    KeysDirection["VERTICAL"] = "VERTICAL";
})(KeysDirection || (exports.KeysDirection = KeysDirection = {}));
class KeysUtilities {
    static getKeyDirection(key) {
        if (key === Keys.ARROW_LEFT || key === Keys.ARROW_RIGHT) {
            return KeysDirection.HORIZONTAL;
        }
        if (key === Keys.ARROW_UP || key === Keys.ARROW_DOWN) {
            return KeysDirection.VERTICAL;
        }
        return null;
    }
}
exports.KeysUtilities = KeysUtilities;


/***/ },

/***/ "./src/game/enums/PlayerSide.ts"
/*!**************************************!*\
  !*** ./src/game/enums/PlayerSide.ts ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerSide = void 0;
var PlayerSide;
(function (PlayerSide) {
    PlayerSide["LEFT"] = "LEFT";
    PlayerSide["RIGHT"] = "RIGHT";
})(PlayerSide || (exports.PlayerSide = PlayerSide = {}));


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

/***/ "./src/game/geometry/MovementPoint.ts"
/*!********************************************!*\
  !*** ./src/game/geometry/MovementPoint.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementPoint = void 0;
const Point_1 = __webpack_require__(/*! ./Point */ "./src/game/geometry/Point.ts");
class MovementPoint {
    constructor(position, speed, acceleration, size) {
        this.position = position;
        this.speed = speed;
        this.acceleration = acceleration;
        this.size = size;
    }
    updatePosition(deltaMs) {
        this.position.x += this.speed.x * deltaMs;
        this.position.y += this.speed.y * deltaMs;
    }
    projectToFinalPosition() {
        return new Point_1.Point(this.calculateDestinationPosition(this.position.x, this.speed.x), this.calculateDestinationPosition(this.position.y, this.speed.y));
    }
    getSpeed() {
        return Math.sqrt(Math.pow(this.speed.x, 2) + Math.pow(this.speed.y, 2));
    }
    getSpeedAngle() {
        return Math.atan2(this.speed.y, this.speed.x);
    }
    adjustToMaxSpeed(maxSpeed) {
        const speed = Math.min(this.getSpeed(), maxSpeed);
        const angle = this.getSpeedAngle();
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }
    setSpeed(speed, angle) {
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }
    decrementSpeed(deltaMs) {
        const currentSpeed = this.getSpeed();
        if (currentSpeed > 0) {
            const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
            const ratio = newSpeed / currentSpeed;
            this.speed.x *= ratio;
            this.speed.y *= ratio;
        }
    }
    calculateDestinationPosition(position, speed) {
        while (Math.abs(speed) > 0) {
            position += speed;
            speed = Math.sign(speed) * Math.max(Math.abs(speed) - this.acceleration, 0);
            if (Math.abs(speed) <= this.acceleration) {
                speed = 0;
            }
        }
        return position;
    }
}
exports.MovementPoint = MovementPoint;


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
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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
        this.checkPlayerCollisions(gameWorld);
    }
    checkBallCollisions(gameWorld) {
        // TODO to add handleGoalPostsCollision
        this.handleBorderCollision(gameWorld.ball.movementPosition, this.getFieldBorderLimits(gameWorld.ball.movementPosition.size), true);
    }
    checkPlayerCollisions(gameWorld) {
        gameWorld.players.filter(player => !player.isSubstitute).forEach(player => {
            this.handleBorderCollision(player.movementPosition, this.getFieldBorderLimits(player.movementPosition.size), false);
        });
    }
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
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const InputPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersMovementStrategies/InputPlayerMovementStrategy */ "./src/game/systems/playersMovementStrategies/InputPlayerMovementStrategy.ts");
const MenuMovementStrategy_1 = __webpack_require__(/*! ./playersMovementStrategies/MenuMovementStrategy */ "./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts");
const WaitingBallMovementStrategy_1 = __webpack_require__(/*! ./playersMovementStrategies/WaitingBallMovementStrategy */ "./src/game/systems/playersMovementStrategies/WaitingBallMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs, keyboardInputManager) {
        this.strategies = [];
        this.strategies.push(new MenuMovementStrategy_1.MenuMovementStrategy(gameConfigs));
        this.strategies.push(new WaitingBallMovementStrategy_1.WaitingBallMovementStrategy());
        this.strategies.push(new InputPlayerMovementStrategy_1.InputPlayerMovementStrategy(keyboardInputManager));
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

/***/ "./src/game/systems/playersMovementStrategies/InputPlayerMovementStrategy.ts"
/*!***********************************************************************************!*\
  !*** ./src/game/systems/playersMovementStrategies/InputPlayerMovementStrategy.ts ***!
  \***********************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InputPlayerMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Keys_1 = __webpack_require__(/*! ../../enums/Keys */ "./src/game/enums/Keys.ts");
const AbstractPlayerMovementStrategy_1 = __webpack_require__(/*! ./AbstractPlayerMovementStrategy */ "./src/game/systems/playersMovementStrategies/AbstractPlayerMovementStrategy.ts");
class InputPlayerMovementStrategy extends AbstractPlayerMovementStrategy_1.AbstractMovementStrategy {
    constructor(keyboardInputManager) {
        super();
        this.keyboardInputManager = keyboardInputManager;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute && !player.isCpu && gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING);
    }
    apply(player, _gameWorld, deltaMs) {
        const horizontalKey = this.keyboardInputManager.getDirectionPressed(Keys_1.KeysDirection.HORIZONTAL);
        const verticalKey = this.keyboardInputManager.getDirectionPressed(Keys_1.KeysDirection.VERTICAL);
        player.movementPosition.speed.x = this.applyAxisMovement(player.movementPosition.speed.x, player.movementPosition.acceleration, deltaMs, horizontalKey, Keys_1.Keys.ARROW_LEFT, Keys_1.Keys.ARROW_RIGHT);
        player.movementPosition.speed.y = this.applyAxisMovement(player.movementPosition.speed.y, player.movementPosition.acceleration, deltaMs, verticalKey, Keys_1.Keys.ARROW_UP, Keys_1.Keys.ARROW_DOWN);
        player.movementPosition.adjustToMaxSpeed(player.currentMaxSpeed);
    }
    applyAxisMovement(currentSpeed, acceleration, deltaMs, key, negativeKey, positiveKey) {
        const delta = acceleration * deltaMs;
        if (key === negativeKey)
            return currentSpeed - delta;
        if (key === positiveKey)
            return currentSpeed + delta;
        return Math.sign(currentSpeed) * Math.max(Math.abs(currentSpeed) - delta, 0);
    }
}
exports.InputPlayerMovementStrategy = InputPlayerMovementStrategy;


/***/ },

/***/ "./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/playersMovementStrategies/MenuMovementStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuMovementStrategy = void 0;
const Point_1 = __webpack_require__(/*! ../../geometry/Point */ "./src/game/geometry/Point.ts");
const GameStatus_1 = __webpack_require__(/*! ../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
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
const GameStatus_1 = __webpack_require__(/*! ../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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

/***/ "./src/input/KeyboardInputManager.ts"
/*!*******************************************!*\
  !*** ./src/input/KeyboardInputManager.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KeyboardInputManager = void 0;
const Keys_1 = __webpack_require__(/*! ../game/enums/Keys */ "./src/game/enums/Keys.ts");
class KeyboardInputManager {
    constructor() {
        this.pressedKeys = new Set();
        this.onKeyDown = (event) => {
            this.pressedKeys.add(event.key);
        };
        this.onKeyUp = (event) => {
            this.pressedKeys.delete(event.key);
        };
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
    }
    isKeyPressed(key) {
        return this.pressedKeys.has(key);
    }
    getDirectionPressed(direction) {
        for (const key of this.pressedKeys) {
            if (Keys_1.KeysUtilities.getKeyDirection(key) === direction) {
                return key;
            }
        }
        return null;
    }
}
exports.KeyboardInputManager = KeyboardInputManager;


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
const GameStatus_1 = __webpack_require__(/*! ../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class BallRender {
    constructor(gameContext, gameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        // TODO add enlargement for speed
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
const GameStatus_1 = __webpack_require__(/*! ../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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

/***/ "./src/ui/DomHandler.ts"
/*!******************************!*\
  !*** ./src/ui/DomHandler.ts ***!
  \******************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DomHandler = void 0;
class DomHandler {
    constructor() {
        [this.backgroundCanvas, this.backgroundContext] = DomHandler.getCanvas("backgroundCanvas");
        [this.scoreCanvas, this.scoreContext] = DomHandler.getCanvas("scoreCanvas");
        [this.gameCanvas, this.gameContext] = DomHandler.getCanvas("gameCanvas");
        [this.menuCanvas, this.menuContext] = DomHandler.getCanvas("menuCanvas");
    }
    static getCanvas(id) {
        const canvas = document.getElementById(id);
        if (!canvas) {
            throw new Error(`${id} not found`);
        }
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error(`${id} context not found`);
        }
        return [canvas, context];
    }
}
exports.DomHandler = DomHandler;


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
const DomHandler_1 = __webpack_require__(/*! ./ui/DomHandler */ "./src/ui/DomHandler.ts");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0JhbGwudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR29hbFBvc3RzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0hvdmVyYWJsZUVudGl0eS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9NZW51QnV0dG9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL1BsYXllci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9HYW1lU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0tleXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUGxheWVyU2lkZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Cb3JkZXJMaW1pdHMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9ucy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L1BvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvQ29sbGlzaW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvTW92ZW1lbnRTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9wbGF5ZXJzTW92ZW1lbnRTdHJhdGVnaWVzL0Fic3RyYWN0UGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL3BsYXllcnNNb3ZlbWVudFN0cmF0ZWdpZXMvSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvcGxheWVyc01vdmVtZW50U3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL3BsYXllcnNNb3ZlbWVudFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3dvcmxkL0dhbWVXb3JsZC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvS2V5Ym9hcmRJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2lucHV0L01vdXNlSW5wdXRNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvQmFsbFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvR2F0ZXNSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1BsYXllclJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1Njb3JlUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9VSUludGVyYWN0aW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmltYWdlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5JTUFHRV9OQU1FUy5tYXAoZmlsZU5hbWUgPT4gdGhpcy5sb2FkSW1hZ2UoZmlsZU5hbWUsIGAke3RoaXMuSU1BR0VfRk9MREVSfSR7ZmlsZU5hbWV9YCkpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aW1hZ2VOYW1lfSBpbWFnZSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvTW92ZW1lbnRTeXN0ZW1cIik7XG5jb25zdCBHYW1lV29ybGRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3dvcmxkL0dhbWVXb3JsZFwiKTtcbmNvbnN0IE1vdXNlSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jb25zdCBVSUludGVyYWN0aW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vdWkvVUlJbnRlcmFjdGlvblN5c3RlbVwiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBDb2xsaXNpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvQ29sbGlzaW9uU3lzdGVtXCIpO1xuY29uc3QgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlclwiKTtcbmNsYXNzIEdhbWVMb29wIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5kZWx0YSA9IDA7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQgPSBuZXcgR2FtZVdvcmxkXzEuR2FtZVdvcmxkKGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbSA9IG5ldyBVSUludGVyYWN0aW9uU3lzdGVtXzEuVUlJbnRlcmFjdGlvblN5c3RlbShuZXcgTW91c2VJbnB1dE1hbmFnZXJfMS5Nb3VzZUlucHV0TWFuYWdlcihkb21IYW5kbGVyLm1lbnVDYW52YXMpKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFN5c3RlbSA9IG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25TeXN0ZW0gPSBuZXcgQ29sbGlzaW9uU3lzdGVtXzEuQ29sbGlzaW9uU3lzdGVtKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgbWFpbigpIHtcbiAgICAgICAgY29uc3QgdGljayA9ICh0aW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2VGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0cyh0aGlzLmRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnVwZGF0ZSh0aGlzLmRlbHRhKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQsIHRoaXMuZGVsdGEpO1xuICAgICAgICB0aGlzLmNvbGxpc2lvblN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQpO1xuICAgIH1cbiAgICB1cGRhdGVJbnB1dHMoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLm1lbnVCdXR0b24sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9LCBkZWx0YU1zKTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIucmVuZGVyKHRoaXMuZ2FtZVdvcmxkKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVMb29wID0gR2FtZUxvb3A7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbCA9IHZvaWQgMDtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEJhbGwge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA4MDAwMDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplID0gZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLm1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA0MDA7XG4gICAgfVxuICAgIHNldEZvclN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzU2V0Rm9yU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKyB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhTcGVlZCAtIHRoaXMubWF4U3BlZWQgLyAzLjMzKSArIHRoaXMubWF4U3BlZWQgLyAzLjMzO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLlBJIC8gMiArICgoTWF0aC5yYW5kb20oKSAqIE1hdGguUEkpIC8gNC41IC0gTWF0aC5QSSAvIDkpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1vdmUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udXBkYXRlUG9zaXRpb24oZGVsdGFNcyk7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5kZWNyZW1lbnRTcGVlZChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGwgPSBCYWxsO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdvYWxQb3N0cyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBHb2FsUG9zdHMge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBnYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cztcbiAgICB9XG59XG5leHBvcnRzLkdvYWxQb3N0cyA9IEdvYWxQb3N0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSB2b2lkIDA7XG5jbGFzcyBIb3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ob3ZlclByb2dyZXNzID0gMDtcbiAgICB9XG59XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IEhvdmVyYWJsZUVudGl0eTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51QnV0dG9uID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgSG92ZXJhYmxlRW50aXR5XzEgPSByZXF1aXJlKFwiLi9Ib3ZlcmFibGVFbnRpdHlcIik7XG5jbGFzcyBNZW51QnV0dG9uIGV4dGVuZHMgSG92ZXJhYmxlRW50aXR5XzEuSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgcmVmV2lkdGgsIHJlZkhlaWdodCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDU7XG4gICAgICAgIHRoaXMuZGltZW5zaW9uID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKGhlaWdodCAqIChyZWZXaWR0aCAvIHJlZkhlaWdodCksIGhlaWdodCk7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyAoZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIHRoaXMuZGltZW5zaW9uLndpZHRoKSAvIDIsIChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZGltZW5zaW9uLmhlaWdodCkgLyAyKTtcbiAgICB9XG4gICAgY29udGFpbnMocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludC54ID49IHRoaXMucG9zaXRpb24ueCAmJlxuICAgICAgICAgICAgcG9pbnQueCA8PSB0aGlzLnBvc2l0aW9uLnggKyB0aGlzLmRpbWVuc2lvbi53aWR0aCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnBvc2l0aW9uLnkgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5kaW1lbnNpb24uaGVpZ2h0KTtcbiAgICB9XG4gICAgZ2V0VHJhbnNpdGlvblRpbWUoKSB7XG4gICAgICAgIHJldHVybiAxMDA7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51QnV0dG9uID0gTWVudUJ1dHRvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXIgPSB2b2lkIDA7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNsYXNzIFBsYXllciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGlzQ3B1LCBpc1N1YnN0aXR1dGUsIHNpZGUsIGNvbG9ySW5kZXgpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXhTcGVlZCA9IDA7XG4gICAgICAgIHRoaXMuaXNTdHVubmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IDA7XG4gICAgICAgIHRoaXMubm9ybWFsTWF4U3BlZWQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDUwMDtcbiAgICAgICAgdGhpcy5tYXhTcGVlZFdpdGhCYWxsID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA2NjY7XG4gICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMTUwMDAwO1xuICAgICAgICB0aGlzLmNsb3NlVG9Qb2ludERpc3RhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLmlzQ3B1ID0gaXNDcHU7XG4gICAgICAgIHRoaXMuaXNTdWJzdGl0dXRlID0gaXNTdWJzdGl0dXRlO1xuICAgICAgICB0aGlzLnNpZGUgPSBzaWRlO1xuICAgICAgICB0aGlzLmNvbG9ySW5kZXggPSBjb2xvckluZGV4O1xuICAgICAgICB0aGlzLmluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIHRydWUsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDEpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDEpO1xuICAgIH1cbiAgICByZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKSA8XG4gICAgICAgICAgICB0aGlzLnJlYWNoZWREaXN0YW5jZVRvbGVyYW5jZSk7XG4gICAgfVxuICAgIG1vdmUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udXBkYXRlUG9zaXRpb24oZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdGVkUG9zaXRpb24gPSB0aGlzLm1vdmVtZW50UG9zaXRpb24ucHJvamVjdFRvRmluYWxQb3NpdGlvbigpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocHJvamVjdGVkUG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTcGVlZCA9IE1hdGgubWF4KGN1cnJlbnRTcGVlZCAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54ICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC55ICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWCA9IE1hdGguY29zKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWSA9IE1hdGguc2luKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgbGV0IHN0ZWVyWCA9IGRlc2lyZWRTcGVlZFggLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueDtcbiAgICAgICAgICAgIGxldCBzdGVlclkgPSBkZXNpcmVkU3BlZWRZIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLnk7XG4gICAgICAgICAgICBjb25zdCBzdGVlck1hZ25pdHVkZSA9IE1hdGguc3FydChzdGVlclggKiBzdGVlclggKyBzdGVlclkgKiBzdGVlclkpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RlZXIgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgICAgIGlmIChzdGVlck1hZ25pdHVkZSA+IG1heFN0ZWVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBtYXhTdGVlciAvIHN0ZWVyTWFnbml0dWRlO1xuICAgICAgICAgICAgICAgIHN0ZWVyWCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICBzdGVlclkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueCArPSBzdGVlclg7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSArPSBzdGVlclk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hZGp1c3RUb01heFNwZWVkKHRoaXMuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgcmVzZXRUb1N0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICB9XG4gICAgaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncykge1xuICAgICAgICBsZXQgb2Zmc2V0WCA9IDA7XG4gICAgICAgIGlmICh0aGlzLmlzU3Vic3RpdHV0ZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFhcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnggPSBnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBvZmZzZXRYO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXIgPSBQbGF5ZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1cyA9IHZvaWQgMDtcbnZhciBHYW1lU3RhdHVzO1xuKGZ1bmN0aW9uIChHYW1lU3RhdHVzKSB7XG4gICAgR2FtZVN0YXR1c1tcIk1FTlVcIl0gPSBcIk1FTlVcIjtcbiAgICBHYW1lU3RhdHVzW1wiV0FJVElOR19CQUxMXCJdID0gXCJXQUlUSU5HX0JBTExcIjtcbiAgICBHYW1lU3RhdHVzW1wiUExBWUlOR1wiXSA9IFwiUExBWUlOR1wiO1xufSkoR2FtZVN0YXR1cyB8fCAoZXhwb3J0cy5HYW1lU3RhdHVzID0gR2FtZVN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IGV4cG9ydHMuS2V5cyA9IHZvaWQgMDtcbnZhciBLZXlzO1xuKGZ1bmN0aW9uIChLZXlzKSB7XG4gICAgS2V5c1tcIkFSUk9XX0RPV05cIl0gPSBcIkFycm93RG93blwiO1xuICAgIEtleXNbXCJBUlJPV19VUFwiXSA9IFwiQXJyb3dVcFwiO1xuICAgIEtleXNbXCJBUlJPV19MRUZUXCJdID0gXCJBcnJvd0xlZnRcIjtcbiAgICBLZXlzW1wiQVJST1dfUklHSFRcIl0gPSBcIkFycm93UmlnaHRcIjtcbiAgICBLZXlzW1wiU1BBQ0VcIl0gPSBcIiBcIjtcbn0pKEtleXMgfHwgKGV4cG9ydHMuS2V5cyA9IEtleXMgPSB7fSkpO1xudmFyIEtleXNEaXJlY3Rpb247XG4oZnVuY3Rpb24gKEtleXNEaXJlY3Rpb24pIHtcbiAgICBLZXlzRGlyZWN0aW9uW1wiSE9SSVpPTlRBTFwiXSA9IFwiSE9SSVpPTlRBTFwiO1xuICAgIEtleXNEaXJlY3Rpb25bXCJWRVJUSUNBTFwiXSA9IFwiVkVSVElDQUxcIjtcbn0pKEtleXNEaXJlY3Rpb24gfHwgKGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IEtleXNEaXJlY3Rpb24gPSB7fSkpO1xuY2xhc3MgS2V5c1V0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldEtleURpcmVjdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5cy5BUlJPV19MRUZUIHx8IGtleSA9PT0gS2V5cy5BUlJPV19SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIEtleXNEaXJlY3Rpb24uSE9SSVpPTlRBTDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX1VQIHx8IGtleSA9PT0gS2V5cy5BUlJPV19ET1dOKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5WRVJUSUNBTDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleXNVdGlsaXRpZXMgPSBLZXlzVXRpbGl0aWVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclNpZGUgPSB2b2lkIDA7XG52YXIgUGxheWVyU2lkZTtcbihmdW5jdGlvbiAoUGxheWVyU2lkZSkge1xuICAgIFBsYXllclNpZGVbXCJMRUZUXCJdID0gXCJMRUZUXCI7XG4gICAgUGxheWVyU2lkZVtcIlJJR0hUXCJdID0gXCJSSUdIVFwiO1xufSkoUGxheWVyU2lkZSB8fCAoZXhwb3J0cy5QbGF5ZXJTaWRlID0gUGxheWVyU2lkZSA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gdm9pZCAwO1xuY2xhc3MgQm9yZGVyTGltaXRzIHtcbiAgICBjb25zdHJ1Y3RvcihsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pIHtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcbiAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICAgICAgdGhpcy5ib3R0b20gPSBib3R0b207XG4gICAgfVxufVxuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSBCb3JkZXJMaW1pdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4vUG9pbnRcIik7XG5jbGFzcyBNb3ZlbWVudFBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgc3BlZWQsIGFjY2VsZXJhdGlvbiwgc2l6ZSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb247XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgfVxuICAgIHVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IHRoaXMuc3BlZWQueCAqIGRlbHRhTXM7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueSArPSB0aGlzLnNwZWVkLnkgKiBkZWx0YU1zO1xuICAgIH1cbiAgICBwcm9qZWN0VG9GaW5hbFBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5jYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHRoaXMucG9zaXRpb24ueCwgdGhpcy5zcGVlZC54KSwgdGhpcy5jYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHRoaXMucG9zaXRpb24ueSwgdGhpcy5zcGVlZC55KSk7XG4gICAgfVxuICAgIGdldFNwZWVkKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuc3BlZWQueCwgMikgKyBNYXRoLnBvdyh0aGlzLnNwZWVkLnksIDIpKTtcbiAgICB9XG4gICAgZ2V0U3BlZWRBbmdsZSgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy5zcGVlZC55LCB0aGlzLnNwZWVkLngpO1xuICAgIH1cbiAgICBhZGp1c3RUb01heFNwZWVkKG1heFNwZWVkKSB7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gTWF0aC5taW4odGhpcy5nZXRTcGVlZCgpLCBtYXhTcGVlZCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gdGhpcy5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgIHRoaXMuc3BlZWQueCA9IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICB0aGlzLnNwZWVkLnkgPSBNYXRoLnNpbihhbmdsZSkgKiBzcGVlZDtcbiAgICB9XG4gICAgc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKSB7XG4gICAgICAgIHRoaXMuc3BlZWQueCA9IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICB0aGlzLnNwZWVkLnkgPSBNYXRoLnNpbihhbmdsZSkgKiBzcGVlZDtcbiAgICB9XG4gICAgZGVjcmVtZW50U3BlZWQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTcGVlZCA9IE1hdGgubWF4KGN1cnJlbnRTcGVlZCAtIHRoaXMuYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgdGhpcy5zcGVlZC54ICo9IHJhdGlvO1xuICAgICAgICAgICAgdGhpcy5zcGVlZC55ICo9IHJhdGlvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24ocG9zaXRpb24sIHNwZWVkKSB7XG4gICAgICAgIHdoaWxlIChNYXRoLmFicyhzcGVlZCkgPiAwKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiArPSBzcGVlZDtcbiAgICAgICAgICAgIHNwZWVkID0gTWF0aC5zaWduKHNwZWVkKSAqIE1hdGgubWF4KE1hdGguYWJzKHNwZWVkKSAtIHRoaXMuYWNjZWxlcmF0aW9uLCAwKTtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhzcGVlZCkgPD0gdGhpcy5hY2NlbGVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRQb2ludCA9IE1vdmVtZW50UG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUG9pbnQgPSB2b2lkIDA7XG5jbGFzcyBQb2ludCB7XG4gICAgY29uc3RydWN0b3IoeCwgeSkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0RGlzdGFuY2UocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhwb2ludDEueCAtIHBvaW50Mi54LCAyKSArIE1hdGgucG93KHBvaW50MS55IC0gcG9pbnQyLnksIDIpKTtcbiAgICB9XG4gICAgc3RhdGljIGdldEFuZ2xlQmV0d2VlblBvaW50cyhwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMihwb2ludDIueSAtIHBvaW50MS55LCBwb2ludDIueCAtIHBvaW50MS54KTtcbiAgICB9XG59XG5leHBvcnRzLlBvaW50ID0gUG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEdhbWVTdGF0dXNNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgICAgIHRoaXMuc3RhdHVzU3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcbiAgICB9XG4gICAgY2hhbmdlU3RhdHVzKGdhbWVTdGF0dXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IGdhbWVTdGF0dXM7XG4gICAgICAgIHRoaXMuc3RhdHVzU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG4gICAgZ2V0IGdhbWVTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nYW1lU3RhdHVzO1xuICAgIH1cbiAgICBpc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXR1c1N0YXJ0VGltZSA8IDEwMDA7XG4gICAgfVxuICAgIHNjaGVkdWxlU3RhdHVzQ2hhbmdlKGRlbGF5LCBnYW1lU3RhdHVzKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRXZlbnQgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maW5kKGUgPT4gZS5nYW1lU3RhdHVzID09PSBnYW1lU3RhdHVzKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0V2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0aW1lOiB0aGlzLnRpbWUgKyBkZWxheSxcbiAgICAgICAgICAgICAgICBnYW1lU3RhdHVzOiBnYW1lU3RhdHVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIHRoaXMuc2NoZWR1bGVkRXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lID49IGUudGltZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlU3RhdHVzKGUuZ2FtZVN0YXR1cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maWx0ZXIoZSA9PiB0aGlzLnRpbWUgPCBlLnRpbWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSBHYW1lU3RhdHVzTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBCb3JkZXJMaW1pdHNfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Cb3JkZXJMaW1pdHNcIik7XG5jbGFzcyBDb2xsaXNpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNoZWNrQmFsbENvbGxpc2lvbnMoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5jaGVja1BsYXllckNvbGxpc2lvbnMoZ2FtZVdvcmxkKTtcbiAgICB9XG4gICAgY2hlY2tCYWxsQ29sbGlzaW9ucyhnYW1lV29ybGQpIHtcbiAgICAgICAgLy8gVE9ETyB0byBhZGQgaGFuZGxlR29hbFBvc3RzQ29sbGlzaW9uXG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplKSwgdHJ1ZSk7XG4gICAgfVxuICAgIGNoZWNrUGxheWVyQ29sbGlzaW9ucyhnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSkuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24ocGxheWVyLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSksIGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldEZpZWxkQm9yZGVyTGltaXRzKHNpemUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIHNpemUsIGNmZy5maWVsZFhPZmZzZXQgKyBjZmcuZmllbGRXaWR0aCAtIHNpemUsIGNmZy5maWVsZEJvcmRlclNpemUgKyBzaXplLCBjZmcuZmllbGRIZWlnaHQgLSBjZmcuZmllbGRCb3JkZXJTaXplIC0gc2l6ZSk7XG4gICAgfVxuICAgIGhhbmRsZUJvcmRlckNvbGxpc2lvbihtb3ZlbWVudFBvaW50LCBib3JkZXJMaW1pdHMsIGludmVydFNwZWVkKSB7XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPCBib3JkZXJMaW1pdHMubGVmdCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLmxlZnQ7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnNwZWVkLnggPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnNwZWVkLngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPiBib3JkZXJMaW1pdHMucmlnaHQpIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA9IGJvcmRlckxpbWl0cy5yaWdodDtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQuc3BlZWQueCA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnNwZWVkLngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPCBib3JkZXJMaW1pdHMudG9wKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMudG9wO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5zcGVlZC55ID0gTWF0aC5hYnMobW92ZW1lbnRQb2ludC5zcGVlZC55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID4gYm9yZGVyTGltaXRzLmJvdHRvbSkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLmJvdHRvbTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQuc3BlZWQueSA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnNwZWVkLnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSBDb2xsaXNpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc01vdmVtZW50U3RyYXRlZ2llcy9JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBNZW51TW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc01vdmVtZW50U3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc01vdmVtZW50U3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgTWVudU1vdmVtZW50U3RyYXRlZ3lfMS5NZW51TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgICAgIHRoaXMudXBkYXRlQmFsbChnYW1lV29ybGQsIGRlbHRhTXMpO1xuICAgIH1cbiAgICB1cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0cmF0ZWdpZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICAgICAgICAgIHBsYXllci5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlQmFsbChnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgc3dpdGNoIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cykge1xuICAgICAgICAgICAgY2FzZSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEw6XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuc2V0Rm9yU3RhcnRHYW1lKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkc6XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZShkZWx0YU1zKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSBNb3ZlbWVudFN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jbGFzcyBBYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kge1xufVxuZXhwb3J0cy5BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kgPSBBYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBLZXlzXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvS2V5c1wiKTtcbmNvbnN0IEFic3RyYWN0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY2xhc3MgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmICFwbGF5ZXIuaXNDcHUgJiYgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgaG9yaXpvbnRhbEtleSA9IHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuZ2V0RGlyZWN0aW9uUHJlc3NlZChLZXlzXzEuS2V5c0RpcmVjdGlvbi5IT1JJWk9OVEFMKTtcbiAgICAgICAgY29uc3QgdmVydGljYWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uVkVSVElDQUwpO1xuICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54ID0gdGhpcy5hcHBseUF4aXNNb3ZlbWVudChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24sIGRlbHRhTXMsIGhvcml6b250YWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX0xFRlQsIEtleXNfMS5LZXlzLkFSUk9XX1JJR0hUKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCB2ZXJ0aWNhbEtleSwgS2V5c18xLktleXMuQVJST1dfVVAsIEtleXNfMS5LZXlzLkFSUk9XX0RPV04pO1xuICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hZGp1c3RUb01heFNwZWVkKHBsYXllci5jdXJyZW50TWF4U3BlZWQpO1xuICAgIH1cbiAgICBhcHBseUF4aXNNb3ZlbWVudChjdXJyZW50U3BlZWQsIGFjY2VsZXJhdGlvbiwgZGVsdGFNcywga2V5LCBuZWdhdGl2ZUtleSwgcG9zaXRpdmVLZXkpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBhY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICBpZiAoa2V5ID09PSBuZWdhdGl2ZUtleSlcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3BlZWQgLSBkZWx0YTtcbiAgICAgICAgaWYgKGtleSA9PT0gcG9zaXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkICsgZGVsdGE7XG4gICAgICAgIHJldHVybiBNYXRoLnNpZ24oY3VycmVudFNwZWVkKSAqIE1hdGgubWF4KE1hdGguYWJzKGN1cnJlbnRTcGVlZCkgLSBkZWx0YSwgMCk7XG4gICAgfVxufVxuZXhwb3J0cy5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kgPSBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudU1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY2xhc3MgTWVudU1vdmVtZW50U3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICAgICAgKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodDtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgKChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCkgLyAyO1xuICAgICAgICAgICAgaWYgKHBsYXllci5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggKz0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnNwZWVkID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5hY2NlbGVyYXRpb24gPSAwO1xuICAgICAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9XG4gICAgICAgICAgICAgICAgKHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDUpICogTWF0aC5yYW5kb20oKSArIHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDc7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWVudU1vdmVtZW50U3RyYXRlZ3kgPSBNZW51TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEFic3RyYWN0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSkge1xuICAgICAgICAgICAgcGxheWVyLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKDIwMDAsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgQmFsbF8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0JhbGxcIik7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXJcIik7XG5jbGFzcyBHYW1lV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnBsYXllcnMgPSBbXTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdHMgPSBuZXcgR29hbFBvc3RzXzEuR29hbFBvc3RzKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5iYWxsID0gbmV3IEJhbGxfMS5CYWxsKGdhbWVDb25maWdzKTtcbiAgICAgICAgY29uc3QgcGxheUltZyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwicGxheS5wbmdcIik7XG4gICAgICAgIHRoaXMubWVudUJ1dHRvbiA9IG5ldyBNZW51QnV0dG9uXzEuTWVudUJ1dHRvbihnYW1lQ29uZmlncywgcGxheUltZy53aWR0aCwgcGxheUltZy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyID0gbmV3IEdhbWVTdGF0dXNNYW5hZ2VyXzEuR2FtZVN0YXR1c01hbmFnZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVXb3JsZCA9IEdhbWVXb3JsZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0tleXNcIik7XG5jbGFzcyBLZXlib2FyZElucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJlc3NlZEtleXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMub25LZXlEb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmFkZChldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uS2V5VXAgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuZGVsZXRlKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25LZXlEb3duKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXlVcCk7XG4gICAgfVxuICAgIGlzS2V5UHJlc3NlZChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlc3NlZEtleXMuaGFzKGtleSk7XG4gICAgfVxuICAgIGdldERpcmVjdGlvblByZXNzZWQoZGlyZWN0aW9uKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMucHJlc3NlZEtleXMpIHtcbiAgICAgICAgICAgIGlmIChLZXlzXzEuS2V5c1V0aWxpdGllcy5nZXRLZXlEaXJlY3Rpb24oa2V5KSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gS2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNb3VzZUlucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTW91c2VNb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCwgZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICB9XG59XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gTW91c2VJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBCYWxsUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgLy8gVE9ETyBhZGQgZW5sYXJnZW1lbnQgZm9yIHNwZWVkXG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCwgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMzMzM1wiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMzMzAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUmVuZGVyID0gQmFsbFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaWVsZFJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpZWxkUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihiYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLmdvYWxJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZ29hbF9maWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMudHJhY2tGaWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJ0cmFjay5qcGdcIik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGlmICh0aGlzLmFscmVhZHlSZW5kZXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJCYWNrZ3JvdW5kKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQXRobGV0aWNUcmFjaygpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICB0aGlzLnJlbmRlckJvcmRlcigpO1xuICAgICAgICB0aGlzLnJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZW5kZXJCYWNrZ3JvdW5kKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgfVxuICAgIHJlbmRlckJvcmRlcigpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAqIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICB9XG4gICAgcmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0FBQUFBQVwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgZ2FtZVdvcmxkLmdvYWxQb3N0cy5wb3NpdGlvbnMuZm9yRWFjaChwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyQXRobGV0aWNUcmFjaygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy50cmFja0ZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tIZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmllbGRSZW5kZXIgPSBGaWVsZFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlc1JlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEdhdGVzUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYwMDAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC0gdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IDA7IC8vIFRPRE8gZGEgcml2ZWRlcmVcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKE1hdGguUEkgLSBhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gR2F0ZXNSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEJhbGxSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0JhbGxSZW5kZXJcIik7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vRmllbGRSZW5kZXJcIik7XG5jb25zdCBHYXRlc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vR2F0ZXNSZW5kZXJcIik7XG5jb25zdCBNZW51UmVuZGVyXzEgPSByZXF1aXJlKFwiLi9NZW51UmVuZGVyXCIpO1xuY29uc3QgUGxheWVyUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9QbGF5ZXJSZW5kZXJcIik7XG5jb25zdCBTY29yZVJlbmRlcl8xID0gcmVxdWlyZShcIi4vU2NvcmVSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyID0gZG9tSGFuZGxlcjtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlciA9IG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGRvbUhhbmRsZXIuYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuc2NvcmVSZW5kZXIgPSBuZXcgU2NvcmVSZW5kZXJfMS5TY29yZVJlbmRlcihkb21IYW5kbGVyLnNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhdGVzUmVuZGVyID0gbmV3IEdhdGVzUmVuZGVyXzEuR2F0ZXNSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllclJlbmRlciA9IG5ldyBQbGF5ZXJSZW5kZXJfMS5QbGF5ZXJSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLm1lbnVSZW5kZXIgPSBuZXcgTWVudVJlbmRlcl8xLk1lbnVSZW5kZXIoZG9tSGFuZGxlci5tZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmJhbGxSZW5kZXIgPSBuZXcgQmFsbFJlbmRlcl8xLkJhbGxSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5zY29yZVJlbmRlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJSZW5kZXIucmVuZGVyKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuYmFsbFJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5nYXRlc1JlbmRlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5tZW51UmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgTWVudVJlbmRlciB7XG4gICAgY29uc3RydWN0b3IobWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuaG92ZXJGYWN0b3IgPSAxLjM7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQgPSBtZW51Q29udGV4dDtcbiAgICAgICAgdGhpcy5wbGF5SW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gMSArICh0aGlzLmhvdmVyRmFjdG9yIC0gMSkgKiBnYW1lV29ybGQubWVudUJ1dHRvbi5ob3ZlclByb2dyZXNzO1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgIHRoaXMubWVudUNvbnRleHQuZHJhd0ltYWdlKHRoaXMucGxheUltYWdlLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi54IC1cbiAgICAgICAgICAgICAgICAod2lkdGggLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGgpIC8gMiwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueSAtXG4gICAgICAgICAgICAgICAgKGhlaWdodCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQpIC8gMiwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLk1lbnVSZW5kZXIgPSBNZW51UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVDb25maWdzXzEgPSByZXF1aXJlKFwiLi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBQbGF5ZXJSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNvbG9yTWFwID0gbmV3IE1hcChbXG4gICAgICAgICAgICBbXCJMRUZULTBcIiwgXCIjMDA4MDAwXCJdLFxuICAgICAgICAgICAgW1wiTEVGVC0xXCIsIFwiIzMzODA4OFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTBcIiwgXCIjRkZBNTAwXCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMVwiLCBcIiNGRkZGMDBcIl0sXG4gICAgICAgIF0pO1xuICAgICAgICB0aGlzLnN0dW5uZWRDb2xvciA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJvcmRlckNvbG9yID0gXCIjMDAzMzAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgY29sb3JLZXkgPSBgJHtwbGF5ZXIuc2lkZX0tJHtwbGF5ZXIuY29sb3JJbmRleH1gO1xuICAgICAgICAgICAgbGV0IGNvbG9yID0gcGxheWVyLmlzU3R1bm5lZCA/IHRoaXMuc3R1bm5lZENvbG9yIDogdGhpcy5jb2xvck1hcC5nZXQoY29sb3JLZXkpO1xuICAgICAgICAgICAgaWYgKGNvbG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlckNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLnBsYXllckJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpLCBNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICAgICAgaWYgKEdhbWVDb25maWdzXzEuR2FtZUNvbmZpZ3MuSVNfREVCVUcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwicmVkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwicmVkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoTWF0aC5yb3VuZChwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi54KSwgTWF0aC5yb3VuZChwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplIC8gNSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gUGxheWVyUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFNjb3JlUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihzY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZnJhbWVGb3JOdW1iZXIgPSA2O1xuICAgICAgICB0aGlzLnRvdGFsTnVtYmVycyA9IDEwO1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dCA9IHNjb3JlQ29udGV4dDtcbiAgICAgICAgdGhpcy5kaWdpdHNJbWFnZXMgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImRpZ2l0cy5wbmdcIik7XG4gICAgICAgIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnModGhpcy5kaWdpdHNJbWFnZXMud2lkdGgsIHRoaXMuZGlnaXRzSW1hZ2VzLmhlaWdodCAvICh0aGlzLnRvdGFsTnVtYmVycyAqIHRoaXMuZnJhbWVGb3JOdW1iZXIpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAvLyBUT0RPIGdlc3RpcmUgYWdnaW9ybmFtZW50byBwdW50ZWdnaW9cbiAgICAgICAgdGhpcy5wb3NpdGlvbkFycmF5LmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCAqIDAsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TY29yZVJlbmRlciA9IFNjb3JlUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgW3RoaXMuYmFja2dyb3VuZENhbnZhcywgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImJhY2tncm91bmRDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLnNjb3JlQ2FudmFzLCB0aGlzLnNjb3JlQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcInNjb3JlQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5nYW1lQ2FudmFzLCB0aGlzLmdhbWVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiZ2FtZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMubWVudUNhbnZhcywgdGhpcy5tZW51Q29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcIm1lbnVDYW52YXNcIik7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRDYW52YXMoaWQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IGNvbnRleHQgbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtjYW52YXMsIGNvbnRleHRdO1xuICAgIH1cbn1cbmV4cG9ydHMuRG9tSGFuZGxlciA9IERvbUhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IHZvaWQgMDtcbmNsYXNzIFVJSW50ZXJhY3Rpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB9XG4gICAgdXBkYXRlKGhvdmVyYWJsZSwgb25DbGljaywgZGVsdGFNcykge1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJlZCA9IGhvdmVyYWJsZS5jb250YWlucyh0aGlzLmlucHV0Lm1vdXNlUG9zaXRpb24pO1xuICAgICAgICBpZiAoaG92ZXJhYmxlLmhvdmVyZWQgJiYgdGhpcy5pbnB1dC5pc01vdXNlUHJlc3NlZCkge1xuICAgICAgICAgICAgb25DbGljaygpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ZXAgPSAoZGVsdGFNcyAvIGhvdmVyYWJsZS5nZXRUcmFuc2l0aW9uVGltZSgpKSAqIChob3ZlcmFibGUuaG92ZXJlZCA/IDEgOiAtMSk7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgKyBzdGVwKSk7XG4gICAgfVxufVxuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gVUlJbnRlcmFjdGlvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy5iYWxsQm9yZGVyID0gMTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDI2KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkV2lkdGggLyA0KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIHRoaXMuY3B1U3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgKHRoaXMuZmllbGRXaWR0aCAtIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICAgICAgdGhpcy5maWVsZEJvcmRlclNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyAxMDApO1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0ID0gdGhpcy5maWVsZFdpZHRoIC8gODtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldCA9IHRoaXMuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCA9XG4gICAgICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ICsgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCArIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuZ2F0ZXNMZW5ndGggPSB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyICogMztcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA4MCk7XG4gICAgICAgIHRoaXMuYmFsbFNpemVXaXRoQm9yZGVyID0gdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLmJhbGxCb3JkZXI7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSB0cnVlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91aS9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
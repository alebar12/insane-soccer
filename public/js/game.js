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
const GameStatus_1 = __webpack_require__(/*! ../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const CollisionSystem_1 = __webpack_require__(/*! ../game/systems/collision/CollisionSystem */ "./src/game/systems/collision/CollisionSystem.ts");
const MovementSystem_1 = __webpack_require__(/*! ../game/systems/movement/MovementSystem */ "./src/game/systems/movement/MovementSystem.ts");
const GameWorld_1 = __webpack_require__(/*! ../game/world/GameWorld */ "./src/game/world/GameWorld.ts");
const KeyboardInputManager_1 = __webpack_require__(/*! ../input/KeyboardInputManager */ "./src/input/KeyboardInputManager.ts");
const MouseInputManager_1 = __webpack_require__(/*! ../input/MouseInputManager */ "./src/input/MouseInputManager.ts");
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
const UIInteractionSystem_1 = __webpack_require__(/*! ../ui/UIInteractionSystem */ "./src/ui/UIInteractionSystem.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.prevTime = 0;
        this.systems = new Array();
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld_1.GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem_1.UIInteractionSystem(new MouseInputManager_1.MouseInputManager(domHandler.menuCanvas));
        this.systems.push(new MovementSystem_1.MovementSystem(gameConfigs, new KeyboardInputManager_1.KeyboardInputManager()));
        this.systems.push(new CollisionSystem_1.CollisionSystem(gameConfigs));
    }
    main() {
        const tick = (time) => {
            if (this.prevTime !== 0) {
                const delta = time - this.prevTime;
                this.updateInputs(delta);
                this.update(delta);
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    update(delta) {
        this.gameWorld.gameStatusManager.update(delta);
        this.systems.forEach(system => system.update(this.gameWorld, delta));
    }
    updateInputs(delta) {
        this.uiInteractionSystem.update(this.gameWorld.menuButton, () => {
            this.gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        }, delta);
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
const BallStatus_1 = __webpack_require__(/*! ../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class Ball {
    constructor(gameConfigs) {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
        this.angleWithPlayer = 0;
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.isSetForStart = false;
        this.gameConfigs = gameConfigs;
        this.movementPosition.size = gameConfigs.ballSizeWithBorder;
        this.maxSpeed = gameConfigs.fieldHeight / 400;
        this.movementPosition.acceleration = this.maxSpeed / 2000;
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
    resetToStartGame() {
        this.isSetForStart = false;
        this.movementPosition.setSpeed(0, 0);
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
    }
    move(deltaMs) {
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);
    }
    attachToPlayer(player) {
        this.attachedPlayer = player;
        this.ballStatus = BallStatus_1.BallStatus.ATTACHED;
        this.angleWithPlayer = Point_1.Point.getAngleBetweenPoints(player.movementPosition.position, this.movementPosition.position);
    }
    detachFromPlayer() {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
        this.movementPosition.setSpeed(this.maxSpeed, this.angleWithPlayer);
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
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.currentMaxSpeed = 0;
        this.isStunned = false;
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = this.normalMaxSpeed / 1.332;
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = this.normalMaxSpeed / 300;
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
                this.movementPosition.velocity.x *= ratio;
                this.movementPosition.velocity.y *= ratio;
            }
        }
        else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;
            let steerX = desiredSpeedX - this.movementPosition.velocity.x;
            let steerY = desiredSpeedY - this.movementPosition.velocity.y;
            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.movementPosition.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }
            this.movementPosition.velocity.x += steerX;
            this.movementPosition.velocity.y += steerY;
        }
        if (this.reachedDestinationPosition()) {
            this.movementPosition.velocity = new Point_1.Point(0, 0);
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

/***/ "./src/game/enums/BallStatus.ts"
/*!**************************************!*\
  !*** ./src/game/enums/BallStatus.ts ***!
  \**************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallStatus = void 0;
var BallStatus;
(function (BallStatus) {
    BallStatus["FREE"] = "FREE";
    BallStatus["ATTACHED"] = "ATTACHED";
    BallStatus["GOAL_SCORED"] = "GOAL_SCORED";
})(BallStatus || (exports.BallStatus = BallStatus = {}));


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
    isPointInside(point) {
        return (point.x >= this.left &&
            point.x <= this.right &&
            point.y >= this.top &&
            point.y <= this.bottom);
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
    static areTouching(point1, point2) {
        return Point_1.Point.getDistance(point1.position, point2.position) < point1.size + point2.size;
    }
    constructor(position, velocity, acceleration, size) {
        this.position = position;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.size = size;
    }
    updatePosition(deltaMs) {
        this.position.x += this.velocity.x * deltaMs;
        this.position.y += this.velocity.y * deltaMs;
    }
    projectToFinalPosition() {
        return new Point_1.Point(this.calculateDestinationPosition(this.position.x, this.velocity.x), this.calculateDestinationPosition(this.position.y, this.velocity.y));
    }
    getSpeed() {
        return Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
    }
    getSpeedAngle() {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }
    adjustToMaxSpeed(maxSpeed) {
        const speed = Math.min(this.getSpeed(), maxSpeed);
        const angle = this.getSpeedAngle();
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    }
    setSpeed(speed, angle) {
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
    }
    decrementSpeed(deltaMs) {
        const currentSpeed = this.getSpeed();
        if (currentSpeed > 0) {
            const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
            const ratio = newSpeed / currentSpeed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
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

/***/ "./src/game/managers/ScoreManager.ts"
/*!*******************************************!*\
  !*** ./src/game/managers/ScoreManager.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreManager = void 0;
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
class ScoreManager {
    constructor() {
        this.leftScore = 0;
        this.rightScore = 0;
        this.lastUpdateTime = 0;
        this.lastSideUpdated = PlayerSide_1.PlayerSide.LEFT;
    }
    increaseScore(playerSide) {
        if (playerSide === PlayerSide_1.PlayerSide.LEFT) {
            this.rightScore++;
        }
        else {
            this.leftScore++;
        }
        this.lastUpdateTime = Date.now();
        this.lastSideUpdated = playerSide;
    }
    reset() {
        this.leftScore = 0;
        this.rightScore = 0;
    }
    getScoreAsArray() {
        const outputString = String(this.leftScore).padStart(2, "0") + String(this.rightScore).padStart(2, "0");
        return outputString.split("").map(Number);
    }
    shouldAnimateIndex(index) {
        if (this.lastSideUpdated === PlayerSide_1.PlayerSide.RIGHT) {
            return index < 2;
        }
        else {
            return index >= 2;
        }
    }
    get lastUpdate() {
        return this.lastUpdateTime;
    }
    get lastSide() {
        return this.lastSideUpdated;
    }
}
exports.ScoreManager = ScoreManager;


/***/ },

/***/ "./src/game/systems/collision/CollisionSystem.ts"
/*!*******************************************************!*\
  !*** ./src/game/systems/collision/CollisionSystem.ts ***!
  \*******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CollisionSystem = void 0;
const BallBorderCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallBorderCollisionStrategy */ "./src/game/systems/collision/strategies/BallBorderCollisionStrategy.ts");
const BallGoalCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallGoalCollisionStrategy */ "./src/game/systems/collision/strategies/BallGoalCollisionStrategy.ts");
const BallGoalStakesCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallGoalStakesCollisionStrategy */ "./src/game/systems/collision/strategies/BallGoalStakesCollisionStrategy.ts");
const BallPlayerCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallPlayerCollisionStrategy */ "./src/game/systems/collision/strategies/BallPlayerCollisionStrategy.ts");
const PlayerBorderCollisionStrategy_1 = __webpack_require__(/*! ./strategies/PlayerBorderCollisionStrategy */ "./src/game/systems/collision/strategies/PlayerBorderCollisionStrategy.ts");
const PlayerCollisionStrategy_1 = __webpack_require__(/*! ./strategies/PlayerCollisionStrategy */ "./src/game/systems/collision/strategies/PlayerCollisionStrategy.ts");
class CollisionSystem {
    constructor(gameConfigs) {
        this.strategies = [];
        this.strategies.push(new BallPlayerCollisionStrategy_1.BallPlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerBorderCollisionStrategy_1.PlayerBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new PlayerCollisionStrategy_1.PlayerCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalCollisionStrategy_1.BallGoalCollisionStrategy(gameConfigs));
        this.strategies.push(new BallBorderCollisionStrategy_1.BallBorderCollisionStrategy(gameConfigs));
        this.strategies.push(new BallGoalStakesCollisionStrategy_1.BallGoalStakesCollisionStrategy(gameConfigs));
    }
    update(gameWorld) {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}
exports.CollisionSystem = CollisionSystem;


/***/ },

/***/ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractCollisionStrategy = void 0;
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const BorderLimits_1 = __webpack_require__(/*! ../../../geometry/BorderLimits */ "./src/game/geometry/BorderLimits.ts");
class AbstractCollisionStrategy {
    constructor(gameConfigs) {
        this.gameConfigs = gameConfigs;
    }
    getFieldBorderLimits(size) {
        const cfg = this.gameConfigs;
        return new BorderLimits_1.BorderLimits(cfg.fieldXOffset + size, cfg.fieldXOffset + cfg.fieldWidth - size, cfg.fieldBorderSize + size, cfg.fieldHeight - cfg.fieldBorderSize - size);
    }
    handleBorderCollision(movementPoint, borderLimits, invertSpeed, avoidBounceOnGoal = true) {
        const cfg = this.gameConfigs;
        const isInGoalYRange = !avoidBounceOnGoal &&
            movementPoint.position.y >= cfg.goalYOffset &&
            movementPoint.position.y <= cfg.goalYOffset + cfg.goalHeight;
        if (!isInGoalYRange && movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            if (invertSpeed) {
                movementPoint.velocity.x = Math.abs(movementPoint.velocity.x);
            }
            else {
                movementPoint.velocity.x = Math.max(0, movementPoint.velocity.x);
            }
        }
        if (!isInGoalYRange && movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            if (invertSpeed) {
                movementPoint.velocity.x = -Math.abs(movementPoint.velocity.x);
            }
            else {
                movementPoint.velocity.x = Math.min(0, movementPoint.velocity.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            if (invertSpeed) {
                movementPoint.velocity.y = Math.abs(movementPoint.velocity.y);
            }
            else {
                movementPoint.velocity.y = Math.max(0, movementPoint.velocity.y);
            }
        }
        if (movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            if (invertSpeed) {
                movementPoint.velocity.y = -Math.abs(movementPoint.velocity.y);
            }
            else {
                movementPoint.velocity.y = Math.min(0, movementPoint.velocity.y);
            }
        }
    }
    getGoalBorderLimits(size, playerSide) {
        const cfg = this.gameConfigs;
        const top = cfg.goalYOffset + size;
        const bottom = cfg.goalYOffset + cfg.goalHeight - size;
        if (playerSide === PlayerSide_1.PlayerSide.LEFT) {
            return new BorderLimits_1.BorderLimits(size, cfg.fieldXOffset - size, top, bottom);
        }
        return new BorderLimits_1.BorderLimits(cfg.fieldXOffset + cfg.fieldWidth + size, cfg.width - size, top, bottom);
    }
}
exports.AbstractCollisionStrategy = AbstractCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/BallBorderCollisionStrategy.ts"
/*!******************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/BallBorderCollisionStrategy.ts ***!
  \******************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallBorderCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class BallBorderCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            gameWorld.ball.ballStatus === BallStatus_1.BallStatus.FREE);
    }
    apply(gameWorld) {
        const ballMovement = gameWorld.ball.movementPosition;
        this.handleBorderCollision(ballMovement, this.getFieldBorderLimits(ballMovement.size), true, false);
        this.checkIfBallInsideGoal(gameWorld, PlayerSide_1.PlayerSide.LEFT);
        this.checkIfBallInsideGoal(gameWorld, PlayerSide_1.PlayerSide.RIGHT);
    }
    checkIfBallInsideGoal(gameWorld, playerSide) {
        const ballMovement = gameWorld.ball.movementPosition;
        const goalBorder = this.getGoalBorderLimits(ballMovement.size, playerSide);
        if (goalBorder.isPointInside(ballMovement.position)) {
            gameWorld.score.increaseScore(playerSide);
            gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        }
    }
}
exports.BallBorderCollisionStrategy = BallBorderCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/BallGoalCollisionStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/BallGoalCollisionStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallGoalCollisionStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class BallGoalCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL &&
            gameWorld.ball.movementPosition.getSpeed() > 0);
    }
    apply(gameWorld) {
        const ballMovement = gameWorld.ball.movementPosition;
        let side = PlayerSide_1.PlayerSide.LEFT;
        if (ballMovement.position.x >
            this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth / 2) {
            side = PlayerSide_1.PlayerSide.RIGHT;
        }
        const goalBorder = this.getGoalBorderLimits(ballMovement.size, side);
        this.handleBorderCollision(ballMovement, goalBorder, true, true);
    }
}
exports.BallGoalCollisionStrategy = BallGoalCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/BallGoalStakesCollisionStrategy.ts"
/*!**********************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/BallGoalStakesCollisionStrategy.ts ***!
  \**********************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallGoalStakesCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class BallGoalStakesCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            gameWorld.ball.ballStatus === BallStatus_1.BallStatus.FREE);
    }
    apply(gameWorld) {
        gameWorld.goalPosts.positions.forEach(position => {
            if (Point_1.Point.getDistance(gameWorld.ball.movementPosition.position, position) <
                gameWorld.ball.movementPosition.size + gameWorld.goalPosts.radius) {
                const angle = Point_1.Point.getAngleBetweenPoints(gameWorld.ball.movementPosition.position, position) - Math.PI;
                gameWorld.ball.movementPosition.setSpeed(gameWorld.ball.movementPosition.getSpeed(), angle);
                gameWorld.ball.movementPosition.position.x =
                    position.x + Math.cos(angle) * gameWorld.goalPosts.radius;
                gameWorld.ball.movementPosition.position.y =
                    position.y + Math.sin(angle) * gameWorld.goalPosts.radius;
            }
        });
    }
}
exports.BallGoalStakesCollisionStrategy = BallGoalStakesCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/BallPlayerCollisionStrategy.ts"
/*!******************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/BallPlayerCollisionStrategy.ts ***!
  \******************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallPlayerCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class BallPlayerCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(gameWorld) {
        return (gameWorld.ball.ballStatus === BallStatus_1.BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING);
    }
    apply(gameWorld) {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
            if (MovementPoint_1.MovementPoint.areTouching(gameWorld.ball.movementPosition, player.movementPosition)) {
                gameWorld.ball.attachToPlayer(player);
            }
        });
    }
}
exports.BallPlayerCollisionStrategy = BallPlayerCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/PlayerBorderCollisionStrategy.ts"
/*!********************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/PlayerBorderCollisionStrategy.ts ***!
  \********************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerBorderCollisionStrategy = void 0;
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class PlayerBorderCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(_gameWorld) {
        return true;
    }
    apply(gameWorld) {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
            this.handleBorderCollision(player.movementPosition, this.getFieldBorderLimits(player.movementPosition.size), false);
        });
    }
}
exports.PlayerBorderCollisionStrategy = PlayerBorderCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/PlayerCollisionStrategy.ts"
/*!**************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/PlayerCollisionStrategy.ts ***!
  \**************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class PlayerCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(_gameWorld) {
        return true;
    }
    apply(gameWorld) {
        const humanPlayer = gameWorld.players.find(player => !player.isSubstitute && !player.isCpu);
        const cpuPlayer = gameWorld.players.find(player => !player.isSubstitute && player.isCpu);
        if (humanPlayer === undefined || cpuPlayer === undefined) {
            return;
        }
        if (MovementPoint_1.MovementPoint.areTouching(humanPlayer.movementPosition, cpuPlayer.movementPosition)) {
            const intersectionPoint = new Point_1.Point((humanPlayer.movementPosition.position.x + cpuPlayer.movementPosition.position.x) /
                2, (humanPlayer.movementPosition.position.y + cpuPlayer.movementPosition.position.y) /
                2);
            const collisionSpeed = (humanPlayer.movementPosition.getSpeed() + cpuPlayer.movementPosition.getSpeed()) /
                2;
            this.bouncePlayers(humanPlayer, cpuPlayer, intersectionPoint, collisionSpeed);
            this.bouncePlayers(cpuPlayer, humanPlayer, intersectionPoint, collisionSpeed);
            const ball = gameWorld.ball;
            if (ball.ballStatus === BallStatus_1.BallStatus.ATTACHED) {
                ball.movementPosition.setSpeed(collisionSpeed, Point_1.Point.getAngleBetweenPoints(intersectionPoint, ball.movementPosition.position));
                ball.ballStatus = BallStatus_1.BallStatus.FREE;
            }
        }
    }
    bouncePlayers(player1, player2, intersectionPoint, collisionSpeed) {
        const angle = Point_1.Point.getAngleBetweenPoints(player1.movementPosition.position, intersectionPoint) -
            Math.PI;
        player1.movementPosition.setSpeed(collisionSpeed, angle);
        player1.movementPosition.position.x =
            intersectionPoint.x + Math.cos(angle) * player2.movementPosition.size;
        player1.movementPosition.position.y =
            intersectionPoint.y + Math.sin(angle) * player2.movementPosition.size;
    }
}
exports.PlayerCollisionStrategy = PlayerCollisionStrategy;


/***/ },

/***/ "./src/game/systems/movement/MovementSystem.ts"
/*!*****************************************************!*\
  !*** ./src/game/systems/movement/MovementSystem.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementSystem = void 0;
const AttachedWithKeyPressedBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/AttachedWithKeyPressedBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts");
const AttachedWithoutKeyPressedBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy.ts");
const PlayingFreeBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/PlayingFreeBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts");
const WaitingBallBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/WaitingBallBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/WaitingBallBallMovementStrategy.ts");
const InputPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/InputPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/InputPlayerMovementStrategy.ts");
const MenuMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/MenuMovementStrategy */ "./src/game/systems/movement/playersStrategies/MenuMovementStrategy.ts");
const WaitingBallMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/WaitingBallMovementStrategy */ "./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs, keyboardInputManager) {
        this.playerStrategies = [];
        this.ballStrategies = [];
        this.playerStrategies.push(new MenuMovementStrategy_1.MenuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallMovementStrategy_1.WaitingBallMovementStrategy());
        this.playerStrategies.push(new InputPlayerMovementStrategy_1.InputPlayerMovementStrategy(keyboardInputManager));
        //this.playerStrategies.push(new CpuMovementStrategy(gameConfigs));
        this.ballStrategies.push(new WaitingBallBallMovementStrategy_1.WaitingBallBallMovementStrategy());
        this.ballStrategies.push(new PlayingFreeBallMovementStrategy_1.PlayingFreeBallMovementStrategy());
        this.ballStrategies.push(new AttachedWithoutKeyPressedBallMovementStrategy_1.AttachedWithoutKeyPressedBallMovementStrategy(keyboardInputManager));
        this.ballStrategies.push(new AttachedWithKeyPressedBallMovementStrategy_1.AttachedWithKeyPressedBallMovementStrategy(keyboardInputManager));
    }
    update(gameWorld, deltaMs) {
        this.updatePlayers(gameWorld, deltaMs);
        this.updateBall(gameWorld, deltaMs);
    }
    updatePlayers(gameWorld, deltaMs) {
        gameWorld.players.forEach(player => {
            this.playerStrategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.move(deltaMs);
        });
    }
    updateBall(gameWorld, deltaMs) {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
    }
}
exports.MovementSystem = MovementSystem;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts"
/*!************************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts ***!
  \************************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttachedWithKeyPressedBallMovementStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Keys_1 = __webpack_require__(/*! ../../../enums/Keys */ "./src/game/enums/Keys.ts");
class AttachedWithKeyPressedBallMovementStrategy {
    constructor(keyboardInputManager) {
        this.keyboardInputManager = keyboardInputManager;
    }
    canBeApplied(ball, gameWorld) {
        const player = ball.attachedPlayer;
        return (ball.ballStatus === BallStatus_1.BallStatus.ATTACHED &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            player !== null &&
            !player.isCpu &&
            this.keyboardInputManager.isKeyPressed(Keys_1.Keys.SPACE));
    }
    apply(ball, _gameWorld, deltaMs) {
        ball.detachFromPlayer();
        ball.move(deltaMs);
    }
}
exports.AttachedWithKeyPressedBallMovementStrategy = AttachedWithKeyPressedBallMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy.ts"
/*!***************************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy.ts ***!
  \***************************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AttachedWithoutKeyPressedBallMovementStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Keys_1 = __webpack_require__(/*! ../../../enums/Keys */ "./src/game/enums/Keys.ts");
class AttachedWithoutKeyPressedBallMovementStrategy {
    constructor(keyboardInputManager) {
        this.angleTollerance = Math.PI / 30;
        this.keyboardInputManager = keyboardInputManager;
    }
    canBeApplied(ball, gameWorld) {
        return (ball.ballStatus === BallStatus_1.BallStatus.ATTACHED &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            !this.keyboardInputManager.isKeyPressed(Keys_1.Keys.SPACE));
    }
    apply(ball, _gameWorld, deltaMs) {
        const player = ball.attachedPlayer;
        if (player === null) {
            return;
        }
        this.adjustBallPositionAroundPlayer(ball, player, deltaMs);
    }
    adjustBallPositionAroundPlayer(ball, player, deltaMs) {
        const combinedSize = player.movementPosition.size + ball.movementPosition.size;
        ball.movementPosition.position.x =
            player.movementPosition.position.x + Math.cos(ball.angleWithPlayer) * combinedSize;
        ball.movementPosition.position.y =
            player.movementPosition.position.y + Math.sin(ball.angleWithPlayer) * combinedSize;
        const speed = player.movementPosition.getSpeed();
        if (speed > 0) {
            const targetAngle = player.movementPosition.getSpeedAngle() + Math.PI;
            const angleDifference = this.normalizeAngle(targetAngle - ball.angleWithPlayer);
            if (Math.abs(angleDifference) > this.angleTollerance) {
                const step = (speed / player.maxSpeedWithBall) * 0.01 * deltaMs;
                ball.angleWithPlayer += angleDifference > 0 ? step : -step;
            }
            ball.angleWithPlayer = this.normalizeAngle(ball.angleWithPlayer);
        }
    }
    normalizeAngle(angle) {
        while (angle > Math.PI) {
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI) {
            angle += 2 * Math.PI;
        }
        return angle;
    }
}
exports.AttachedWithoutKeyPressedBallMovementStrategy = AttachedWithoutKeyPressedBallMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts"
/*!*************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts ***!
  \*************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayingFreeBallMovementStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class PlayingFreeBallMovementStrategy {
    canBeApplied(ball, gameWorld) {
        return (ball.ballStatus === BallStatus_1.BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING);
    }
    apply(ball, _gameWorld, deltaMs) {
        ball.setForStartGame();
        ball.move(deltaMs);
    }
}
exports.PlayingFreeBallMovementStrategy = PlayingFreeBallMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/WaitingBallBallMovementStrategy.ts"
/*!*************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/WaitingBallBallMovementStrategy.ts ***!
  \*************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaitingBallBallMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class WaitingBallBallMovementStrategy {
    canBeApplied(_ball, gameWorld) {
        return gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL;
    }
    apply(ball, _gameWorld, deltaMs) {
        if (ball.movementPosition.getSpeed() > 0) {
            ball.move(deltaMs);
        }
        else {
            ball.resetToStartGame();
        }
    }
}
exports.WaitingBallBallMovementStrategy = WaitingBallBallMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/InputPlayerMovementStrategy.ts"
/*!************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/InputPlayerMovementStrategy.ts ***!
  \************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InputPlayerMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Keys_1 = __webpack_require__(/*! ../../../enums/Keys */ "./src/game/enums/Keys.ts");
class InputPlayerMovementStrategy {
    constructor(keyboardInputManager) {
        this.keyboardInputManager = keyboardInputManager;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            !player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING);
    }
    apply(player, _gameWorld, deltaMs) {
        const horizontalKey = this.keyboardInputManager.getDirectionPressed(Keys_1.KeysDirection.HORIZONTAL);
        const verticalKey = this.keyboardInputManager.getDirectionPressed(Keys_1.KeysDirection.VERTICAL);
        player.movementPosition.velocity.x = this.applyAxisMovement(player.movementPosition.velocity.x, player.movementPosition.acceleration, deltaMs, horizontalKey, Keys_1.Keys.ARROW_LEFT, Keys_1.Keys.ARROW_RIGHT);
        player.movementPosition.velocity.y = this.applyAxisMovement(player.movementPosition.velocity.y, player.movementPosition.acceleration, deltaMs, verticalKey, Keys_1.Keys.ARROW_UP, Keys_1.Keys.ARROW_DOWN);
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

/***/ "./src/game/systems/movement/playersStrategies/MenuMovementStrategy.ts"
/*!*****************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/MenuMovementStrategy.ts ***!
  \*****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class MenuMovementStrategy {
    constructor(gameConfigs) {
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
            player.destinationPosition.velocity = new Point_1.Point(0, 0);
            player.destinationPosition.acceleration = 0;
            player.currentMaxSpeed =
                (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}
exports.MenuMovementStrategy = MenuMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts"
/*!************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts ***!
  \************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaitingBallMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class WaitingBallMovementStrategy {
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL);
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            player.resetToStartGame();
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
        if (player.reachedDestinationPosition() &&
            gameWorld.ball.movementPosition.getSpeed() === 0) {
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
const ScoreManager_1 = __webpack_require__(/*! ../managers/ScoreManager */ "./src/game/managers/ScoreManager.ts");
class GameWorld {
    constructor(gameConfigs, assetLoader) {
        this.players = [];
        this.goalPosts = new GoalPosts_1.GoalPosts(gameConfigs);
        this.players.push(Player_1.Player.createHumanPlayer(gameConfigs));
        this.players.push(Player_1.Player.createCpuPlayer(gameConfigs));
        this.players.push(Player_1.Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player_1.Player.createRightSubstitutePlayer(gameConfigs));
        this.ball = new Ball_1.Ball(gameConfigs);
        this.score = new ScoreManager_1.ScoreManager();
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
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING ||
            (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL &&
                gameWorld.ball.movementPosition.getSpeed() > 0)) {
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
        this.scoreRender.render(gameWorld);
        this.ballRender.render(gameWorld);
        this.playerRender.render(gameWorld);
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
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerRender = void 0;
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
        this.totalNumbers = 9;
        this.frameTime = 30;
        this.scoreContext = scoreContext;
        this.digitsImages = assetLoader.getImage("digits.png");
        this.innerImageDimensions = new Dimensions_1.Dimensions(this.digitsImages.width, this.digitsImages.height / (this.totalNumbers * this.frameForNumber + 1));
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
    render(gameWorld) {
        this.scoreContext.clearRect(0, 0, this.scoreContext.canvas.width, this.scoreContext.canvas.height);
        const scoreArray = gameWorld.score.getScoreAsArray();
        scoreArray.forEach((number, index) => {
            let maxFrame = number * this.frameForNumber;
            let frame = maxFrame;
            if (frame > 0 && gameWorld.score.shouldAnimateIndex(index)) {
                const minFrame = (number - 1) * this.frameForNumber;
                frame =
                    minFrame +
                        Math.floor((Date.now() - gameWorld.score.lastUpdate) / this.frameTime);
                frame = Math.min(frame, maxFrame);
            }
            this.scoreContext.drawImage(this.digitsImages, 0, this.innerImageDimensions.height * frame, this.innerImageDimensions.width, this.innerImageDimensions.height, this.positionArray[index].x, this.positionArray[index].y, this.scoreDimensions.width, this.scoreDimensions.height);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsSUFBSSxZQUFZO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2Fzc2V0cy9Bc3NldExvYWRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvY29yZS9HYW1lTG9vcC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9CYWxsLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0dvYWxQb3N0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Ib3ZlcmFibGVFbnRpdHkudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvTWVudUJ1dHRvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9QbGF5ZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvQmFsbFN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9HYW1lU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0tleXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUGxheWVyU2lkZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Cb3JkZXJMaW1pdHMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9ucy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L1BvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL1Njb3JlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL1BsYXllckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvTW92ZW1lbnRTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3dvcmxkL0dhbWVXb3JsZC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvS2V5Ym9hcmRJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2lucHV0L01vdXNlSW5wdXRNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvQmFsbFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvR2F0ZXNSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1BsYXllclJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1Njb3JlUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9VSUludGVyYWN0aW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmltYWdlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5JTUFHRV9OQU1FUy5tYXAoZmlsZU5hbWUgPT4gdGhpcy5sb2FkSW1hZ2UoZmlsZU5hbWUsIGAke3RoaXMuSU1BR0VfRk9MREVSfSR7ZmlsZU5hbWV9YCkpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aW1hZ2VOYW1lfSBpbWFnZSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IENvbGxpc2lvblN5c3RlbV8xID0gcmVxdWlyZShcIi4uL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vQ29sbGlzaW9uU3lzdGVtXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvTW92ZW1lbnRTeXN0ZW1cIik7XG5jb25zdCBHYW1lV29ybGRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3dvcmxkL0dhbWVXb3JsZFwiKTtcbmNvbnN0IEtleWJvYXJkSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvS2V5Ym9hcmRJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNb3VzZUlucHV0TWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL2lucHV0L01vdXNlSW5wdXRNYW5hZ2VyXCIpO1xuY29uc3QgTWFpblJlbmRlcl8xID0gcmVxdWlyZShcIi4uL3JlbmRlcmluZy9NYWluUmVuZGVyXCIpO1xuY29uc3QgVUlJbnRlcmFjdGlvblN5c3RlbV8xID0gcmVxdWlyZShcIi4uL3VpL1VJSW50ZXJhY3Rpb25TeXN0ZW1cIik7XG5jbGFzcyBHYW1lTG9vcCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLnN5c3RlbXMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyID0gbmV3IE1haW5SZW5kZXJfMS5NYWluUmVuZGVyKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkID0gbmV3IEdhbWVXb3JsZF8xLkdhbWVXb3JsZChnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0gPSBuZXcgVUlJbnRlcmFjdGlvblN5c3RlbV8xLlVJSW50ZXJhY3Rpb25TeXN0ZW0obmV3IE1vdXNlSW5wdXRNYW5hZ2VyXzEuTW91c2VJbnB1dE1hbmFnZXIoZG9tSGFuZGxlci5tZW51Q2FudmFzKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgbWFpbigpIHtcbiAgICAgICAgY29uc3QgdGljayA9ICh0aW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2VGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdGltZSAtIHRoaXMucHJldlRpbWU7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJbnB1dHMoZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5mb3JFYWNoKHN5c3RlbSA9PiBzeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLCBkZWx0YSkpO1xuICAgIH1cbiAgICB1cGRhdGVJbnB1dHMoZGVsdGEpIHtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZC5tZW51QnV0dG9uLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgfSwgZGVsdGEpO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMubWFpblJlbmRlci5yZW5kZXIodGhpcy5nYW1lV29ybGQpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUxvb3AgPSBHYW1lTG9vcDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBCYWxsIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmdsZVdpdGhQbGF5ZXIgPSAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pc1NldEZvclN0YXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMubWF4U3BlZWQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDQwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IHRoaXMubWF4U3BlZWQgLyAyMDAwO1xuICAgIH1cbiAgICBzZXRGb3JTdGFydEdhbWUoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1NldEZvclN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICsgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUpO1xuICAgICAgICAgICAgY29uc3Qgc3BlZWQgPSBNYXRoLnJhbmRvbSgpICogKHRoaXMubWF4U3BlZWQgLSB0aGlzLm1heFNwZWVkIC8gMy4zMykgKyB0aGlzLm1heFNwZWVkIC8gMy4zMztcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlID0gTWF0aC5QSSAvIDIgKyAoKE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJKSAvIDQuNSAtIE1hdGguUEkgLyA5KTtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChzcGVlZCwgYW5nbGUpO1xuICAgICAgICAgICAgdGhpcy5pc1NldEZvclN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXNldFRvU3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKDAsIDApO1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmRlY3JlbWVudFNwZWVkKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhdHRhY2hUb1BsYXllcihwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IHBsYXllcjtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQ7XG4gICAgICAgIHRoaXMuYW5nbGVXaXRoUGxheWVyID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgfVxuICAgIGRldGFjaEZyb21QbGF5ZXIoKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQodGhpcy5tYXhTcGVlZCwgdGhpcy5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbCA9IEJhbGw7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR29hbFBvc3RzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEdvYWxQb3N0cyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzO1xuICAgIH1cbn1cbmV4cG9ydHMuR29hbFBvc3RzID0gR29hbFBvc3RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IHZvaWQgMDtcbmNsYXNzIEhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmhvdmVyUHJvZ3Jlc3MgPSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gSG92ZXJhYmxlRW50aXR5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVCdXR0b24gPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBIb3ZlcmFibGVFbnRpdHlfMSA9IHJlcXVpcmUoXCIuL0hvdmVyYWJsZUVudGl0eVwiKTtcbmNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBIb3ZlcmFibGVFbnRpdHlfMS5Ib3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCByZWZXaWR0aCwgcmVmSGVpZ2h0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTtcbiAgICAgICAgdGhpcy5kaW1lbnNpb24gPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoaGVpZ2h0ICogKHJlZldpZHRoIC8gcmVmSGVpZ2h0KSwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIChnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5kaW1lbnNpb24ud2lkdGgpIC8gMiwgKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5kaW1lbnNpb24uaGVpZ2h0KSAvIDIpO1xuICAgIH1cbiAgICBjb250YWlucyhwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5wb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucG9zaXRpb24ueCArIHRoaXMuZGltZW5zaW9uLndpZHRoICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMucG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpO1xuICAgIH1cbiAgICBnZXRUcmFuc2l0aW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIDEwMDtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVCdXR0b24gPSBNZW51QnV0dG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgaXNDcHUsIGlzU3Vic3RpdHV0ZSwgc2lkZSwgY29sb3JJbmRleCkge1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gMDtcbiAgICAgICAgdGhpcy5pc1N0dW5uZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ub3JtYWxNYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTAwO1xuICAgICAgICB0aGlzLm1heFNwZWVkV2l0aEJhbGwgPSB0aGlzLm5vcm1hbE1heFNwZWVkIC8gMS4zMzI7XG4gICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAzMDA7XG4gICAgICAgIHRoaXMuY2xvc2VUb1BvaW50RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplID0gZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMuaXNDcHUgPSBpc0NwdTtcbiAgICAgICAgdGhpcy5pc1N1YnN0aXR1dGUgPSBpc1N1YnN0aXR1dGU7XG4gICAgICAgIHRoaXMuc2lkZSA9IHNpZGU7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IGNvbG9ySW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgdHJ1ZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMSk7XG4gICAgfVxuICAgIHJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UodGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKTtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICB9XG4gICAgYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ZWRQb3NpdGlvbiA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wcm9qZWN0VG9GaW5hbFBvc2l0aW9uKCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHModGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICBpZiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShwcm9qZWN0ZWRQb3NpdGlvbiwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKSA8XG4gICAgICAgICAgICB0aGlzLnJlYWNoZWREaXN0YW5jZVRvbGVyYW5jZSkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFNwZWVkID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFNwZWVkID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXMsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbmV3U3BlZWQgLyBjdXJyZW50U3BlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRYID0gTWF0aC5jb3MoYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRZID0gTWF0aC5zaW4oYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBsZXQgc3RlZXJYID0gZGVzaXJlZFNwZWVkWCAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS54O1xuICAgICAgICAgICAgbGV0IHN0ZWVyWSA9IGRlc2lyZWRTcGVlZFkgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueTtcbiAgICAgICAgICAgIGNvbnN0IHN0ZWVyTWFnbml0dWRlID0gTWF0aC5zcXJ0KHN0ZWVyWCAqIHN0ZWVyWCArIHN0ZWVyWSAqIHN0ZWVyWSk7XG4gICAgICAgICAgICBjb25zdCBtYXhTdGVlciA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICAgICAgaWYgKHN0ZWVyTWFnbml0dWRlID4gbWF4U3RlZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFN0ZWVyIC8gc3RlZXJNYWduaXR1ZGU7XG4gICAgICAgICAgICAgICAgc3RlZXJYICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHN0ZWVyWSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS54ICs9IHN0ZWVyWDtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55ICs9IHN0ZWVyWTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi54LCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFkanVzdFRvTWF4U3BlZWQodGhpcy5jdXJyZW50TWF4U3BlZWQpO1xuICAgIH1cbiAgICByZXNldFRvU3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXhTcGVlZCA9IHRoaXMubm9ybWFsTWF4U3BlZWQ7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgIH1cbiAgICBpbml0UG9zaXRpb25zKGdhbWVDb25maWdzKSB7XG4gICAgICAgIGxldCBvZmZzZXRYID0gMDtcbiAgICAgICAgaWYgKHRoaXMuaXNTdWJzdGl0dXRlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueCA9IGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIG9mZnNldFg7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllciA9IFBsYXllcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsU3RhdHVzID0gdm9pZCAwO1xudmFyIEJhbGxTdGF0dXM7XG4oZnVuY3Rpb24gKEJhbGxTdGF0dXMpIHtcbiAgICBCYWxsU3RhdHVzW1wiRlJFRVwiXSA9IFwiRlJFRVwiO1xuICAgIEJhbGxTdGF0dXNbXCJBVFRBQ0hFRFwiXSA9IFwiQVRUQUNIRURcIjtcbiAgICBCYWxsU3RhdHVzW1wiR09BTF9TQ09SRURcIl0gPSBcIkdPQUxfU0NPUkVEXCI7XG59KShCYWxsU3RhdHVzIHx8IChleHBvcnRzLkJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzID0gdm9pZCAwO1xudmFyIEdhbWVTdGF0dXM7XG4oZnVuY3Rpb24gKEdhbWVTdGF0dXMpIHtcbiAgICBHYW1lU3RhdHVzW1wiTUVOVVwiXSA9IFwiTUVOVVwiO1xuICAgIEdhbWVTdGF0dXNbXCJXQUlUSU5HX0JBTExcIl0gPSBcIldBSVRJTkdfQkFMTFwiO1xuICAgIEdhbWVTdGF0dXNbXCJQTEFZSU5HXCJdID0gXCJQTEFZSU5HXCI7XG59KShHYW1lU3RhdHVzIHx8IChleHBvcnRzLkdhbWVTdGF0dXMgPSBHYW1lU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlzVXRpbGl0aWVzID0gZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gZXhwb3J0cy5LZXlzID0gdm9pZCAwO1xudmFyIEtleXM7XG4oZnVuY3Rpb24gKEtleXMpIHtcbiAgICBLZXlzW1wiQVJST1dfRE9XTlwiXSA9IFwiQXJyb3dEb3duXCI7XG4gICAgS2V5c1tcIkFSUk9XX1VQXCJdID0gXCJBcnJvd1VwXCI7XG4gICAgS2V5c1tcIkFSUk9XX0xFRlRcIl0gPSBcIkFycm93TGVmdFwiO1xuICAgIEtleXNbXCJBUlJPV19SSUdIVFwiXSA9IFwiQXJyb3dSaWdodFwiO1xuICAgIEtleXNbXCJTUEFDRVwiXSA9IFwiIFwiO1xufSkoS2V5cyB8fCAoZXhwb3J0cy5LZXlzID0gS2V5cyA9IHt9KSk7XG52YXIgS2V5c0RpcmVjdGlvbjtcbihmdW5jdGlvbiAoS2V5c0RpcmVjdGlvbikge1xuICAgIEtleXNEaXJlY3Rpb25bXCJIT1JJWk9OVEFMXCJdID0gXCJIT1JJWk9OVEFMXCI7XG4gICAgS2V5c0RpcmVjdGlvbltcIlZFUlRJQ0FMXCJdID0gXCJWRVJUSUNBTFwiO1xufSkoS2V5c0RpcmVjdGlvbiB8fCAoZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gS2V5c0RpcmVjdGlvbiA9IHt9KSk7XG5jbGFzcyBLZXlzVXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0S2V5RGlyZWN0aW9uKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX0xFRlQgfHwga2V5ID09PSBLZXlzLkFSUk9XX1JJR0hUKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5IT1JJWk9OVEFMO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09IEtleXMuQVJST1dfVVAgfHwga2V5ID09PSBLZXlzLkFSUk9XX0RPV04pIHtcbiAgICAgICAgICAgIHJldHVybiBLZXlzRGlyZWN0aW9uLlZFUlRJQ0FMO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IEtleXNVdGlsaXRpZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyU2lkZSA9IHZvaWQgMDtcbnZhciBQbGF5ZXJTaWRlO1xuKGZ1bmN0aW9uIChQbGF5ZXJTaWRlKSB7XG4gICAgUGxheWVyU2lkZVtcIkxFRlRcIl0gPSBcIkxFRlRcIjtcbiAgICBQbGF5ZXJTaWRlW1wiUklHSFRcIl0gPSBcIlJJR0hUXCI7XG59KShQbGF5ZXJTaWRlIHx8IChleHBvcnRzLlBsYXllclNpZGUgPSBQbGF5ZXJTaWRlID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSB2b2lkIDA7XG5jbGFzcyBCb3JkZXJMaW1pdHMge1xuICAgIGNvbnN0cnVjdG9yKGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSkge1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xuICAgICAgICB0aGlzLmJvdHRvbSA9IGJvdHRvbTtcbiAgICB9XG4gICAgaXNQb2ludEluc2lkZShwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5sZWZ0ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucmlnaHQgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy50b3AgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5ib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gQm9yZGVyTGltaXRzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRpbWVuc2lvbnMgPSB2b2lkIDA7XG5jbGFzcyBEaW1lbnNpb25zIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxufVxuZXhwb3J0cy5EaW1lbnNpb25zID0gRGltZW5zaW9ucztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuL1BvaW50XCIpO1xuY2xhc3MgTW92ZW1lbnRQb2ludCB7XG4gICAgc3RhdGljIGFyZVRvdWNoaW5nKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHBvaW50MS5wb3NpdGlvbiwgcG9pbnQyLnBvc2l0aW9uKSA8IHBvaW50MS5zaXplICsgcG9pbnQyLnNpemU7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCB2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uLCBzaXplKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICB9XG4gICAgdXBkYXRlUG9zaXRpb24oZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gdGhpcy52ZWxvY2l0eS54ICogZGVsdGFNcztcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ICs9IHRoaXMudmVsb2NpdHkueSAqIGRlbHRhTXM7XG4gICAgfVxuICAgIHByb2plY3RUb0ZpbmFsUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi54LCB0aGlzLnZlbG9jaXR5LngpLCB0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi55LCB0aGlzLnZlbG9jaXR5LnkpKTtcbiAgICB9XG4gICAgZ2V0U3BlZWQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy52ZWxvY2l0eS54LCAyKSArIE1hdGgucG93KHRoaXMudmVsb2NpdHkueSwgMikpO1xuICAgIH1cbiAgICBnZXRTcGVlZEFuZ2xlKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnZlbG9jaXR5LnksIHRoaXMudmVsb2NpdHkueCk7XG4gICAgfVxuICAgIGFkanVzdFRvTWF4U3BlZWQobWF4U3BlZWQpIHtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBNYXRoLm1pbih0aGlzLmdldFNwZWVkKCksIG1heFNwZWVkKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSB0aGlzLmdldFNwZWVkQW5nbGUoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBzZXRTcGVlZChzcGVlZCwgYW5nbGUpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBkZWNyZW1lbnRTcGVlZChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMuZ2V0U3BlZWQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbmV3U3BlZWQgLyBjdXJyZW50U3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnggKj0gcmF0aW87XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnkgKj0gcmF0aW87XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbihwb3NpdGlvbiwgc3BlZWQpIHtcbiAgICAgICAgd2hpbGUgKE1hdGguYWJzKHNwZWVkKSA+IDApIHtcbiAgICAgICAgICAgIHBvc2l0aW9uICs9IHNwZWVkO1xuICAgICAgICAgICAgc3BlZWQgPSBNYXRoLnNpZ24oc3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoc3BlZWQpIC0gdGhpcy5hY2NlbGVyYXRpb24sIDApO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHNwZWVkKSA8PSB0aGlzLmFjY2VsZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHNwZWVkID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gTW92ZW1lbnRQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb2ludCA9IHZvaWQgMDtcbmNsYXNzIFBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXREaXN0YW5jZShwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50MS54IC0gcG9pbnQyLngsIDIpICsgTWF0aC5wb3cocG9pbnQxLnkgLSBwb2ludDIueSwgMikpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHBvaW50Mi55IC0gcG9pbnQxLnksIHBvaW50Mi54IC0gcG9pbnQxLngpO1xuICAgIH1cbn1cbmV4cG9ydHMuUG9pbnQgPSBQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgR2FtZVN0YXR1c01hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgIH1cbiAgICBjaGFuZ2VTdGF0dXMoZ2FtZVN0YXR1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gZ2FtZVN0YXR1cztcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhdHVzU3RhcnRUaW1lIDwgMTAwMDtcbiAgICB9XG4gICAgc2NoZWR1bGVTdGF0dXNDaGFuZ2UoZGVsYXksIGdhbWVTdGF0dXMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdFdmVudCA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbmQoZSA9PiBlLmdhbWVTdGF0dXMgPT09IGdhbWVTdGF0dXMpO1xuICAgICAgICBpZiAoIWV4aXN0aW5nRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIHRpbWU6IHRoaXMudGltZSArIGRlbGF5LFxuICAgICAgICAgICAgICAgIGdhbWVTdGF0dXM6IGdhbWVTdGF0dXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy50aW1lICs9IGRlbHRhO1xuICAgICAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy5zY2hlZHVsZWRFdmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWUgPj0gZS50aW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGF0dXMoZS5nYW1lU3RhdHVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbHRlcihlID0+IHRoaXMudGltZSA8IGUudGltZSk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IEdhbWVTdGF0dXNNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY2xhc3MgU2NvcmVNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5sZWZ0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLnJpZ2h0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGVUaW1lID0gMDtcbiAgICAgICAgdGhpcy5sYXN0U2lkZVVwZGF0ZWQgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgIH1cbiAgICBpbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHRTY29yZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZWZ0U2NvcmUrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc3RVcGRhdGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy5sYXN0U2lkZVVwZGF0ZWQgPSBwbGF5ZXJTaWRlO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5sZWZ0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLnJpZ2h0U2NvcmUgPSAwO1xuICAgIH1cbiAgICBnZXRTY29yZUFzQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IFN0cmluZyh0aGlzLmxlZnRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpICsgU3RyaW5nKHRoaXMucmlnaHRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICByZXR1cm4gb3V0cHV0U3RyaW5nLnNwbGl0KFwiXCIpLm1hcChOdW1iZXIpO1xuICAgIH1cbiAgICBzaG91bGRBbmltYXRlSW5kZXgoaW5kZXgpIHtcbiAgICAgICAgaWYgKHRoaXMubGFzdFNpZGVVcGRhdGVkID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAyO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBsYXN0VXBkYXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlVGltZTtcbiAgICB9XG4gICAgZ2V0IGxhc3RTaWRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0U2lkZVVwZGF0ZWQ7XG4gICAgfVxufVxuZXhwb3J0cy5TY29yZU1hbmFnZXIgPSBTY29yZU1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1BsYXllckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQ29sbGlzaW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShnYW1lV29ybGQpKTtcbiAgICB9XG59XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IENvbGxpc2lvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBCb3JkZXJMaW1pdHNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Cb3JkZXJMaW1pdHNcIik7XG5jbGFzcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGdldEZpZWxkQm9yZGVyTGltaXRzKHNpemUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIHNpemUsIGNmZy5maWVsZFhPZmZzZXQgKyBjZmcuZmllbGRXaWR0aCAtIHNpemUsIGNmZy5maWVsZEJvcmRlclNpemUgKyBzaXplLCBjZmcuZmllbGRIZWlnaHQgLSBjZmcuZmllbGRCb3JkZXJTaXplIC0gc2l6ZSk7XG4gICAgfVxuICAgIGhhbmRsZUJvcmRlckNvbGxpc2lvbihtb3ZlbWVudFBvaW50LCBib3JkZXJMaW1pdHMsIGludmVydFNwZWVkLCBhdm9pZEJvdW5jZU9uR29hbCA9IHRydWUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgY29uc3QgaXNJbkdvYWxZUmFuZ2UgPSAhYXZvaWRCb3VuY2VPbkdvYWwgJiZcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA+PSBjZmcuZ29hbFlPZmZzZXQgJiZcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8PSBjZmcuZ29hbFlPZmZzZXQgKyBjZmcuZ29hbEhlaWdodDtcbiAgICAgICAgaWYgKCFpc0luR29hbFlSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPCBib3JkZXJMaW1pdHMubGVmdCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLmxlZnQ7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5tYXgoMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzSW5Hb2FsWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+IGJvcmRlckxpbWl0cy5yaWdodCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLnJpZ2h0O1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLm1pbigwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPCBib3JkZXJMaW1pdHMudG9wKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMudG9wO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGgubWF4KDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA+IGJvcmRlckxpbWl0cy5ib3R0b20pIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy5ib3R0b207XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSAtTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGgubWluKDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0R29hbEJvcmRlckxpbWl0cyhzaXplLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IHRvcCA9IGNmZy5nb2FsWU9mZnNldCArIHNpemU7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IGNmZy5nb2FsWU9mZnNldCArIGNmZy5nb2FsSGVpZ2h0IC0gc2l6ZTtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKHNpemUsIGNmZy5maWVsZFhPZmZzZXQgLSBzaXplLCB0b3AsIGJvdHRvbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoICsgc2l6ZSwgY2ZnLndpZHRoIC0gc2l6ZSwgdG9wLCBib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSA9IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICB0aGlzLmhhbmRsZUJvcmRlckNvbGxpc2lvbihiYWxsTW92ZW1lbnQsIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUpLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpO1xuICAgIH1cbiAgICBjaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIGNvbnN0IGdvYWxCb3JkZXIgPSB0aGlzLmdldEdvYWxCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUsIHBsYXllclNpZGUpO1xuICAgICAgICBpZiAoZ29hbEJvcmRlci5pc1BvaW50SW5zaWRlKGJhbGxNb3ZlbWVudC5wb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5zY29yZS5pbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpO1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPiAwKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIGxldCBzaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVDtcbiAgICAgICAgaWYgKGJhbGxNb3ZlbWVudC5wb3NpdGlvbi54ID5cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMikge1xuICAgICAgICAgICAgc2lkZSA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGdvYWxCb3JkZXIgPSB0aGlzLmdldEdvYWxCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUsIHNpZGUpO1xuICAgICAgICB0aGlzLmhhbmRsZUJvcmRlckNvbGxpc2lvbihiYWxsTW92ZW1lbnQsIGdvYWxCb3JkZXIsIHRydWUsIHRydWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLmdvYWxQb3N0cy5wb3NpdGlvbnMuZm9yRWFjaChwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgICBpZiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBwb3NpdGlvbikgPFxuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uc2l6ZSArIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBwb3NpdGlvbikgLSBNYXRoLlBJO1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpLCBhbmdsZSk7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID1cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueCArIE1hdGguY29zKGFuZ2xlKSAqIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzO1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnkgKyBNYXRoLnNpbihhbmdsZSkgKiBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBpZiAoTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQuYXJlVG91Y2hpbmcoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbiwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYXR0YWNoVG9QbGF5ZXIocGxheWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoX2dhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUJvcmRlckNvbGxpc2lvbihwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbiwgdGhpcy5nZXRGaWVsZEJvcmRlckxpbWl0cyhwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplKSwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgaHVtYW5QbGF5ZXIgPSBnYW1lV29ybGQucGxheWVycy5maW5kKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiAhcGxheWVyLmlzQ3B1KTtcbiAgICAgICAgY29uc3QgY3B1UGxheWVyID0gZ2FtZVdvcmxkLnBsYXllcnMuZmluZChwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgcGxheWVyLmlzQ3B1KTtcbiAgICAgICAgaWYgKGh1bWFuUGxheWVyID09PSB1bmRlZmluZWQgfHwgY3B1UGxheWVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQuYXJlVG91Y2hpbmcoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbiwgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24pKSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3Rpb25Qb2ludCA9IG5ldyBQb2ludF8xLlBvaW50KChodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggKyBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KSAvXG4gICAgICAgICAgICAgICAgMiwgKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAyKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpc2lvblNwZWVkID0gKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpIC9cbiAgICAgICAgICAgICAgICAyO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGh1bWFuUGxheWVyLCBjcHVQbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoY3B1UGxheWVyLCBodW1hblBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhpbnRlcnNlY3Rpb25Qb2ludCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgYmFsbC5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBib3VuY2VQbGF5ZXJzKHBsYXllcjEsIHBsYXllcjIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgaW50ZXJzZWN0aW9uUG9pbnQpIC1cbiAgICAgICAgICAgIE1hdGguUEk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChjb2xsaXNpb25TcGVlZCwgYW5nbGUpO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBpbnRlcnNlY3Rpb25Qb2ludC54ICsgTWF0aC5jb3MoYW5nbGUpICogcGxheWVyMi5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnkgKyBNYXRoLnNpbihhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL1dhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY2xhc3MgTW92ZW1lbnRTeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgTWVudU1vdmVtZW50U3RyYXRlZ3lfMS5NZW51TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgICAgIC8vdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IENwdU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICAgICAgdGhpcy51cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgfVxuICAgIHVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICAgICAgcGxheWVyLm1vdmUoZGVsdGFNcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQuYmFsbCwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50U3lzdGVtID0gTW92ZW1lbnRTeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgcGxheWVyICE9PSBudWxsICYmXG4gICAgICAgICAgICAhcGxheWVyLmlzQ3B1ICYmXG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmlzS2V5UHJlc3NlZChLZXlzXzEuS2V5cy5TUEFDRSkpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuZGV0YWNoRnJvbVBsYXllcigpO1xuICAgICAgICBiYWxsLm1vdmUoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmFuZ2xlVG9sbGVyYW5jZSA9IE1hdGguUEkgLyAzMDtcbiAgICAgICAgdGhpcy5rZXlib2FyZElucHV0TWFuYWdlciA9IGtleWJvYXJkSW5wdXRNYW5hZ2VyO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgICF0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmlzS2V5UHJlc3NlZChLZXlzXzEuS2V5cy5TUEFDRSkpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHBsYXllciA9IGJhbGwuYXR0YWNoZWRQbGF5ZXI7XG4gICAgICAgIGlmIChwbGF5ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RCYWxsUG9zaXRpb25Bcm91bmRQbGF5ZXIoYmFsbCwgcGxheWVyLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGNvbWJpbmVkU2l6ZSA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUgKyBiYWxsLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIE1hdGguY29zKGJhbGwuYW5nbGVXaXRoUGxheWVyKSAqIGNvbWJpbmVkU2l6ZTtcbiAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArIE1hdGguc2luKGJhbGwuYW5nbGVXaXRoUGxheWVyKSAqIGNvbWJpbmVkU2l6ZTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoc3BlZWQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRBbmdsZSA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSArIE1hdGguUEk7XG4gICAgICAgICAgICBjb25zdCBhbmdsZURpZmZlcmVuY2UgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRhcmdldEFuZ2xlIC0gYmFsbC5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGFuZ2xlRGlmZmVyZW5jZSkgPiB0aGlzLmFuZ2xlVG9sbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSAoc3BlZWQgLyBwbGF5ZXIubWF4U3BlZWRXaXRoQmFsbCkgKiAwLjAxICogZGVsdGFNcztcbiAgICAgICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciArPSBhbmdsZURpZmZlcmVuY2UgPiAwID8gc3RlcCA6IC1zdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGJhbGwuYW5nbGVXaXRoUGxheWVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICB3aGlsZSAoYW5nbGUgPiBNYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSAtPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYW5nbGUgPCAtTWF0aC5QSSkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMiAqIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuc2V0Rm9yU3RhcnRHYW1lKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChfYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApIHtcbiAgICAgICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJhbGwucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICAhcGxheWVyLmlzQ3B1ICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBob3Jpem9udGFsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLkhPUklaT05UQUwpO1xuICAgICAgICBjb25zdCB2ZXJ0aWNhbEtleSA9IHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuZ2V0RGlyZWN0aW9uUHJlc3NlZChLZXlzXzEuS2V5c0RpcmVjdGlvbi5WRVJUSUNBTCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LngsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgaG9yaXpvbnRhbEtleSwgS2V5c18xLktleXMuQVJST1dfTEVGVCwgS2V5c18xLktleXMuQVJST1dfUklHSFQpO1xuICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55ID0gdGhpcy5hcHBseUF4aXNNb3ZlbWVudChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24sIGRlbHRhTXMsIHZlcnRpY2FsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19VUCwgS2V5c18xLktleXMuQVJST1dfRE9XTik7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFkanVzdFRvTWF4U3BlZWQocGxheWVyLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIGFwcGx5QXhpc01vdmVtZW50KGN1cnJlbnRTcGVlZCwgYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBrZXksIG5lZ2F0aXZlS2V5LCBwb3NpdGl2ZUtleSkge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgIGlmIChrZXkgPT09IG5lZ2F0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCAtIGRlbHRhO1xuICAgICAgICBpZiAoa2V5ID09PSBwb3NpdGl2ZUtleSlcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3BlZWQgKyBkZWx0YTtcbiAgICAgICAgcmV0dXJuIE1hdGguc2lnbihjdXJyZW50U3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoY3VycmVudFNwZWVkKSAtIGRlbHRhLCAwKTtcbiAgICB9XG59XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTWVudU1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICAgICAgKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodDtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgKChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCkgLyAyO1xuICAgICAgICAgICAgaWYgKHBsYXllci5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggKz0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnZlbG9jaXR5ID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5hY2NlbGVyYXRpb24gPSAwO1xuICAgICAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9XG4gICAgICAgICAgICAgICAgKHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDUpICogTWF0aC5yYW5kb20oKSArIHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDc7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWVudU1vdmVtZW50U3RyYXRlZ3kgPSBNZW51TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHBsYXllci5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA9PT0gMCkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKDIwMDAsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgQmFsbF8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0JhbGxcIik7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXJcIik7XG5jb25zdCBTY29yZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9tYW5hZ2Vycy9TY29yZU1hbmFnZXJcIik7XG5jbGFzcyBHYW1lV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnBsYXllcnMgPSBbXTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdHMgPSBuZXcgR29hbFBvc3RzXzEuR29hbFBvc3RzKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5iYWxsID0gbmV3IEJhbGxfMS5CYWxsKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5zY29yZSA9IG5ldyBTY29yZU1hbmFnZXJfMS5TY29yZU1hbmFnZXIoKTtcbiAgICAgICAgY29uc3QgcGxheUltZyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwicGxheS5wbmdcIik7XG4gICAgICAgIHRoaXMubWVudUJ1dHRvbiA9IG5ldyBNZW51QnV0dG9uXzEuTWVudUJ1dHRvbihnYW1lQ29uZmlncywgcGxheUltZy53aWR0aCwgcGxheUltZy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyID0gbmV3IEdhbWVTdGF0dXNNYW5hZ2VyXzEuR2FtZVN0YXR1c01hbmFnZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVXb3JsZCA9IEdhbWVXb3JsZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0tleXNcIik7XG5jbGFzcyBLZXlib2FyZElucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJlc3NlZEtleXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMub25LZXlEb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmFkZChldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uS2V5VXAgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuZGVsZXRlKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25LZXlEb3duKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXlVcCk7XG4gICAgfVxuICAgIGlzS2V5UHJlc3NlZChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlc3NlZEtleXMuaGFzKGtleSk7XG4gICAgfVxuICAgIGdldERpcmVjdGlvblByZXNzZWQoZGlyZWN0aW9uKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMucHJlc3NlZEtleXMpIHtcbiAgICAgICAgICAgIGlmIChLZXlzXzEuS2V5c1V0aWxpdGllcy5nZXRLZXlEaXJlY3Rpb24oa2V5KSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gS2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNb3VzZUlucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTW91c2VNb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCwgZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICB9XG59XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gTW91c2VJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBCYWxsUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgLy8gVE9ETyBhZGQgZW5sYXJnZW1lbnQgZm9yIHNwZWVkXG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgfHxcbiAgICAgICAgICAgIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMICYmXG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCwgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMzMzM1wiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMzMzAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUmVuZGVyID0gQmFsbFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaWVsZFJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpZWxkUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihiYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLmdvYWxJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZ29hbF9maWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMudHJhY2tGaWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJ0cmFjay5qcGdcIik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGlmICh0aGlzLmFscmVhZHlSZW5kZXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJCYWNrZ3JvdW5kKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQXRobGV0aWNUcmFjaygpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICB0aGlzLnJlbmRlckJvcmRlcigpO1xuICAgICAgICB0aGlzLnJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZW5kZXJCYWNrZ3JvdW5kKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgfVxuICAgIHJlbmRlckJvcmRlcigpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAqIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICB9XG4gICAgcmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0FBQUFBQVwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgZ2FtZVdvcmxkLmdvYWxQb3N0cy5wb3NpdGlvbnMuZm9yRWFjaChwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyQXRobGV0aWNUcmFjaygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy50cmFja0ZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tIZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmllbGRSZW5kZXIgPSBGaWVsZFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlc1JlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEdhdGVzUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYwMDAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC0gdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IDA7IC8vIFRPRE8gZGEgcml2ZWRlcmVcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKE1hdGguUEkgLSBhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gR2F0ZXNSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEJhbGxSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0JhbGxSZW5kZXJcIik7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vRmllbGRSZW5kZXJcIik7XG5jb25zdCBHYXRlc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vR2F0ZXNSZW5kZXJcIik7XG5jb25zdCBNZW51UmVuZGVyXzEgPSByZXF1aXJlKFwiLi9NZW51UmVuZGVyXCIpO1xuY29uc3QgUGxheWVyUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9QbGF5ZXJSZW5kZXJcIik7XG5jb25zdCBTY29yZVJlbmRlcl8xID0gcmVxdWlyZShcIi4vU2NvcmVSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyID0gZG9tSGFuZGxlcjtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlciA9IG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGRvbUhhbmRsZXIuYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuc2NvcmVSZW5kZXIgPSBuZXcgU2NvcmVSZW5kZXJfMS5TY29yZVJlbmRlcihkb21IYW5kbGVyLnNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhdGVzUmVuZGVyID0gbmV3IEdhdGVzUmVuZGVyXzEuR2F0ZXNSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllclJlbmRlciA9IG5ldyBQbGF5ZXJSZW5kZXJfMS5QbGF5ZXJSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLm1lbnVSZW5kZXIgPSBuZXcgTWVudVJlbmRlcl8xLk1lbnVSZW5kZXIoZG9tSGFuZGxlci5tZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmJhbGxSZW5kZXIgPSBuZXcgQmFsbFJlbmRlcl8xLkJhbGxSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5zY29yZVJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5iYWxsUmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLnBsYXllclJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5nYXRlc1JlbmRlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5tZW51UmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgTWVudVJlbmRlciB7XG4gICAgY29uc3RydWN0b3IobWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuaG92ZXJGYWN0b3IgPSAxLjM7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQgPSBtZW51Q29udGV4dDtcbiAgICAgICAgdGhpcy5wbGF5SW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gMSArICh0aGlzLmhvdmVyRmFjdG9yIC0gMSkgKiBnYW1lV29ybGQubWVudUJ1dHRvbi5ob3ZlclByb2dyZXNzO1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgIHRoaXMubWVudUNvbnRleHQuZHJhd0ltYWdlKHRoaXMucGxheUltYWdlLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi54IC1cbiAgICAgICAgICAgICAgICAod2lkdGggLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGgpIC8gMiwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueSAtXG4gICAgICAgICAgICAgICAgKGhlaWdodCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQpIC8gMiwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLk1lbnVSZW5kZXIgPSBNZW51UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIFBsYXllclJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuY29sb3JNYXAgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcIkxFRlQtMFwiLCBcIiMwMDgwMDBcIl0sXG4gICAgICAgICAgICBbXCJMRUZULTFcIiwgXCIjMzM4MDg4XCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMFwiLCBcIiNGRkE1MDBcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0xXCIsIFwiI0ZGRkYwMFwiXSxcbiAgICAgICAgXSk7XG4gICAgICAgIHRoaXMuc3R1bm5lZENvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBcIiMwMDMzMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleSA9IGAke3BsYXllci5zaWRlfS0ke3BsYXllci5jb2xvckluZGV4fWA7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSBwbGF5ZXIuaXNTdHVubmVkID8gdGhpcy5zdHVubmVkQ29sb3IgOiB0aGlzLmNvbG9yTWFwLmdldChjb2xvcktleSk7XG4gICAgICAgICAgICBpZiAoY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gXCIjRkYwMDAwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCksIE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gUGxheWVyUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFNjb3JlUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihzY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZnJhbWVGb3JOdW1iZXIgPSA2O1xuICAgICAgICB0aGlzLnRvdGFsTnVtYmVycyA9IDk7XG4gICAgICAgIHRoaXMuZnJhbWVUaW1lID0gMzA7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0ID0gc2NvcmVDb250ZXh0O1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyh0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aCwgdGhpcy5kaWdpdHNJbWFnZXMuaGVpZ2h0IC8gKHRoaXMudG90YWxOdW1iZXJzICogdGhpcy5mcmFtZUZvck51bWJlciArIDEpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY29yZUFycmF5ID0gZ2FtZVdvcmxkLnNjb3JlLmdldFNjb3JlQXNBcnJheSgpO1xuICAgICAgICBzY29yZUFycmF5LmZvckVhY2goKG51bWJlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXhGcmFtZSA9IG51bWJlciAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICBsZXQgZnJhbWUgPSBtYXhGcmFtZTtcbiAgICAgICAgICAgIGlmIChmcmFtZSA+IDAgJiYgZ2FtZVdvcmxkLnNjb3JlLnNob3VsZEFuaW1hdGVJbmRleChpbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5GcmFtZSA9IChudW1iZXIgLSAxKSAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICAgICAgZnJhbWUgPVxuICAgICAgICAgICAgICAgICAgICBtaW5GcmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gZ2FtZVdvcmxkLnNjb3JlLmxhc3RVcGRhdGUpIC8gdGhpcy5mcmFtZVRpbWUpO1xuICAgICAgICAgICAgICAgIGZyYW1lID0gTWF0aC5taW4oZnJhbWUsIG1heEZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmRpZ2l0c0ltYWdlcywgMCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQgKiBmcmFtZSwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQsIHRoaXMucG9zaXRpb25BcnJheVtpbmRleF0ueCwgdGhpcy5wb3NpdGlvbkFycmF5W2luZGV4XS55LCB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TY29yZVJlbmRlciA9IFNjb3JlUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgW3RoaXMuYmFja2dyb3VuZENhbnZhcywgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImJhY2tncm91bmRDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLnNjb3JlQ2FudmFzLCB0aGlzLnNjb3JlQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcInNjb3JlQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5nYW1lQ2FudmFzLCB0aGlzLmdhbWVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiZ2FtZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMubWVudUNhbnZhcywgdGhpcy5tZW51Q29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcIm1lbnVDYW52YXNcIik7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRDYW52YXMoaWQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IGNvbnRleHQgbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtjYW52YXMsIGNvbnRleHRdO1xuICAgIH1cbn1cbmV4cG9ydHMuRG9tSGFuZGxlciA9IERvbUhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IHZvaWQgMDtcbmNsYXNzIFVJSW50ZXJhY3Rpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB9XG4gICAgdXBkYXRlKGhvdmVyYWJsZSwgb25DbGljaywgZGVsdGFNcykge1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJlZCA9IGhvdmVyYWJsZS5jb250YWlucyh0aGlzLmlucHV0Lm1vdXNlUG9zaXRpb24pO1xuICAgICAgICBpZiAoaG92ZXJhYmxlLmhvdmVyZWQgJiYgdGhpcy5pbnB1dC5pc01vdXNlUHJlc3NlZCkge1xuICAgICAgICAgICAgb25DbGljaygpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ZXAgPSAoZGVsdGFNcyAvIGhvdmVyYWJsZS5nZXRUcmFuc2l0aW9uVGltZSgpKSAqIChob3ZlcmFibGUuaG92ZXJlZCA/IDEgOiAtMSk7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgKyBzdGVwKSk7XG4gICAgfVxufVxuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gVUlJbnRlcmFjdGlvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy5iYWxsQm9yZGVyID0gMTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDI2KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkV2lkdGggLyA0KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIHRoaXMuY3B1U3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgKHRoaXMuZmllbGRXaWR0aCAtIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICAgICAgdGhpcy5maWVsZEJvcmRlclNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyAxMDApO1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0ID0gdGhpcy5maWVsZFdpZHRoIC8gODtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldCA9IHRoaXMuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCA9XG4gICAgICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ICsgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCArIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuZ2F0ZXNMZW5ndGggPSB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyICogMztcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA4MCk7XG4gICAgICAgIHRoaXMuYmFsbFNpemVXaXRoQm9yZGVyID0gdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLmJhbGxCb3JkZXI7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSB0cnVlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91aS9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
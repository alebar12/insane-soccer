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

/***/ "./src/rendering/MainRender.ts"
/*!*************************************!*\
  !*** ./src/rendering/MainRender.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MainRender = void 0;
const BallRender_1 = __webpack_require__(/*! ./impl/BallRender */ "./src/rendering/impl/BallRender.ts");
const FieldRender_1 = __webpack_require__(/*! ./impl/FieldRender */ "./src/rendering/impl/FieldRender.ts");
const GatesRender_1 = __webpack_require__(/*! ./impl/GatesRender */ "./src/rendering/impl/GatesRender.ts");
const MenuRender_1 = __webpack_require__(/*! ./impl/MenuRender */ "./src/rendering/impl/MenuRender.ts");
const PlayerRender_1 = __webpack_require__(/*! ./impl/PlayerRender */ "./src/rendering/impl/PlayerRender.ts");
const ScoreRender_1 = __webpack_require__(/*! ./impl/ScoreRender */ "./src/rendering/impl/ScoreRender.ts");
class MainRender {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.renders = new Array();
        this.domHandler = domHandler;
        this.renders.push(new FieldRender_1.FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader));
        this.renders.push(new ScoreRender_1.ScoreRender(domHandler.scoreContext, assetLoader));
        this.renders.push(new GatesRender_1.GatesRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new PlayerRender_1.PlayerRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new MenuRender_1.MenuRender(domHandler.menuContext, assetLoader));
        this.renders.push(new BallRender_1.BallRender(domHandler.gameContext, gameConfigs));
    }
    render(gameWorld) {
        this.clear();
        this.renders.forEach(render => render.render(gameWorld));
    }
    clear() {
        this.domHandler.gameContext.clearRect(0, 0, this.domHandler.gameCanvas.width, this.domHandler.gameCanvas.height);
    }
}
exports.MainRender = MainRender;


/***/ },

/***/ "./src/rendering/impl/BallRender.ts"
/*!******************************************!*\
  !*** ./src/rendering/impl/BallRender.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallRender = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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

/***/ "./src/rendering/impl/FieldRender.ts"
/*!*******************************************!*\
  !*** ./src/rendering/impl/FieldRender.ts ***!
  \*******************************************/
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

/***/ "./src/rendering/impl/GatesRender.ts"
/*!*******************************************!*\
  !*** ./src/rendering/impl/GatesRender.ts ***!
  \*******************************************/
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

/***/ "./src/rendering/impl/MenuRender.ts"
/*!******************************************!*\
  !*** ./src/rendering/impl/MenuRender.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuRender = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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

/***/ "./src/rendering/impl/PlayerRender.ts"
/*!********************************************!*\
  !*** ./src/rendering/impl/PlayerRender.ts ***!
  \********************************************/
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

/***/ "./src/rendering/impl/ScoreRender.ts"
/*!*******************************************!*\
  !*** ./src/rendering/impl/ScoreRender.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreRender = void 0;
const Dimensions_1 = __webpack_require__(/*! ../../game/geometry/Dimensions */ "./src/game/geometry/Dimensions.ts");
const Point_1 = __webpack_require__(/*! ../../game/geometry/Point */ "./src/game/geometry/Point.ts");
class ScoreRender {
    constructor(scoreContext, assetLoader) {
        this.frameForNumber = 6;
        this.totalNumbers = 9;
        this.totalAnimationTime = 300;
        this.frameTime = this.totalAnimationTime / this.frameForNumber;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0JhbGwudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR29hbFBvc3RzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0hvdmVyYWJsZUVudGl0eS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9NZW51QnV0dG9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL1BsYXllci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9CYWxsU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0dhbWVTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvS2V5cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9QbGF5ZXJTaWRlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0JvcmRlckxpbWl0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L01vdmVtZW50UG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvbWFuYWdlcnMvU2NvcmVNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL0NvbGxpc2lvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL1BsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9Nb3ZlbWVudFN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL1BsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvTWVudU1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvd29ybGQvR2FtZVdvcmxkLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvTW91c2VJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9CYWxsUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9GaWVsZFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvR2F0ZXNSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL01lbnVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL1BsYXllclJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvU2NvcmVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3VpL0RvbUhhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3VpL1VJSW50ZXJhY3Rpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0dhbWVDb25maWdzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSB2b2lkIDA7XG5jbGFzcyBBc3NldExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuSU1BR0VfRk9MREVSID0gXCJpbWFnZXMvXCI7XG4gICAgICAgIHRoaXMuSU1BR0VfTkFNRVMgPSBbXG4gICAgICAgICAgICBcImJhbGxzLnBuZ1wiLFxuICAgICAgICAgICAgXCJmaWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwidHJhY2suanBnXCIsXG4gICAgICAgICAgICBcIlJlZFBhcnRpY2xlLnBuZ1wiLFxuICAgICAgICAgICAgXCJkaWdpdHMucG5nXCIsXG4gICAgICAgICAgICBcImdvYWxfZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInN0YXIucG5nXCIsXG4gICAgICAgICAgICBcInBsYXkucG5nXCIsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBnZXRJbWFnZShpbWFnZU5hbWUpIHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSB0aGlzLmltYWdlcy5nZXQoaW1hZ2VOYW1lKTtcbiAgICAgICAgaWYgKGltYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpbWFnZU5hbWV9IGltYWdlIG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9XG4gICAgbG9hZEltYWdlKG5hbWUsIHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChuYW1lLCBpbWcpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gQXNzZXRMb2FkZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUxvb3AgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgQ29sbGlzaW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW1cIik7XG5jb25zdCBNb3ZlbWVudFN5c3RlbV8xID0gcmVxdWlyZShcIi4uL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9Nb3ZlbWVudFN5c3RlbVwiKTtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlclwiKTtcbmNvbnN0IE1vdXNlSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jb25zdCBVSUludGVyYWN0aW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vdWkvVUlJbnRlcmFjdGlvblN5c3RlbVwiKTtcbmNsYXNzIEdhbWVMb29wIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wcmV2VGltZSA9IDA7XG4gICAgICAgIHRoaXMuc3lzdGVtcyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQgPSBuZXcgR2FtZVdvcmxkXzEuR2FtZVdvcmxkKGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbSA9IG5ldyBVSUludGVyYWN0aW9uU3lzdGVtXzEuVUlJbnRlcmFjdGlvblN5c3RlbShuZXcgTW91c2VJbnB1dE1hbmFnZXJfMS5Nb3VzZUlucHV0TWFuYWdlcihkb21IYW5kbGVyLm1lbnVDYW52YXMpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IE1vdmVtZW50U3lzdGVtXzEuTW92ZW1lbnRTeXN0ZW0oZ2FtZUNvbmZpZ3MsIG5ldyBLZXlib2FyZElucHV0TWFuYWdlcl8xLktleWJvYXJkSW5wdXRNYW5hZ2VyKCkpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IENvbGxpc2lvblN5c3RlbV8xLkNvbGxpc2lvblN5c3RlbShnYW1lQ29uZmlncykpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0cyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLmZvckVhY2goc3lzdGVtID0+IHN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQsIGRlbHRhKSk7XG4gICAgfVxuICAgIHVwZGF0ZUlucHV0cyhkZWx0YSkge1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLm1lbnVCdXR0b24sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9LCBkZWx0YSk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcih0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGwgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEJhbGwge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFuZ2xlV2l0aFBsYXllciA9IDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLmJhbGxTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5tYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNDAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5tYXhTcGVlZCAvIDIwMDA7XG4gICAgfVxuICAgIHNldEZvclN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzU2V0Rm9yU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKyB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhTcGVlZCAtIHRoaXMubWF4U3BlZWQgLyAzLjMzKSArIHRoaXMubWF4U3BlZWQgLyAzLjMzO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLlBJIC8gMiArICgoTWF0aC5yYW5kb20oKSAqIE1hdGguUEkpIC8gNC41IC0gTWF0aC5QSSAvIDkpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoMCwgMCk7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgfVxuICAgIGF0dGFjaFRvUGxheWVyKHBsYXllcikge1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gcGxheWVyO1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRDtcbiAgICAgICAgdGhpcy5hbmdsZVdpdGhQbGF5ZXIgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICB9XG4gICAgZGV0YWNoRnJvbVBsYXllcigpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZCh0aGlzLm1heFNwZWVkLCB0aGlzLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsID0gQmFsbDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Hb2FsUG9zdHMgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgR29hbFBvc3RzIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucmFkaXVzID0gZ2FtZUNvbmZpZ3MuZ29hbFBvc3RSYWRpdXM7XG4gICAgfVxufVxuZXhwb3J0cy5Hb2FsUG9zdHMgPSBHb2FsUG9zdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gdm9pZCAwO1xuY2xhc3MgSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaG92ZXJQcm9ncmVzcyA9IDA7XG4gICAgfVxufVxuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSBIb3ZlcmFibGVFbnRpdHk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudUJ1dHRvbiA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEhvdmVyYWJsZUVudGl0eV8xID0gcmVxdWlyZShcIi4vSG92ZXJhYmxlRW50aXR5XCIpO1xuY2xhc3MgTWVudUJ1dHRvbiBleHRlbmRzIEhvdmVyYWJsZUVudGl0eV8xLkhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIHJlZldpZHRoLCByZWZIZWlnaHQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1O1xuICAgICAgICB0aGlzLmRpbWVuc2lvbiA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyhoZWlnaHQgKiAocmVmV2lkdGggLyByZWZIZWlnaHQpLCBoZWlnaHQpO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgKGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSB0aGlzLmRpbWVuc2lvbi53aWR0aCkgLyAyLCAoZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLSB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpIC8gMik7XG4gICAgfVxuICAgIGNvbnRhaW5zKHBvaW50KSB7XG4gICAgICAgIHJldHVybiAocG9pbnQueCA+PSB0aGlzLnBvc2l0aW9uLnggJiZcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy5wb3NpdGlvbi54ICsgdGhpcy5kaW1lbnNpb24ud2lkdGggJiZcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy5wb3NpdGlvbi55ICYmXG4gICAgICAgICAgICBwb2ludC55IDw9IHRoaXMucG9zaXRpb24ueSArIHRoaXMuZGltZW5zaW9uLmhlaWdodCk7XG4gICAgfVxuICAgIGdldFRyYW5zaXRpb25UaW1lKCkge1xuICAgICAgICByZXR1cm4gMTAwO1xuICAgIH1cbn1cbmV4cG9ydHMuTWVudUJ1dHRvbiA9IE1lbnVCdXR0b247XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBpc0NwdSwgaXNTdWJzdGl0dXRlLCBzaWRlLCBjb2xvckluZGV4KSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLmlzU3R1bm5lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDA7XG4gICAgICAgIHRoaXMubWF4U3BlZWRXaXRoQmFsbCA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAxLjMzMjtcbiAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5ub3JtYWxNYXhTcGVlZCAvIDMwMDtcbiAgICAgICAgdGhpcy5jbG9zZVRvUG9pbnREaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5pc0NwdSA9IGlzQ3B1O1xuICAgICAgICB0aGlzLmlzU3Vic3RpdHV0ZSA9IGlzU3Vic3RpdHV0ZTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gY29sb3JJbmRleDtcbiAgICAgICAgdGhpcy5pbml0UG9zaXRpb25zKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCB0cnVlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAxKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAxKTtcbiAgICB9XG4gICAgcmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZSh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RlZFBvc2l0aW9uID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHByb2plY3RlZFBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFggPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFkgPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGxldCBzdGVlclggPSBkZXNpcmVkU3BlZWRYIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lng7XG4gICAgICAgICAgICBsZXQgc3RlZXJZID0gZGVzaXJlZFNwZWVkWSAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgICAgICBpZiAoc3RlZXJNYWduaXR1ZGUgPiBtYXhTdGVlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4U3RlZXIgLyBzdGVlck1hZ25pdHVkZTtcbiAgICAgICAgICAgICAgICBzdGVlclggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgc3RlZXJZICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKz0gc3RlZXJYO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZCh0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgfVxuICAgIGluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgbGV0IG9mZnNldFggPSAwO1xuICAgICAgICBpZiAodGhpcy5pc1N1YnN0aXR1dGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYXG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi54ID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgb2Zmc2V0WDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyID0gUGxheWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxTdGF0dXMgPSB2b2lkIDA7XG52YXIgQmFsbFN0YXR1cztcbihmdW5jdGlvbiAoQmFsbFN0YXR1cykge1xuICAgIEJhbGxTdGF0dXNbXCJGUkVFXCJdID0gXCJGUkVFXCI7XG4gICAgQmFsbFN0YXR1c1tcIkFUVEFDSEVEXCJdID0gXCJBVFRBQ0hFRFwiO1xuICAgIEJhbGxTdGF0dXNbXCJHT0FMX1NDT1JFRFwiXSA9IFwiR09BTF9TQ09SRURcIjtcbn0pKEJhbGxTdGF0dXMgfHwgKGV4cG9ydHMuQmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXMgPSB2b2lkIDA7XG52YXIgR2FtZVN0YXR1cztcbihmdW5jdGlvbiAoR2FtZVN0YXR1cykge1xuICAgIEdhbWVTdGF0dXNbXCJNRU5VXCJdID0gXCJNRU5VXCI7XG4gICAgR2FtZVN0YXR1c1tcIldBSVRJTkdfQkFMTFwiXSA9IFwiV0FJVElOR19CQUxMXCI7XG4gICAgR2FtZVN0YXR1c1tcIlBMQVlJTkdcIl0gPSBcIlBMQVlJTkdcIjtcbn0pKEdhbWVTdGF0dXMgfHwgKGV4cG9ydHMuR2FtZVN0YXR1cyA9IEdhbWVTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLktleXNVdGlsaXRpZXMgPSBleHBvcnRzLktleXNEaXJlY3Rpb24gPSBleHBvcnRzLktleXMgPSB2b2lkIDA7XG52YXIgS2V5cztcbihmdW5jdGlvbiAoS2V5cykge1xuICAgIEtleXNbXCJBUlJPV19ET1dOXCJdID0gXCJBcnJvd0Rvd25cIjtcbiAgICBLZXlzW1wiQVJST1dfVVBcIl0gPSBcIkFycm93VXBcIjtcbiAgICBLZXlzW1wiQVJST1dfTEVGVFwiXSA9IFwiQXJyb3dMZWZ0XCI7XG4gICAgS2V5c1tcIkFSUk9XX1JJR0hUXCJdID0gXCJBcnJvd1JpZ2h0XCI7XG4gICAgS2V5c1tcIlNQQUNFXCJdID0gXCIgXCI7XG59KShLZXlzIHx8IChleHBvcnRzLktleXMgPSBLZXlzID0ge30pKTtcbnZhciBLZXlzRGlyZWN0aW9uO1xuKGZ1bmN0aW9uIChLZXlzRGlyZWN0aW9uKSB7XG4gICAgS2V5c0RpcmVjdGlvbltcIkhPUklaT05UQUxcIl0gPSBcIkhPUklaT05UQUxcIjtcbiAgICBLZXlzRGlyZWN0aW9uW1wiVkVSVElDQUxcIl0gPSBcIlZFUlRJQ0FMXCI7XG59KShLZXlzRGlyZWN0aW9uIHx8IChleHBvcnRzLktleXNEaXJlY3Rpb24gPSBLZXlzRGlyZWN0aW9uID0ge30pKTtcbmNsYXNzIEtleXNVdGlsaXRpZXMge1xuICAgIHN0YXRpYyBnZXRLZXlEaXJlY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmIChrZXkgPT09IEtleXMuQVJST1dfTEVGVCB8fCBrZXkgPT09IEtleXMuQVJST1dfUklHSFQpIHtcbiAgICAgICAgICAgIHJldHVybiBLZXlzRGlyZWN0aW9uLkhPUklaT05UQUw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gS2V5cy5BUlJPV19VUCB8fCBrZXkgPT09IEtleXMuQVJST1dfRE9XTikge1xuICAgICAgICAgICAgcmV0dXJuIEtleXNEaXJlY3Rpb24uVkVSVElDQUw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0cy5LZXlzVXRpbGl0aWVzID0gS2V5c1V0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTaWRlID0gdm9pZCAwO1xudmFyIFBsYXllclNpZGU7XG4oZnVuY3Rpb24gKFBsYXllclNpZGUpIHtcbiAgICBQbGF5ZXJTaWRlW1wiTEVGVFwiXSA9IFwiTEVGVFwiO1xuICAgIFBsYXllclNpZGVbXCJSSUdIVFwiXSA9IFwiUklHSFRcIjtcbn0pKFBsYXllclNpZGUgfHwgKGV4cG9ydHMuUGxheWVyU2lkZSA9IFBsYXllclNpZGUgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvcmRlckxpbWl0cyA9IHZvaWQgMDtcbmNsYXNzIEJvcmRlckxpbWl0cyB7XG4gICAgY29uc3RydWN0b3IobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tKSB7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy50b3AgPSB0b3A7XG4gICAgICAgIHRoaXMuYm90dG9tID0gYm90dG9tO1xuICAgIH1cbiAgICBpc1BvaW50SW5zaWRlKHBvaW50KSB7XG4gICAgICAgIHJldHVybiAocG9pbnQueCA+PSB0aGlzLmxlZnQgJiZcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy5yaWdodCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnRvcCAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLmJvdHRvbSk7XG4gICAgfVxufVxuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSBCb3JkZXJMaW1pdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4vUG9pbnRcIik7XG5jbGFzcyBNb3ZlbWVudFBvaW50IHtcbiAgICBzdGF0aWMgYXJlVG91Y2hpbmcocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocG9pbnQxLnBvc2l0aW9uLCBwb2ludDIucG9zaXRpb24pIDwgcG9pbnQxLnNpemUgKyBwb2ludDIuc2l6ZTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIHZlbG9jaXR5LCBhY2NlbGVyYXRpb24sIHNpemUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgIH1cbiAgICB1cGRhdGVQb3NpdGlvbihkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSB0aGlzLnZlbG9jaXR5LnggKiBkZWx0YU1zO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gdGhpcy52ZWxvY2l0eS55ICogZGVsdGFNcztcbiAgICB9XG4gICAgcHJvamVjdFRvRmluYWxQb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLngsIHRoaXMudmVsb2NpdHkueCksIHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLnksIHRoaXMudmVsb2NpdHkueSkpO1xuICAgIH1cbiAgICBnZXRTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLnZlbG9jaXR5LngsIDIpICsgTWF0aC5wb3codGhpcy52ZWxvY2l0eS55LCAyKSk7XG4gICAgfVxuICAgIGdldFNwZWVkQW5nbGUoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMudmVsb2NpdHkueSwgdGhpcy52ZWxvY2l0eS54KTtcbiAgICB9XG4gICAgYWRqdXN0VG9NYXhTcGVlZChtYXhTcGVlZCkge1xuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgubWluKHRoaXMuZ2V0U3BlZWQoKSwgbWF4U3BlZWQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IHRoaXMuZ2V0U3BlZWRBbmdsZSgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIHNldFNwZWVkKHNwZWVkLCBhbmdsZSkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIGRlY3JlbWVudFNwZWVkKGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFNwZWVkID0gdGhpcy5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoY3VycmVudFNwZWVkID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXMsIDApO1xuICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHBvc2l0aW9uLCBzcGVlZCkge1xuICAgICAgICB3aGlsZSAoTWF0aC5hYnMoc3BlZWQpID4gMCkge1xuICAgICAgICAgICAgcG9zaXRpb24gKz0gc3BlZWQ7XG4gICAgICAgICAgICBzcGVlZCA9IE1hdGguc2lnbihzcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhzcGVlZCkgLSB0aGlzLmFjY2VsZXJhdGlvbiwgMCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3BlZWQpIDw9IHRoaXMuYWNjZWxlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3BlZWQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSBNb3ZlbWVudFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5Qb2ludHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocG9pbnQyLnkgLSBwb2ludDEueSwgcG9pbnQyLnggLSBwb2ludDEueCk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBHYW1lU3RhdHVzTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2dhbWVTdGF0dXMgPSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgICAgICB0aGlzLnN0YXR1c1N0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzID0gW107XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgfVxuICAgIGNoYW5nZVN0YXR1cyhnYW1lU3RhdHVzKSB7XG4gICAgICAgIHRoaXMuX2dhbWVTdGF0dXMgPSBnYW1lU3RhdHVzO1xuICAgICAgICB0aGlzLnN0YXR1c1N0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuICAgIGdldCBnYW1lU3RhdHVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2FtZVN0YXR1cztcbiAgICB9XG4gICAgaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGF0dXNTdGFydFRpbWUgPCAxMDAwO1xuICAgIH1cbiAgICBzY2hlZHVsZVN0YXR1c0NoYW5nZShkZWxheSwgZ2FtZVN0YXR1cykge1xuICAgICAgICBjb25zdCBleGlzdGluZ0V2ZW50ID0gdGhpcy5zY2hlZHVsZWRFdmVudHMuZmluZChlID0+IGUuZ2FtZVN0YXR1cyA9PT0gZ2FtZVN0YXR1cyk7XG4gICAgICAgIGlmICghZXhpc3RpbmdFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdGltZTogdGhpcy50aW1lICsgZGVsYXksXG4gICAgICAgICAgICAgICAgZ2FtZVN0YXR1czogZ2FtZVN0YXR1cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLnNjaGVkdWxlZEV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZSA+PSBlLnRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZVN0YXR1cyhlLmdhbWVTdGF0dXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzID0gdGhpcy5zY2hlZHVsZWRFdmVudHMuZmlsdGVyKGUgPT4gdGhpcy50aW1lIDwgZS50aW1lKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gR2FtZVN0YXR1c01hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jbGFzcyBTY29yZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxlZnRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMucmlnaHRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZVRpbWUgPSAwO1xuICAgICAgICB0aGlzLmxhc3RTaWRlVXBkYXRlZCA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICBpZiAocGxheWVyU2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCkge1xuICAgICAgICAgICAgdGhpcy5yaWdodFNjb3JlKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxlZnRTY29yZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLmxhc3RTaWRlVXBkYXRlZCA9IHBsYXllclNpZGU7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmxlZnRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMucmlnaHRTY29yZSA9IDA7XG4gICAgfVxuICAgIGdldFNjb3JlQXNBcnJheSgpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gU3RyaW5nKHRoaXMubGVmdFNjb3JlKS5wYWRTdGFydCgyLCBcIjBcIikgKyBTdHJpbmcodGhpcy5yaWdodFNjb3JlKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgIHJldHVybiBvdXRwdXRTdHJpbmcuc3BsaXQoXCJcIikubWFwKE51bWJlcik7XG4gICAgfVxuICAgIHNob3VsZEFuaW1hdGVJbmRleChpbmRleCkge1xuICAgICAgICBpZiAodGhpcy5sYXN0U2lkZVVwZGF0ZWQgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPCAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4ID49IDI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGxhc3RVcGRhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RVcGRhdGVUaW1lO1xuICAgIH1cbiAgICBnZXQgbGFzdFNpZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RTaWRlVXBkYXRlZDtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlTWFuYWdlciA9IFNjb3JlTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1BsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBDb2xsaXNpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llc1xuICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gQ29sbGlzaW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEJvcmRlckxpbWl0c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L0JvcmRlckxpbWl0c1wiKTtcbmNsYXNzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgZ2V0RmllbGRCb3JkZXJMaW1pdHMoc2l6ZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoIC0gc2l6ZSwgY2ZnLmZpZWxkQm9yZGVyU2l6ZSArIHNpemUsIGNmZy5maWVsZEhlaWdodCAtIGNmZy5maWVsZEJvcmRlclNpemUgLSBzaXplKTtcbiAgICB9XG4gICAgaGFuZGxlQm9yZGVyQ29sbGlzaW9uKG1vdmVtZW50UG9pbnQsIGJvcmRlckxpbWl0cywgaW52ZXJ0U3BlZWQsIGF2b2lkQm91bmNlT25Hb2FsID0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICBjb25zdCBpc0luR29hbFlSYW5nZSA9ICFhdm9pZEJvdW5jZU9uR29hbCAmJlxuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID49IGNmZy5nb2FsWU9mZnNldCAmJlxuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55IDw9IGNmZy5nb2FsWU9mZnNldCArIGNmZy5nb2FsSGVpZ2h0O1xuICAgICAgICBpZiAoIWlzSW5Hb2FsWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8IGJvcmRlckxpbWl0cy5sZWZ0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMubGVmdDtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLm1heCgwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJbkdvYWxZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID4gYm9yZGVyTGltaXRzLnJpZ2h0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMucmlnaHQ7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSAtTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGgubWluKDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8IGJvcmRlckxpbWl0cy50b3ApIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy50b3A7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5tYXgoMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID4gYm9yZGVyTGltaXRzLmJvdHRvbSkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLmJvdHRvbTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5taW4oMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRHb2FsQm9yZGVyTGltaXRzKHNpemUsIHBsYXllclNpZGUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgY29uc3QgdG9wID0gY2ZnLmdvYWxZT2Zmc2V0ICsgc2l6ZTtcbiAgICAgICAgY29uc3QgYm90dG9tID0gY2ZnLmdvYWxZT2Zmc2V0ICsgY2ZnLmdvYWxIZWlnaHQgLSBzaXplO1xuICAgICAgICBpZiAocGxheWVyU2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCAtIHNpemUsIHRvcCwgYm90dG9tKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgY2ZnLmZpZWxkV2lkdGggKyBzaXplLCBjZmcud2lkdGggLSBzaXplLCB0b3AsIGJvdHRvbSk7XG4gICAgfVxufVxuZXhwb3J0cy5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5ID0gQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgdGhpcy5nZXRGaWVsZEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSksIHRydWUsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5jaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKTtcbiAgICAgICAgdGhpcy5jaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCk7XG4gICAgfVxuICAgIGNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIHBsYXllclNpZGUpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgcGxheWVyU2lkZSk7XG4gICAgICAgIGlmIChnb2FsQm9yZGVyLmlzUG9pbnRJbnNpZGUoYmFsbE1vdmVtZW50LnBvc2l0aW9uKSkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLnNjb3JlLmluY3JlYXNlU2NvcmUocGxheWVyU2lkZSk7XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgbGV0IHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICBpZiAoYmFsbE1vdmVtZW50LnBvc2l0aW9uLnggPlxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyKSB7XG4gICAgICAgICAgICBzaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgc2lkZSk7XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgZ29hbEJvcmRlciwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSA8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplICsgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSAtIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCksIGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICsgTWF0aC5jb3MoYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArIE1hdGguc2luKGFuZ2xlKSAqIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5hdHRhY2hUb1BsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLCB0aGlzLmdldEZpZWxkQm9yZGVyTGltaXRzKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUpLCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIFBsYXllckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKF9nYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBodW1hblBsYXllciA9IGdhbWVXb3JsZC5wbGF5ZXJzLmZpbmQocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmICFwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBjb25zdCBjcHVQbGF5ZXIgPSBnYW1lV29ybGQucGxheWVycy5maW5kKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiBwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBpZiAoaHVtYW5QbGF5ZXIgPT09IHVuZGVmaW5lZCB8fCBjcHVQbGF5ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLCBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAyLCAoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgIDIpO1xuICAgICAgICAgICAgY29uc3QgY29sbGlzaW9uU3BlZWQgPSAoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSkgL1xuICAgICAgICAgICAgICAgIDI7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoaHVtYW5QbGF5ZXIsIGNwdVBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIHRoaXMuYm91bmNlUGxheWVycyhjcHVQbGF5ZXIsIGh1bWFuUGxheWVyLCBpbnRlcnNlY3Rpb25Qb2ludCwgY29sbGlzaW9uU3BlZWQpO1xuICAgICAgICAgICAgY29uc3QgYmFsbCA9IGdhbWVXb3JsZC5iYWxsO1xuICAgICAgICAgICAgaWYgKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQpIHtcbiAgICAgICAgICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoY29sbGlzaW9uU3BlZWQsIFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKGludGVyc2VjdGlvblBvaW50LCBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24pKTtcbiAgICAgICAgICAgICAgICBiYWxsLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGJvdW5jZVBsYXllcnMocGxheWVyMSwgcGxheWVyMiwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKSB7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMocGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBpbnRlcnNlY3Rpb25Qb2ludCkgLVxuICAgICAgICAgICAgTWF0aC5QSTtcbiAgICAgICAgcGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBhbmdsZSk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnggKyBNYXRoLmNvcyhhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICAgICAgcGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgaW50ZXJzZWN0aW9uUG9pbnQueSArIE1hdGguc2luKGFuZ2xlKSAqIHBsYXllcjIubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgTWVudU1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBNZW51TW92ZW1lbnRTdHJhdGVneV8xLk1lbnVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgLy90aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgQ3B1TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUGxheWVycyhnYW1lV29ybGQsIGRlbHRhTXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICB9XG4gICAgdXBkYXRlUGxheWVycyhnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkLmJhbGwsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSBNb3ZlbWVudFN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBiYWxsLmF0dGFjaGVkUGxheWVyO1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIgIT09IG51bGwgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5kZXRhY2hGcm9tUGxheWVyKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuYW5nbGVUb2xsZXJhbmNlID0gTWF0aC5QSSAvIDMwO1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgIXRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgaWYgKHBsYXllciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRqdXN0QmFsbFBvc2l0aW9uQXJvdW5kUGxheWVyKGJhbGwsIHBsYXllciwgZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRTaXplID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSArIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICsgTWF0aC5QSTtcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlRGlmZmVyZW5jZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGFyZ2V0QW5nbGUgLSBiYWxsLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYW5nbGVEaWZmZXJlbmNlKSA+IHRoaXMuYW5nbGVUb2xsZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IChzcGVlZCAvIHBsYXllci5tYXhTcGVlZFdpdGhCYWxsKSAqIDAuMDEgKiBkZWx0YU1zO1xuICAgICAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyICs9IGFuZ2xlRGlmZmVyZW5jZSA+IDAgPyBzdGVwIDogLXN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciA9IHRoaXMubm9ybWFsaXplQW5nbGUoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHdoaWxlIChhbmdsZSA+IE1hdGguUEkpIHtcbiAgICAgICAgICAgIGFuZ2xlIC09IDIgKiBNYXRoLlBJO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChhbmdsZSA8IC1NYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSArPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYW5nbGU7XG4gICAgfVxufVxuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5zZXRGb3JTdGFydEdhbWUoKTtcbiAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKF9iYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEw7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkge1xuICAgICAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYmFsbC5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uSE9SSVpPTlRBTCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLlZFUlRJQ0FMKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBob3Jpem9udGFsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19MRUZULCBLZXlzXzEuS2V5cy5BUlJPV19SSUdIVCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnksIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgdmVydGljYWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX1VQLCBLZXlzXzEuS2V5cy5BUlJPV19ET1dOKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgYXBwbHlBeGlzTW92ZW1lbnQoY3VycmVudFNwZWVkLCBhY2NlbGVyYXRpb24sIGRlbHRhTXMsIGtleSwgbmVnYXRpdmVLZXksIHBvc2l0aXZlS2V5KSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgaWYgKGtleSA9PT0gbmVnYXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkIC0gZGVsdGE7XG4gICAgICAgIGlmIChrZXkgPT09IHBvc2l0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCArIGRlbHRhO1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGN1cnJlbnRTcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhjdXJyZW50U3BlZWQpIC0gZGVsdGEsIDApO1xuICAgIH1cbn1cbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNZW51TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICAoKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoKSAvIDI7XG4gICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCArPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24udmVsb2NpdHkgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IDA7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IE1lbnVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSkge1xuICAgICAgICAgICAgcGxheWVyLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID09PSAwKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuc2NoZWR1bGVTdGF0dXNDaGFuZ2UoMjAwMCwgR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lV29ybGQgPSB2b2lkIDA7XG5jb25zdCBCYWxsXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvQmFsbFwiKTtcbmNvbnN0IEdvYWxQb3N0c18xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0dvYWxQb3N0c1wiKTtcbmNvbnN0IE1lbnVCdXR0b25fMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9NZW51QnV0dG9uXCIpO1xuY29uc3QgUGxheWVyXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvUGxheWVyXCIpO1xuY29uc3QgR2FtZVN0YXR1c01hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9tYW5hZ2Vycy9HYW1lU3RhdHVzTWFuYWdlclwiKTtcbmNvbnN0IFNjb3JlTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL21hbmFnZXJzL1Njb3JlTWFuYWdlclwiKTtcbmNsYXNzIEdhbWVXb3JsZCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICB0aGlzLmdvYWxQb3N0cyA9IG5ldyBHb2FsUG9zdHNfMS5Hb2FsUG9zdHMoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGwgPSBuZXcgQmFsbF8xLkJhbGwoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnNjb3JlID0gbmV3IFNjb3JlTWFuYWdlcl8xLlNjb3JlTWFuYWdlcigpO1xuICAgICAgICBjb25zdCBwbGF5SW1nID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9uID0gbmV3IE1lbnVCdXR0b25fMS5NZW51QnV0dG9uKGdhbWVDb25maWdzLCBwbGF5SW1nLndpZHRoLCBwbGF5SW1nLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIgPSBuZXcgR2FtZVN0YXR1c01hbmFnZXJfMS5HYW1lU3RhdHVzTWFuYWdlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVdvcmxkID0gR2FtZVdvcmxkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uL2dhbWUvZW51bXMvS2V5c1wiKTtcbmNsYXNzIEtleWJvYXJkSW5wdXRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcmVzc2VkS2V5cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5vbktleURvd24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuYWRkKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25LZXlVcCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkS2V5cy5kZWxldGUoZXZlbnQua2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleURvd24pO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5vbktleVVwKTtcbiAgICB9XG4gICAgaXNLZXlQcmVzc2VkKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcmVzc2VkS2V5cy5oYXMoa2V5KTtcbiAgICB9XG4gICAgZ2V0RGlyZWN0aW9uUHJlc3NlZChkaXJlY3Rpb24pIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5wcmVzc2VkS2V5cykge1xuICAgICAgICAgICAgaWYgKEtleXNfMS5LZXlzVXRpbGl0aWVzLmdldEtleURpcmVjdGlvbihrZXkpID09PSBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuS2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBLZXlib2FyZElucHV0TWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIE1vdXNlSW5wdXRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Nb3VzZU1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0LCBldmVudC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2xpY2spO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgIH1cbn1cbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSBNb3VzZUlucHV0TWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgQmFsbFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9CYWxsUmVuZGVyXCIpO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvRmllbGRSZW5kZXJcIik7XG5jb25zdCBHYXRlc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9HYXRlc1JlbmRlclwiKTtcbmNvbnN0IE1lbnVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvTWVudVJlbmRlclwiKTtcbmNvbnN0IFBsYXllclJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9QbGF5ZXJSZW5kZXJcIik7XG5jb25zdCBTY29yZVJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9TY29yZVJlbmRlclwiKTtcbmNsYXNzIE1haW5SZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnJlbmRlcnMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyID0gZG9tSGFuZGxlcjtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEZpZWxkUmVuZGVyXzEuRmllbGRSZW5kZXIoZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBTY29yZVJlbmRlcl8xLlNjb3JlUmVuZGVyKGRvbUhhbmRsZXIuc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgR2F0ZXNSZW5kZXJfMS5HYXRlc1JlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgUGxheWVyUmVuZGVyXzEuUGxheWVyUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBNZW51UmVuZGVyXzEuTWVudVJlbmRlcihkb21IYW5kbGVyLm1lbnVDb250ZXh0LCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgQmFsbFJlbmRlcl8xLkJhbGxSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMucmVuZGVycy5mb3JFYWNoKHJlbmRlciA9PiByZW5kZXIucmVuZGVyKGdhbWVXb3JsZCkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgQmFsbFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIC8vIFRPRE8gYWRkIGVubGFyZ2VtZW50IGZvciBzcGVlZFxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HIHx8XG4gICAgICAgICAgICAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCAmJlxuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRjMzMzNcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMzMwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFJlbmRlciA9IEJhbGxSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmllbGRSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImdvYWxfZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLnRyYWNrRmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBpZiAodGhpcy5hbHJlYWR5UmVuZGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmVuZGVyQmFja2dyb3VuZCgpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5maWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgIH1cbiAgICByZW5kZXJCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKiAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNBQUFBQUFcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja1lPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrSGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gRmllbGRSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBHYXRlc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSAwOyAvLyBUT0RPIGRhIHJpdmVkZXJlXG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlUmVjdCgwLCAwLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShNYXRoLlBJIC0gYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxSZWN0KDAsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VSZWN0KDAsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlc1JlbmRlciA9IEdhdGVzUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgTWVudVJlbmRlciB7XG4gICAgY29uc3RydWN0b3IobWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuaG92ZXJGYWN0b3IgPSAxLjM7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQgPSBtZW51Q29udGV4dDtcbiAgICAgICAgdGhpcy5wbGF5SW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gMSArICh0aGlzLmhvdmVyRmFjdG9yIC0gMSkgKiBnYW1lV29ybGQubWVudUJ1dHRvbi5ob3ZlclByb2dyZXNzO1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgIHRoaXMubWVudUNvbnRleHQuZHJhd0ltYWdlKHRoaXMucGxheUltYWdlLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi54IC1cbiAgICAgICAgICAgICAgICAod2lkdGggLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGgpIC8gMiwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueSAtXG4gICAgICAgICAgICAgICAgKGhlaWdodCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQpIC8gMiwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLk1lbnVSZW5kZXIgPSBNZW51UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIFBsYXllclJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuY29sb3JNYXAgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcIkxFRlQtMFwiLCBcIiMwMDgwMDBcIl0sXG4gICAgICAgICAgICBbXCJMRUZULTFcIiwgXCIjMzM4MDg4XCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMFwiLCBcIiNGRkE1MDBcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0xXCIsIFwiI0ZGRkYwMFwiXSxcbiAgICAgICAgXSk7XG4gICAgICAgIHRoaXMuc3R1bm5lZENvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBcIiMwMDMzMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleSA9IGAke3BsYXllci5zaWRlfS0ke3BsYXllci5jb2xvckluZGV4fWA7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSBwbGF5ZXIuaXNTdHVubmVkID8gdGhpcy5zdHVubmVkQ29sb3IgOiB0aGlzLmNvbG9yTWFwLmdldChjb2xvcktleSk7XG4gICAgICAgICAgICBpZiAoY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gXCIjRkYwMDAwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCksIE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gUGxheWVyUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFNjb3JlUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihzY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZnJhbWVGb3JOdW1iZXIgPSA2O1xuICAgICAgICB0aGlzLnRvdGFsTnVtYmVycyA9IDk7XG4gICAgICAgIHRoaXMudG90YWxBbmltYXRpb25UaW1lID0gMzAwO1xuICAgICAgICB0aGlzLmZyYW1lVGltZSA9IHRoaXMudG90YWxBbmltYXRpb25UaW1lIC8gdGhpcy5mcmFtZUZvck51bWJlcjtcbiAgICAgICAgdGhpcy5zY29yZUNvbnRleHQgPSBzY29yZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZGlnaXRzSW1hZ2VzID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJkaWdpdHMucG5nXCIpO1xuICAgICAgICB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKHRoaXMuZGlnaXRzSW1hZ2VzLndpZHRoLCB0aGlzLmRpZ2l0c0ltYWdlcy5oZWlnaHQgLyAodGhpcy50b3RhbE51bWJlcnMgKiB0aGlzLmZyYW1lRm9yTnVtYmVyICsgMSkpO1xuICAgICAgICBjb25zdCBzY29yZUhlaWdodCA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAqIDkpIC8gMTA7XG4gICAgICAgIHRoaXMuc2NvcmVEaW1lbnNpb25zID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKChzY29yZUhlaWdodCAqIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgpIC8gdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQsIHNjb3JlSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgeVBvc2l0aW9uID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0IC0gdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KSAvIDI7XG4gICAgICAgIHRoaXMucG9zaXRpb25BcnJheSA9IFtcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KDAsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCAqIDIsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgIF07XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5zY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IHNjb3JlQXJyYXkgPSBnYW1lV29ybGQuc2NvcmUuZ2V0U2NvcmVBc0FycmF5KCk7XG4gICAgICAgIHNjb3JlQXJyYXkuZm9yRWFjaCgobnVtYmVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1heEZyYW1lID0gbnVtYmVyICogdGhpcy5mcmFtZUZvck51bWJlcjtcbiAgICAgICAgICAgIGxldCBmcmFtZSA9IG1heEZyYW1lO1xuICAgICAgICAgICAgaWYgKGZyYW1lID4gMCAmJiBnYW1lV29ybGQuc2NvcmUuc2hvdWxkQW5pbWF0ZUluZGV4KGluZGV4KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pbkZyYW1lID0gKG51bWJlciAtIDEpICogdGhpcy5mcmFtZUZvck51bWJlcjtcbiAgICAgICAgICAgICAgICBmcmFtZSA9XG4gICAgICAgICAgICAgICAgICAgIG1pbkZyYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoKERhdGUubm93KCkgLSBnYW1lV29ybGQuc2NvcmUubGFzdFVwZGF0ZSkgLyB0aGlzLmZyYW1lVGltZSk7XG4gICAgICAgICAgICAgICAgZnJhbWUgPSBNYXRoLm1pbihmcmFtZSwgbWF4RnJhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCAqIGZyYW1lLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgdGhpcy5wb3NpdGlvbkFycmF5W2luZGV4XS54LCB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdLnksIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gU2NvcmVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRG9tSGFuZGxlciA9IHZvaWQgMDtcbmNsYXNzIERvbUhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBbdGhpcy5iYWNrZ3JvdW5kQ2FudmFzLCB0aGlzLmJhY2tncm91bmRDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiYmFja2dyb3VuZENhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuc2NvcmVDYW52YXMsIHRoaXMuc2NvcmVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwic2NvcmVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLmdhbWVDYW52YXMsIHRoaXMuZ2FtZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJnYW1lQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5tZW51Q2FudmFzLCB0aGlzLm1lbnVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwibWVudUNhbnZhc1wiKTtcbiAgICB9XG4gICAgc3RhdGljIGdldENhbnZhcyhpZCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gY29udGV4dCBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2NhbnZhcywgY29udGV4dF07XG4gICAgfVxufVxuZXhwb3J0cy5Eb21IYW5kbGVyID0gRG9tSGFuZGxlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gdm9pZCAwO1xuY2xhc3MgVUlJbnRlcmFjdGlvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIH1cbiAgICB1cGRhdGUoaG92ZXJhYmxlLCBvbkNsaWNrLCBkZWx0YU1zKSB7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlcmVkID0gaG92ZXJhYmxlLmNvbnRhaW5zKHRoaXMuaW5wdXQubW91c2VQb3NpdGlvbik7XG4gICAgICAgIGlmIChob3ZlcmFibGUuaG92ZXJlZCAmJiB0aGlzLmlucHV0LmlzTW91c2VQcmVzc2VkKSB7XG4gICAgICAgICAgICBvbkNsaWNrKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RlcCA9IChkZWx0YU1zIC8gaG92ZXJhYmxlLmdldFRyYW5zaXRpb25UaW1lKCkpICogKGhvdmVyYWJsZS5ob3ZlcmVkID8gMSA6IC0xKTtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyArIHN0ZXApKTtcbiAgICB9XG59XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSBVSUludGVyYWN0aW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVDb25maWdzID0gdm9pZCAwO1xuY2xhc3MgR2FtZUNvbmZpZ3Mge1xuICAgIGNvbnN0cnVjdG9yKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJCb3JkZXIgPSAyO1xuICAgICAgICB0aGlzLmJhbGxCb3JkZXIgPSAxO1xuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgKiA0LjUpIC8gNik7XG4gICAgICAgIHRoaXMuZmllbGRYT2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMTYpO1xuICAgICAgICB0aGlzLmZpZWxkV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLSB0aGlzLmZpZWxkWE9mZnNldCAqIDIpO1xuICAgICAgICB0aGlzLmdvYWxIZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA1KTtcbiAgICAgICAgdGhpcy5nb2FsWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmdvYWxIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMuZ29hbFBvc3RSYWRpdXMgPSBNYXRoLnJvdW5kKHRoaXMuZ29hbEhlaWdodCAvIDIwKTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0ID0gTWF0aC5yb3VuZCgoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCkgKiA1KSAvIDcpO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyID0gTWF0aC5mbG9vcih0aGlzLmZpZWxkSGVpZ2h0IC8gMjYpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciArIHRoaXMucGxheWVyQm9yZGVyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFggPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRXaWR0aCAvIDQpO1xuICAgICAgICB0aGlzLnBsYXllclN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgdGhpcy5jcHVTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyAodGhpcy5maWVsZFdpZHRoIC0gdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYKTtcbiAgICAgICAgdGhpcy5zaGFkb3dCbHVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgdGhpcy5zaGFkb3dPZmZzZXQgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogMC4zO1xuICAgICAgICB0aGlzLmZpZWxkQm9yZGVyU2l6ZSA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDEwMCk7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQgPSB0aGlzLmZpZWxkV2lkdGggLyA4O1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID0gdGhpcy5maWVsZEhlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID1cbiAgICAgICAgICAgIHRoaXMuZmllbGRIZWlnaHQgKyB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ICsgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5nYXRlc0xlbmd0aCA9IHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAzO1xuICAgICAgICB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDgwKTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciArIHRoaXMuYmFsbEJvcmRlcjtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVDb25maWdzID0gR2FtZUNvbmZpZ3M7XG5HYW1lQ29uZmlncy5JU19ERUJVRyA9IHRydWU7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jb25zdCBHYW1lTG9vcF8xID0gcmVxdWlyZShcIi4vY29yZS9HYW1lTG9vcFwiKTtcbmNvbnN0IERvbUhhbmRsZXJfMSA9IHJlcXVpcmUoXCIuL3VpL0RvbUhhbmRsZXJcIik7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBNYWluIHtcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBhc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGF3YWl0IGFzc2V0TG9hZGVyLmluaXQoKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY2xvc2VMb2FkaW5nV2luZG93KCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgZ2FtZUxvb3AubWFpbigpO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICAgICAgLy9kb21IYW5kbGVyLm1lbnVDYW52YXMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbn1cbmNvbnN0IG1haW4gPSBuZXcgTWFpbigpO1xubWFpbi5pbml0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
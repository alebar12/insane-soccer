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
const GameStatus_1 = __webpack_require__(/*! ../game/status/GameStatus */ "./src/game/status/GameStatus.ts");
const MovementSystem_1 = __webpack_require__(/*! ../game/systems/MovementSystem */ "./src/game/systems/MovementSystem.ts");
const GameWorld_1 = __webpack_require__(/*! ../game/world/GameWorld */ "./src/game/world/GameWorld.ts");
const MouseInputManager_1 = __webpack_require__(/*! ../input/MouseInputManager */ "./src/input/MouseInputManager.ts");
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
const UIInteractionSystem_1 = __webpack_require__(/*! ../ui/UIInteractionSystem */ "./src/ui/UIInteractionSystem.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.delta = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld_1.GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem_1.UIInteractionSystem(new MouseInputManager_1.MouseInputManager(domHandler.menuCanvas));
        this.movementSystem = new MovementSystem_1.MovementSystem(gameConfigs);
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
        this.movementSystem.update(this.gameWorld, this.delta);
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

/***/ "./src/game/entities/GoalPosts.ts"
/*!****************************************!*\
  !*** ./src/game/entities/GoalPosts.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoalPosts = void 0;
const Point_1 = __webpack_require__(/*! ../../utils/Point */ "./src/utils/Point.ts");
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
const Dimensions_1 = __webpack_require__(/*! ../../utils/Dimensions */ "./src/utils/Dimensions.ts");
const Point_1 = __webpack_require__(/*! ../../utils/Point */ "./src/utils/Point.ts");
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
const MovementPoint_1 = __webpack_require__(/*! ../../utils/MovementPoint */ "./src/utils/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../utils/Point */ "./src/utils/Point.ts");
const PlayerSide_1 = __webpack_require__(/*! ../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0);
        this.currentMaxSpeed = 0;
        this.isStunned = false;
        this.colorIndex = 0;
        this.radius = gameConfigs.playerSizeWithBorder;
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = gameConfigs.fieldHeight / 666;
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = gameConfigs.fieldHeight / 150000;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;
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
        this.movementPosition.position.x += this.movementPosition.speed.x * deltaMs;
        this.movementPosition.position.y += this.movementPosition.speed.y * deltaMs;
    }
    adjustSpeedToDestinationPoint(deltaMs) {
        const projectedPosition = new Point_1.Point(this.calculateDestinationPosition(this.movementPosition.position.x, this.movementPosition.speed.x), this.calculateDestinationPosition(this.movementPosition.position.y, this.movementPosition.speed.y));
        const angle = Math.atan2(this.destinationPosition.position.y - this.movementPosition.position.y, this.destinationPosition.position.x - this.movementPosition.position.x);
        if (Point_1.Point.getDistance(projectedPosition, this.destinationPosition.position) <
            this.reachedDistanceTolerance) {
            const currentSpeed = this.getSpeed();
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
        this.adjustSpeedToMaxSpeed();
    }
    resetToStartGame() {
        this.currentMaxSpeed = this.normalMaxSpeed;
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(this.initialPosition.x, this.initialPosition.y), new Point_1.Point(0, 0), 0);
    }
    calculateDestinationPosition(position, speed) {
        while (Math.abs(speed) > 0) {
            position += speed;
            speed = Math.sign(speed) * Math.max(Math.abs(speed) - this.movementPosition.acceleration, 0);
            if (Math.abs(speed) <= this.movementPosition.acceleration) {
                speed = 0;
            }
        }
        return position;
    }
    adjustSpeedToMaxSpeed() {
        const speed = Math.min(this.getSpeed(), this.currentMaxSpeed);
        const angle = Math.atan2(this.movementPosition.speed.y, this.movementPosition.speed.x);
        this.movementPosition.speed.x = Math.cos(angle) * speed;
        this.movementPosition.speed.y = Math.sin(angle) * speed;
    }
    getSpeed() {
        return Math.sqrt(Math.pow(this.movementPosition.speed.x, 2) + Math.pow(this.movementPosition.speed.y, 2));
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
})(GameStatus || (exports.GameStatus = GameStatus = {}));


/***/ },

/***/ "./src/game/status/GameStatusManager.ts"
/*!**********************************************!*\
  !*** ./src/game/status/GameStatusManager.ts ***!
  \**********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameStatusManager = void 0;
const GameStatus_1 = __webpack_require__(/*! ./GameStatus */ "./src/game/status/GameStatus.ts");
class GameStatusManager {
    constructor() {
        this._gameStatus = GameStatus_1.GameStatus.MENU;
        this.statusStartTime = 0;
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
}
exports.GameStatusManager = GameStatusManager;


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

/***/ "./src/game/systems/MovementSystem.ts"
/*!********************************************!*\
  !*** ./src/game/systems/MovementSystem.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementSystem = void 0;
const BeforeGameMovementStrategy_1 = __webpack_require__(/*! ./movementStrategies/BeforeGameMovementStrategy */ "./src/game/systems/movementStrategies/BeforeGameMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs) {
        this.strategies = [];
        this.strategies.push(new BeforeGameMovementStrategy_1.BeforeGameMovementStrategy(gameConfigs));
    }
    update(gameWorld, deltaMs) {
        gameWorld.players.forEach(player => {
            this.strategies
                .filter(strategy => strategy.canBeApplied(player, gameWorld))
                .forEach(strategy => strategy.apply(player, gameWorld, deltaMs));
            player.move(deltaMs);
        });
    }
}
exports.MovementSystem = MovementSystem;


/***/ },

/***/ "./src/game/systems/movementStrategies/AbstractMovementStrategy.ts"
/*!*************************************************************************!*\
  !*** ./src/game/systems/movementStrategies/AbstractMovementStrategy.ts ***!
  \*************************************************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbstractMovementStrategy = void 0;
class AbstractMovementStrategy {
}
exports.AbstractMovementStrategy = AbstractMovementStrategy;


/***/ },

/***/ "./src/game/systems/movementStrategies/BeforeGameMovementStrategy.ts"
/*!***************************************************************************!*\
  !*** ./src/game/systems/movementStrategies/BeforeGameMovementStrategy.ts ***!
  \***************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BeforeGameMovementStrategy = void 0;
const Point_1 = __webpack_require__(/*! ../../../utils/Point */ "./src/utils/Point.ts");
const GameStatus_1 = __webpack_require__(/*! ../../status/GameStatus */ "./src/game/status/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
const AbstractMovementStrategy_1 = __webpack_require__(/*! ./AbstractMovementStrategy */ "./src/game/systems/movementStrategies/AbstractMovementStrategy.ts");
class BeforeGameMovementStrategy extends AbstractMovementStrategy_1.AbstractMovementStrategy {
    constructor(gameConfigs) {
        super();
        this.gameConfigs = gameConfigs;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU ||
                gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL));
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU) {
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
        }
        else if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL) {
            if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
                player.resetToStartGame();
            }
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}
exports.BeforeGameMovementStrategy = BeforeGameMovementStrategy;


/***/ },

/***/ "./src/game/world/GameWorld.ts"
/*!*************************************!*\
  !*** ./src/game/world/GameWorld.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameWorld = void 0;
const GoalPosts_1 = __webpack_require__(/*! ../entities/GoalPosts */ "./src/game/entities/GoalPosts.ts");
const MenuButton_1 = __webpack_require__(/*! ../entities/MenuButton */ "./src/game/entities/MenuButton.ts");
const Player_1 = __webpack_require__(/*! ../entities/Player */ "./src/game/entities/Player.ts");
const GameStatusManager_1 = __webpack_require__(/*! ../status/GameStatusManager */ "./src/game/status/GameStatusManager.ts");
class GameWorld {
    constructor(gameConfigs, assetLoader) {
        this.players = [];
        this.goalPosts = new GoalPosts_1.GoalPosts(gameConfigs);
        this.players.push(Player_1.Player.createHumanPlayer(gameConfigs));
        this.players.push(Player_1.Player.createCpuPlayer(gameConfigs));
        this.players.push(Player_1.Player.createLeftSubstitutePlayer(gameConfigs));
        this.players.push(Player_1.Player.createRightSubstitutePlayer(gameConfigs));
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
const Point_1 = __webpack_require__(/*! ../utils/Point */ "./src/utils/Point.ts");
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
    }
    render(gameWorld) {
        this.clear();
        this.fieldRender.render(gameWorld);
        this.scoreRender.render();
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
            this.gameContext.arc(0, 0, player.radius, 0, 2 * Math.PI, false);
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
                this.gameContext.arc(0, 0, player.radius / 5, 0, 2 * Math.PI, false);
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
const Dimensions_1 = __webpack_require__(/*! ../utils/Dimensions */ "./src/utils/Dimensions.ts");
const Point_1 = __webpack_require__(/*! ../utils/Point */ "./src/utils/Point.ts");
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

/***/ "./src/utils/Dimensions.ts"
/*!*********************************!*\
  !*** ./src/utils/Dimensions.ts ***!
  \*********************************/
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

/***/ "./src/utils/DomHandler.ts"
/*!*********************************!*\
  !*** ./src/utils/DomHandler.ts ***!
  \*********************************/
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
    }
}
exports.GameConfigs = GameConfigs;
GameConfigs.IS_DEBUG = ("development" === "development");


/***/ },

/***/ "./src/utils/MovementPoint.ts"
/*!************************************!*\
  !*** ./src/utils/MovementPoint.ts ***!
  \************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementPoint = void 0;
class MovementPoint {
    constructor(position, speed, acceleration) {
        this.position = position;
        this.speed = speed;
        this.acceleration = acceleration;
    }
}
exports.MovementPoint = MovementPoint;


/***/ },

/***/ "./src/utils/Point.ts"
/*!****************************!*\
  !*** ./src/utils/Point.ts ***!
  \****************************/
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
}
exports.Point = Point;


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
const DomHandler_1 = __webpack_require__(/*! ./utils/DomHandler */ "./src/utils/DomHandler.ts");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7QUM1QmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsc0JBQXNCLG1CQUFPLENBQUMseURBQXNCO0FBQ3BELG1CQUFtQixtQkFBTyxDQUFDLCtDQUFpQjtBQUM1QyxxQkFBcUIsbUJBQU8sQ0FBQyxxREFBb0I7QUFDakQsc0JBQXNCLG1CQUFPLENBQUMsdURBQXFCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksWUFBWTtBQUN6QjtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9hc3NldHMvQXNzZXRMb2FkZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2NvcmUvR2FtZUxvb3AudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR29hbFBvc3RzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0hvdmVyYWJsZUVudGl0eS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9NZW51QnV0dG9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL1BsYXllci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zdGF0dXMvR2FtZVN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zdGF0dXMvR2FtZVN0YXR1c01hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3RhdHVzL1BsYXllclNpZGUudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9Nb3ZlbWVudFN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50U3RyYXRlZ2llcy9BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudFN0cmF0ZWdpZXMvQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvd29ybGQvR2FtZVdvcmxkLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvR2F0ZXNSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1BsYXllclJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1Njb3JlUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9VSUludGVyYWN0aW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9EaW1lbnNpb25zLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvTW92ZW1lbnRQb2ludC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvUG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Bc3NldExvYWRlciA9IHZvaWQgMDtcbmNsYXNzIEFzc2V0TG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5JTUFHRV9GT0xERVIgPSBcImltYWdlcy9cIjtcbiAgICAgICAgdGhpcy5JTUFHRV9OQU1FUyA9IFtcbiAgICAgICAgICAgIFwiYmFsbHMucG5nXCIsXG4gICAgICAgICAgICBcImZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJ0cmFjay5qcGdcIixcbiAgICAgICAgICAgIFwiUmVkUGFydGljbGUucG5nXCIsXG4gICAgICAgICAgICBcImRpZ2l0cy5wbmdcIixcbiAgICAgICAgICAgIFwiZ29hbF9maWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwic3Rhci5wbmdcIixcbiAgICAgICAgICAgIFwicGxheS5wbmdcIixcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5pbWFnZXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuSU1BR0VfTkFNRVMubWFwKGZpbGVOYW1lID0+IHRoaXMubG9hZEltYWdlKGZpbGVOYW1lLCBgJHt0aGlzLklNQUdFX0ZPTERFUn0ke2ZpbGVOYW1lfWApKSk7XG4gICAgfVxuICAgIGdldEltYWdlKGltYWdlTmFtZSkge1xuICAgICAgICBjb25zdCBpbWFnZSA9IHRoaXMuaW1hZ2VzLmdldChpbWFnZU5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2ltYWdlTmFtZX0gaW1hZ2Ugbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBsb2FkSW1hZ2UobmFtZSwgc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZXMuc2V0KG5hbWUsIGltZyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSBBc3NldExvYWRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lTG9vcCA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N0YXR1cy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvTW92ZW1lbnRTeXN0ZW1cIik7XG5jb25zdCBHYW1lV29ybGRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3dvcmxkL0dhbWVXb3JsZFwiKTtcbmNvbnN0IE1vdXNlSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jb25zdCBVSUludGVyYWN0aW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vdWkvVUlJbnRlcmFjdGlvblN5c3RlbVwiKTtcbmNsYXNzIEdhbWVMb29wIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5kZWx0YSA9IDA7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQgPSBuZXcgR2FtZVdvcmxkXzEuR2FtZVdvcmxkKGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbSA9IG5ldyBVSUludGVyYWN0aW9uU3lzdGVtXzEuVUlJbnRlcmFjdGlvblN5c3RlbShuZXcgTW91c2VJbnB1dE1hbmFnZXJfMS5Nb3VzZUlucHV0TWFuYWdlcihkb21IYW5kbGVyLm1lbnVDYW52YXMpKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFN5c3RlbSA9IG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgbWFpbigpIHtcbiAgICAgICAgY29uc3QgdGljayA9ICh0aW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2VGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0cyh0aGlzLmRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRTeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLCB0aGlzLmRlbHRhKTtcbiAgICB9XG4gICAgdXBkYXRlSW5wdXRzKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZC5tZW51QnV0dG9uLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgfSwgZGVsdGFNcyk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcih0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdvYWxQb3N0cyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvUG9pbnRcIik7XG5jbGFzcyBHb2FsUG9zdHMge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBnYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cztcbiAgICB9XG59XG5leHBvcnRzLkdvYWxQb3N0cyA9IEdvYWxQb3N0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSB2b2lkIDA7XG5jbGFzcyBIb3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ob3ZlclByb2dyZXNzID0gMDtcbiAgICB9XG59XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IEhvdmVyYWJsZUVudGl0eTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51QnV0dG9uID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL1BvaW50XCIpO1xuY29uc3QgSG92ZXJhYmxlRW50aXR5XzEgPSByZXF1aXJlKFwiLi9Ib3ZlcmFibGVFbnRpdHlcIik7XG5jbGFzcyBNZW51QnV0dG9uIGV4dGVuZHMgSG92ZXJhYmxlRW50aXR5XzEuSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgcmVmV2lkdGgsIHJlZkhlaWdodCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDU7XG4gICAgICAgIHRoaXMuZGltZW5zaW9uID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKGhlaWdodCAqIChyZWZXaWR0aCAvIHJlZkhlaWdodCksIGhlaWdodCk7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyAoZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIHRoaXMuZGltZW5zaW9uLndpZHRoKSAvIDIsIChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZGltZW5zaW9uLmhlaWdodCkgLyAyKTtcbiAgICB9XG4gICAgY29udGFpbnMocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludC54ID49IHRoaXMucG9zaXRpb24ueCAmJlxuICAgICAgICAgICAgcG9pbnQueCA8PSB0aGlzLnBvc2l0aW9uLnggKyB0aGlzLmRpbWVuc2lvbi53aWR0aCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnBvc2l0aW9uLnkgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5kaW1lbnNpb24uaGVpZ2h0KTtcbiAgICB9XG4gICAgZ2V0VHJhbnNpdGlvblRpbWUoKSB7XG4gICAgICAgIHJldHVybiAxMDA7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51QnV0dG9uID0gTWVudUJ1dHRvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXIgPSB2b2lkIDA7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvUG9pbnRcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdHVzL1BsYXllclNpZGVcIik7XG5jbGFzcyBQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBpc0NwdSwgaXNTdWJzdGl0dXRlLCBzaWRlLCBjb2xvckluZGV4KSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLmlzU3R1bm5lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbG9ySW5kZXggPSAwO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDA7XG4gICAgICAgIHRoaXMubWF4U3BlZWRXaXRoQmFsbCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNjY2O1xuICAgICAgICB0aGlzLnJlYWNoZWREaXN0YW5jZVRvbGVyYW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDE1MDAwMDtcbiAgICAgICAgdGhpcy5jbG9zZVRvUG9pbnREaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDtcbiAgICAgICAgdGhpcy5pc0NwdSA9IGlzQ3B1O1xuICAgICAgICB0aGlzLmlzU3Vic3RpdHV0ZSA9IGlzU3Vic3RpdHV0ZTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gY29sb3JJbmRleDtcbiAgICAgICAgdGhpcy5pbml0UG9zaXRpb25zKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCB0cnVlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAxKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAxKTtcbiAgICB9XG4gICAgcmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZSh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggKz0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLnggKiBkZWx0YU1zO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSAqIGRlbHRhTXM7XG4gICAgfVxuICAgIGFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcHJvamVjdGVkUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54KSwgdGhpcy5jYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55LCB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSkpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGguYXRhbjIodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggLSB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCk7XG4gICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHByb2plY3RlZFBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgICAgICBpZiAoY3VycmVudFNwZWVkID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXMsIDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbmV3U3BlZWQgLyBjdXJyZW50U3BlZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLnggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLnkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRYID0gTWF0aC5jb3MoYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRZID0gTWF0aC5zaW4oYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBsZXQgc3RlZXJYID0gZGVzaXJlZFNwZWVkWCAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54O1xuICAgICAgICAgICAgbGV0IHN0ZWVyWSA9IGRlc2lyZWRTcGVlZFkgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueTtcbiAgICAgICAgICAgIGNvbnN0IHN0ZWVyTWFnbml0dWRlID0gTWF0aC5zcXJ0KHN0ZWVyWCAqIHN0ZWVyWCArIHN0ZWVyWSAqIHN0ZWVyWSk7XG4gICAgICAgICAgICBjb25zdCBtYXhTdGVlciA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICAgICAgaWYgKHN0ZWVyTWFnbml0dWRlID4gbWF4U3RlZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFN0ZWVyIC8gc3RlZXJNYWduaXR1ZGU7XG4gICAgICAgICAgICAgICAgc3RlZXJYICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHN0ZWVyWSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC54ICs9IHN0ZWVyWDtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zcGVlZC55ICs9IHN0ZWVyWTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi54LCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGp1c3RTcGVlZFRvTWF4U3BlZWQoKTtcbiAgICB9XG4gICAgcmVzZXRUb1N0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwKTtcbiAgICB9XG4gICAgY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbihwb3NpdGlvbiwgc3BlZWQpIHtcbiAgICAgICAgd2hpbGUgKE1hdGguYWJzKHNwZWVkKSA+IDApIHtcbiAgICAgICAgICAgIHBvc2l0aW9uICs9IHNwZWVkO1xuICAgICAgICAgICAgc3BlZWQgPSBNYXRoLnNpZ24oc3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoc3BlZWQpIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgMCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3BlZWQpIDw9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvTWF4U3BlZWQoKSB7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gTWF0aC5taW4odGhpcy5nZXRTcGVlZCgpLCB0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gTWF0aC5hdGFuMih0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSwgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNwZWVkLngpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueCA9IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBnZXRTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueCwgMikgKyBNYXRoLnBvdyh0aGlzLm1vdmVtZW50UG9zaXRpb24uc3BlZWQueSwgMikpO1xuICAgIH1cbiAgICBpbml0UG9zaXRpb25zKGdhbWVDb25maWdzKSB7XG4gICAgICAgIGxldCBvZmZzZXRYID0gMDtcbiAgICAgICAgaWYgKHRoaXMuaXNTdWJzdGl0dXRlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueCA9IGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIG9mZnNldFg7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllciA9IFBsYXllcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzID0gdm9pZCAwO1xudmFyIEdhbWVTdGF0dXM7XG4oZnVuY3Rpb24gKEdhbWVTdGF0dXMpIHtcbiAgICBHYW1lU3RhdHVzW1wiTUVOVVwiXSA9IFwiTUVOVVwiO1xuICAgIEdhbWVTdGF0dXNbXCJXQUlUSU5HX0JBTExcIl0gPSBcIldBSVRJTkdfQkFMTFwiO1xufSkoR2FtZVN0YXR1cyB8fCAoZXhwb3J0cy5HYW1lU3RhdHVzID0gR2FtZVN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgR2FtZVN0YXR1c01hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSAwO1xuICAgIH1cbiAgICBjaGFuZ2VTdGF0dXMoZ2FtZVN0YXR1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gZ2FtZVN0YXR1cztcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhdHVzU3RhcnRUaW1lIDwgMTAwMDtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gR2FtZVN0YXR1c01hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyU2lkZSA9IHZvaWQgMDtcbnZhciBQbGF5ZXJTaWRlO1xuKGZ1bmN0aW9uIChQbGF5ZXJTaWRlKSB7XG4gICAgUGxheWVyU2lkZVtcIkxFRlRcIl0gPSBcIkxFRlRcIjtcbiAgICBQbGF5ZXJTaWRlW1wiUklHSFRcIl0gPSBcIlJJR0hUXCI7XG59KShQbGF5ZXJTaWRlIHx8IChleHBvcnRzLlBsYXllclNpZGUgPSBQbGF5ZXJTaWRlID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9tb3ZlbWVudFN0cmF0ZWdpZXMvQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCZWZvcmVHYW1lTW92ZW1lbnRTdHJhdGVneV8xLkJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IE1vdmVtZW50U3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNsYXNzIEFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSB7XG59XG5leHBvcnRzLkFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSA9IEFic3RyYWN0TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CZWZvcmVHYW1lTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXRpbHMvUG9pbnRcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vc3RhdHVzL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vc3RhdHVzL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNsYXNzIEJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5XzEuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUgfHxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKSk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpIC8gMjtcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnggKz0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24uc3BlZWQgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5hY2NlbGVyYXRpb24gPSAwO1xuICAgICAgICAgICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPVxuICAgICAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKSB7XG4gICAgICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5ID0gQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgR29hbFBvc3RzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvR29hbFBvc3RzXCIpO1xuY29uc3QgTWVudUJ1dHRvbl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL01lbnVCdXR0b25cIik7XG5jb25zdCBQbGF5ZXJfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9QbGF5ZXJcIik7XG5jb25zdCBHYW1lU3RhdHVzTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL3N0YXR1cy9HYW1lU3RhdHVzTWFuYWdlclwiKTtcbmNsYXNzIEdhbWVXb3JsZCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICB0aGlzLmdvYWxQb3N0cyA9IG5ldyBHb2FsUG9zdHNfMS5Hb2FsUG9zdHMoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICBjb25zdCBwbGF5SW1nID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9uID0gbmV3IE1lbnVCdXR0b25fMS5NZW51QnV0dG9uKGdhbWVDb25maWdzLCBwbGF5SW1nLndpZHRoLCBwbGF5SW1nLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIgPSBuZXcgR2FtZVN0YXR1c01hbmFnZXJfMS5HYW1lU3RhdHVzTWFuYWdlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVdvcmxkID0gR2FtZVdvcmxkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9Qb2ludFwiKTtcbmNsYXNzIE1vdXNlSW5wdXRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Nb3VzZU1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0LCBldmVudC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2xpY2spO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgIH1cbn1cbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSBNb3VzZUlucHV0TWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaWVsZFJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpZWxkUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihiYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLmdvYWxJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZ29hbF9maWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMudHJhY2tGaWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJ0cmFjay5qcGdcIik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGlmICh0aGlzLmFscmVhZHlSZW5kZXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJCYWNrZ3JvdW5kKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQXRobGV0aWNUcmFjaygpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICB0aGlzLnJlbmRlckJvcmRlcigpO1xuICAgICAgICB0aGlzLnJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZW5kZXJCYWNrZ3JvdW5kKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgfVxuICAgIHJlbmRlckJvcmRlcigpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAqIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAqIDIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICB9XG4gICAgcmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0FBQUFBQVwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgZ2FtZVdvcmxkLmdvYWxQb3N0cy5wb3NpdGlvbnMuZm9yRWFjaChwb3NpdGlvbiA9PiB7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyQXRobGV0aWNUcmFjaygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy50cmFja0ZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tIZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmllbGRSZW5kZXIgPSBGaWVsZFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlc1JlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEdhdGVzUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYwMDAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC0gdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IDA7IC8vIFRPRE8gZGEgcml2ZWRlcmVcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKE1hdGguUEkgLSBhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVJlY3QoMCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMiwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gR2F0ZXNSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEZpZWxkUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9GaWVsZFJlbmRlclwiKTtcbmNvbnN0IEdhdGVzUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9HYXRlc1JlbmRlclwiKTtcbmNvbnN0IE1lbnVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL01lbnVSZW5kZXJcIik7XG5jb25zdCBQbGF5ZXJSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL1BsYXllclJlbmRlclwiKTtcbmNvbnN0IFNjb3JlUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9TY29yZVJlbmRlclwiKTtcbmNsYXNzIE1haW5SZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmRvbUhhbmRsZXIgPSBkb21IYW5kbGVyO1xuICAgICAgICB0aGlzLmZpZWxkUmVuZGVyID0gbmV3IEZpZWxkUmVuZGVyXzEuRmllbGRSZW5kZXIoZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5zY29yZVJlbmRlciA9IG5ldyBTY29yZVJlbmRlcl8xLlNjb3JlUmVuZGVyKGRvbUhhbmRsZXIuc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuZ2F0ZXNSZW5kZXIgPSBuZXcgR2F0ZXNSZW5kZXJfMS5HYXRlc1JlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucGxheWVyUmVuZGVyID0gbmV3IFBsYXllclJlbmRlcl8xLlBsYXllclJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMubWVudVJlbmRlciA9IG5ldyBNZW51UmVuZGVyXzEuTWVudVJlbmRlcihkb21IYW5kbGVyLm1lbnVDb250ZXh0LCBhc3NldExvYWRlcik7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmZpZWxkUmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLnNjb3JlUmVuZGVyLnJlbmRlcigpO1xuICAgICAgICB0aGlzLnBsYXllclJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5nYXRlc1JlbmRlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5tZW51UmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9zdGF0dXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIE1lbnVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKG1lbnVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmhvdmVyRmFjdG9yID0gMS4zO1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0ID0gbWVudUNvbnRleHQ7XG4gICAgICAgIHRoaXMucGxheUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IDEgKyAodGhpcy5ob3ZlckZhY3RvciAtIDEpICogZ2FtZVdvcmxkLm1lbnVCdXR0b24uaG92ZXJQcm9ncmVzcztcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoICogc2NhbGU7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnBsYXlJbWFnZSwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueCAtXG4gICAgICAgICAgICAgICAgKHdpZHRoIC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoKSAvIDIsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnkgLVxuICAgICAgICAgICAgICAgIChoZWlnaHQgLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0KSAvIDIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5NZW51UmVuZGVyID0gTWVudVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4uL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgUGxheWVyUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5jb2xvck1hcCA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiTEVGVC0wXCIsIFwiIzAwODAwMFwiXSxcbiAgICAgICAgICAgIFtcIkxFRlQtMVwiLCBcIiMzMzgwODhcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0wXCIsIFwiI0ZGQTUwMFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTFcIiwgXCIjRkZGRjAwXCJdLFxuICAgICAgICBdKTtcbiAgICAgICAgdGhpcy5zdHVubmVkQ29sb3IgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5ib3JkZXJDb2xvciA9IFwiIzAwMzMwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yS2V5ID0gYCR7cGxheWVyLnNpZGV9LSR7cGxheWVyLmNvbG9ySW5kZXh9YDtcbiAgICAgICAgICAgIGxldCBjb2xvciA9IHBsYXllci5pc1N0dW5uZWQgPyB0aGlzLnN0dW5uZWRDb2xvciA6IHRoaXMuY29sb3JNYXAuZ2V0KGNvbG9yS2V5KTtcbiAgICAgICAgICAgIGlmIChjb2xvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSBcIiNGRjAwMDBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXJDb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KSwgTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoMCwgMCwgcGxheWVyLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgICAgIGlmIChHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzLklTX0RFQlVHKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcInJlZFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcInJlZFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKE1hdGgucm91bmQocGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCksIE1hdGgucm91bmQocGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoMCwgMCwgcGxheWVyLnJhZGl1cyAvIDUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllclJlbmRlciA9IFBsYXllclJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9Qb2ludFwiKTtcbmNsYXNzIFNjb3JlUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihzY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZnJhbWVGb3JOdW1iZXIgPSA2O1xuICAgICAgICB0aGlzLnRvdGFsTnVtYmVycyA9IDEwO1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dCA9IHNjb3JlQ29udGV4dDtcbiAgICAgICAgdGhpcy5kaWdpdHNJbWFnZXMgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImRpZ2l0cy5wbmdcIik7XG4gICAgICAgIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnModGhpcy5kaWdpdHNJbWFnZXMud2lkdGgsIHRoaXMuZGlnaXRzSW1hZ2VzLmhlaWdodCAvICh0aGlzLnRvdGFsTnVtYmVycyAqIHRoaXMuZnJhbWVGb3JOdW1iZXIpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAvLyBUT0RPIGdlc3RpcmUgYWdnaW9ybmFtZW50byBwdW50ZWdnaW9cbiAgICAgICAgdGhpcy5wb3NpdGlvbkFycmF5LmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCAqIDAsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TY29yZVJlbmRlciA9IFNjb3JlUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSB2b2lkIDA7XG5jbGFzcyBVSUludGVyYWN0aW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgfVxuICAgIHVwZGF0ZShob3ZlcmFibGUsIG9uQ2xpY2ssIGRlbHRhTXMpIHtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyZWQgPSBob3ZlcmFibGUuY29udGFpbnModGhpcy5pbnB1dC5tb3VzZVBvc2l0aW9uKTtcbiAgICAgICAgaWYgKGhvdmVyYWJsZS5ob3ZlcmVkICYmIHRoaXMuaW5wdXQuaXNNb3VzZVByZXNzZWQpIHtcbiAgICAgICAgICAgIG9uQ2xpY2soKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGVwID0gKGRlbHRhTXMgLyBob3ZlcmFibGUuZ2V0VHJhbnNpdGlvblRpbWUoKSkgKiAoaG92ZXJhYmxlLmhvdmVyZWQgPyAxIDogLTEpO1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzICsgc3RlcCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IFVJSW50ZXJhY3Rpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgW3RoaXMuYmFja2dyb3VuZENhbnZhcywgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImJhY2tncm91bmRDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLnNjb3JlQ2FudmFzLCB0aGlzLnNjb3JlQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcInNjb3JlQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5nYW1lQ2FudmFzLCB0aGlzLmdhbWVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiZ2FtZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMubWVudUNhbnZhcywgdGhpcy5tZW51Q29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcIm1lbnVDYW52YXNcIik7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRDYW52YXMoaWQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IGNvbnRleHQgbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtjYW52YXMsIGNvbnRleHRdO1xuICAgIH1cbn1cbmV4cG9ydHMuRG9tSGFuZGxlciA9IERvbUhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSB2b2lkIDA7XG5jbGFzcyBHYW1lQ29uZmlncyB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCkge1xuICAgICAgICB0aGlzLnBsYXllckJvcmRlciA9IDI7XG4gICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNXaWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXNIZWlnaHQ7XG4gICAgICAgIHRoaXMuZmllbGRIZWlnaHQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAqIDQuNSkgLyA2KTtcbiAgICAgICAgdGhpcy5maWVsZFhPZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAxNik7XG4gICAgICAgIHRoaXMuZmllbGRXaWR0aCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAtIHRoaXMuZmllbGRYT2Zmc2V0ICogMik7XG4gICAgICAgIHRoaXMuZ29hbEhlaWdodCA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDUpO1xuICAgICAgICB0aGlzLmdvYWxZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5maWVsZEhlaWdodCAtIHRoaXMuZ29hbEhlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdFJhZGl1cyA9IE1hdGgucm91bmQodGhpcy5nb2FsSGVpZ2h0IC8gMjApO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgPSBNYXRoLnJvdW5kKCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0KSAqIDUpIC8gNyk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLmZsb29yKHRoaXMuZmllbGRIZWlnaHQgLyAyNik7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICsgdGhpcy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCA9IE1hdGgucm91bmQodGhpcy5maWVsZFdpZHRoIC8gNCk7XG4gICAgICAgIHRoaXMucGxheWVyU3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB0aGlzLmNwdVN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArICh0aGlzLmZpZWxkV2lkdGggLSB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFgpO1xuICAgICAgICB0aGlzLnNoYWRvd0JsdXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICB0aGlzLnNoYWRvd09mZnNldCA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjM7XG4gICAgICAgIHRoaXMuZmllbGRCb3JkZXJTaXplID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gMTAwKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldCA9IHRoaXMuZmllbGRXaWR0aCAvIDg7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQgPSB0aGlzLmZpZWxkSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQgPVxuICAgICAgICAgICAgdGhpcy5maWVsZEhlaWdodCArIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgKyB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLmdhdGVzTGVuZ3RoID0gdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciAqIDM7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRQb2ludCA9IHZvaWQgMDtcbmNsYXNzIE1vdmVtZW50UG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBzcGVlZCwgYWNjZWxlcmF0aW9uKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5zcGVlZCA9IHNwZWVkO1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSBNb3ZlbWVudFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91dGlscy9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
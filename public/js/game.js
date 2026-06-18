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
        let image = this.images.get(imageName);
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
const Point_1 = __webpack_require__(/*! ../../utils/Point */ "./src/utils/Point.ts");
const PlayerSide_1 = __webpack_require__(/*! ../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.position = new Point_1.Point(0, 0);
        this.speed = new Point_1.Point(0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new Point_1.Point(0, 0);
        this.currentMaxSpeed = 0;
        this.isStunned = false;
        this.colorIndex = 0;
        this.radius = gameConfigs.playerSizeWithBorder;
        this.normalMaxSpeed = gameConfigs.fieldHeight / 500;
        this.maxSpeedWithBall = gameConfigs.fieldHeight / 666;
        this.reachedDistanceTollerance = gameConfigs.fieldWidth / 100;
        this.acceleration = gameConfigs.fieldHeight / 150000;
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
        return (Point_1.Point.getDistance(this.position, this.destinationPosition) <
            this.reachedDistanceTollerance);
    }
    move(deltaMs) {
        this.position.x += this.speed.x * deltaMs;
        this.position.y += this.speed.y * deltaMs;
    }
    adjustSpeedToDestinationPoint(deltaMs) {
        const projectedPosition = new Point_1.Point(this.calculateDestinationPosition(this.position.x, this.speed.x), this.calculateDestinationPosition(this.position.y, this.speed.y));
        const angle = Math.atan2(this.destinationPosition.y - this.position.y, this.destinationPosition.x - this.position.x);
        if (Point_1.Point.getDistance(projectedPosition, this.destinationPosition) <
            this.reachedDistanceTollerance) {
            const currentSpeed = this.getSpeed();
            if (this.getSpeed() > 0) {
                const newSpeed = Math.max(currentSpeed - this.acceleration * deltaMs, 0);
                const ratio = newSpeed / currentSpeed;
                this.speed.x *= ratio;
                this.speed.y *= ratio;
            }
        }
        else {
            const desiredSpeedX = Math.cos(angle) * this.currentMaxSpeed;
            const desiredSpeedY = Math.sin(angle) * this.currentMaxSpeed;
            let steerX = desiredSpeedX - this.speed.x;
            let steerY = desiredSpeedY - this.speed.y;
            const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
            const maxSteer = this.acceleration * deltaMs;
            if (steerMagnitude > maxSteer) {
                const ratio = maxSteer / steerMagnitude;
                steerX *= ratio;
                steerY *= ratio;
            }
            this.speed.x += steerX;
            this.speed.y += steerY;
        }
        if (this.reachedDestinationPosition()) {
            this.speed = new Point_1.Point(0, 0);
            this.position = new Point_1.Point(this.destinationPosition.x, this.destinationPosition.y);
        }
        this.adjustSpeedToMaxSpeed();
    }
    resetToStartGame() {
        this.currentMaxSpeed = this.normalMaxSpeed;
        this.destinationPosition = new Point_1.Point(this.initialPosition.x, this.initialPosition.y);
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
    adjustSpeedToMaxSpeed() {
        let speed = Math.min(this.getSpeed(), this.currentMaxSpeed);
        var angle = Math.atan2(this.speed.y, this.speed.x);
        this.speed.x = Math.cos(angle) * speed;
        this.speed.y = Math.sin(angle) * speed;
    }
    getSpeed() {
        return Math.sqrt(Math.pow(this.speed.x, 2) + Math.pow(this.speed.y, 2));
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
        this.position = new Point_1.Point(this.initialPosition.x, this.initialPosition.y);
        this.destinationPosition = new Point_1.Point(this.initialPosition.x, this.initialPosition.y);
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
        this.gameStatus = GameStatus_1.GameStatus.MENU;
        this.statusStartTime = 0;
    }
    changeStatus(gameStatus) {
        this.gameStatus = gameStatus;
        this.statusStartTime = Date.now();
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
const GameStatus_1 = __webpack_require__(/*! ../../status/GameStatus */ "./src/game/status/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../status/PlayerSide */ "./src/game/status/PlayerSide.ts");
const AbstractMovementStrategy_1 = __webpack_require__(/*! ./AbstractMovementStrategy */ "./src/game/systems/movementStrategies/AbstractMovementStrategy.ts");
class BeforeGameMovementStrategy extends AbstractMovementStrategy_1.AbstractMovementStrategy {
    constructor(gameConfigs) {
        super();
        this.gameConfigs = gameConfigs;
    }
    canBeApplied(player, gameWorld) {
        return !player.isSubstitute && (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL);
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU) {
            if (player.reachedDestinationPosition()) {
                player.destinationPosition.y =
                    (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
                player.destinationPosition.x =
                    this.gameConfigs.fieldXOffset +
                        ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
                if (player.side === PlayerSide_1.PlayerSide.RIGHT) {
                    player.destinationPosition.x += this.gameConfigs.fieldWidth / 2;
                }
                player.currentMaxSpeed = (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
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
            this.gameContext.translate(Math.round(player.position.x), Math.round(player.position.y));
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
                this.gameContext.translate(Math.round(player.destinationPosition.x), Math.round(player.destinationPosition.y));
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
GameConfigs.IS_DEBUG = true;


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0dvYWxQb3N0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Ib3ZlcmFibGVFbnRpdHkudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvTWVudUJ1dHRvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9QbGF5ZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXNNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N0YXR1cy9QbGF5ZXJTaWRlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvTW92ZW1lbnRTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudFN0cmF0ZWdpZXMvQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnRTdHJhdGVnaWVzL0JlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3dvcmxkL0dhbWVXb3JsZC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvTW91c2VJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9GaWVsZFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL0dhdGVzUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvTWFpblJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01lbnVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9QbGF5ZXJSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9TY29yZVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdWkvVUlJbnRlcmFjdGlvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvRGltZW5zaW9ucy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvRG9tSGFuZGxlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvR2FtZUNvbmZpZ3MudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL1BvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSB2b2lkIDA7XG5jbGFzcyBBc3NldExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuSU1BR0VfRk9MREVSID0gXCJpbWFnZXMvXCI7XG4gICAgICAgIHRoaXMuSU1BR0VfTkFNRVMgPSBbXG4gICAgICAgICAgICBcImJhbGxzLnBuZ1wiLFxuICAgICAgICAgICAgXCJmaWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwidHJhY2suanBnXCIsXG4gICAgICAgICAgICBcIlJlZFBhcnRpY2xlLnBuZ1wiLFxuICAgICAgICAgICAgXCJkaWdpdHMucG5nXCIsXG4gICAgICAgICAgICBcImdvYWxfZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInN0YXIucG5nXCIsXG4gICAgICAgICAgICBcInBsYXkucG5nXCIsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBnZXRJbWFnZShpbWFnZU5hbWUpIHtcbiAgICAgICAgbGV0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aW1hZ2VOYW1lfSBpbWFnZSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvc3RhdHVzL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFN5c3RlbV8xID0gcmVxdWlyZShcIi4uL2dhbWUvc3lzdGVtcy9Nb3ZlbWVudFN5c3RlbVwiKTtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgTW91c2VJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlclwiKTtcbmNvbnN0IE1haW5SZW5kZXJfMSA9IHJlcXVpcmUoXCIuLi9yZW5kZXJpbmcvTWFpblJlbmRlclwiKTtcbmNvbnN0IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi91aS9VSUludGVyYWN0aW9uU3lzdGVtXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmRlbHRhID0gMDtcbiAgICAgICAgdGhpcy5wcmV2VGltZSA9IDA7XG4gICAgICAgIHRoaXMubWFpblJlbmRlciA9IG5ldyBNYWluUmVuZGVyXzEuTWFpblJlbmRlcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZCA9IG5ldyBHYW1lV29ybGRfMS5HYW1lV29ybGQoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtID0gbmV3IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMS5VSUludGVyYWN0aW9uU3lzdGVtKG5ldyBNb3VzZUlucHV0TWFuYWdlcl8xLk1vdXNlSW5wdXRNYW5hZ2VyKGRvbUhhbmRsZXIubWVudUNhbnZhcykpO1xuICAgICAgICB0aGlzLm1vdmVtZW50U3lzdGVtID0gbmV3IE1vdmVtZW50U3lzdGVtXzEuTW92ZW1lbnRTeXN0ZW0oZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZWx0YSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSW5wdXRzKHRoaXMuZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHJldlRpbWUgPSB0aW1lO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgfVxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQsIHRoaXMuZGVsdGEpO1xuICAgIH1cbiAgICB1cGRhdGVJbnB1dHMoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLm1lbnVCdXR0b24sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9LCBkZWx0YU1zKTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIucmVuZGVyKHRoaXMuZ2FtZVdvcmxkKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVMb29wID0gR2FtZUxvb3A7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR29hbFBvc3RzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9Qb2ludFwiKTtcbmNsYXNzIEdvYWxQb3N0cyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzO1xuICAgIH1cbn1cbmV4cG9ydHMuR29hbFBvc3RzID0gR29hbFBvc3RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IHZvaWQgMDtcbmNsYXNzIEhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmhvdmVyUHJvZ3Jlc3MgPSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gSG92ZXJhYmxlRW50aXR5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVCdXR0b24gPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvUG9pbnRcIik7XG5jb25zdCBIb3ZlcmFibGVFbnRpdHlfMSA9IHJlcXVpcmUoXCIuL0hvdmVyYWJsZUVudGl0eVwiKTtcbmNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBIb3ZlcmFibGVFbnRpdHlfMS5Ib3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCByZWZXaWR0aCwgcmVmSGVpZ2h0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTtcbiAgICAgICAgdGhpcy5kaW1lbnNpb24gPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoaGVpZ2h0ICogKHJlZldpZHRoIC8gcmVmSGVpZ2h0KSwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIChnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5kaW1lbnNpb24ud2lkdGgpIC8gMiwgKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5kaW1lbnNpb24uaGVpZ2h0KSAvIDIpO1xuICAgIH1cbiAgICBjb250YWlucyhwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5wb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucG9zaXRpb24ueCArIHRoaXMuZGltZW5zaW9uLndpZHRoICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMucG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpO1xuICAgIH1cbiAgICBnZXRUcmFuc2l0aW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIDEwMDtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVCdXR0b24gPSBNZW51QnV0dG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllciA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvUG9pbnRcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vc3RhdHVzL1BsYXllclNpZGVcIik7XG5jbGFzcyBQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBpc0NwdSwgaXNTdWJzdGl0dXRlLCBzaWRlLCBjb2xvckluZGV4KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5zcGVlZCA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLmlzU3R1bm5lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbG9ySW5kZXggPSAwO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDA7XG4gICAgICAgIHRoaXMubWF4U3BlZWRXaXRoQmFsbCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNjY2O1xuICAgICAgICB0aGlzLnJlYWNoZWREaXN0YW5jZVRvbGxlcmFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTAwO1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMTUwMDAwO1xuICAgICAgICB0aGlzLmNsb3NlVG9Qb2ludERpc3RhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwO1xuICAgICAgICB0aGlzLmlzQ3B1ID0gaXNDcHU7XG4gICAgICAgIHRoaXMuaXNTdWJzdGl0dXRlID0gaXNTdWJzdGl0dXRlO1xuICAgICAgICB0aGlzLnNpZGUgPSBzaWRlO1xuICAgICAgICB0aGlzLmNvbG9ySW5kZXggPSBjb2xvckluZGV4O1xuICAgICAgICB0aGlzLmluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIHRydWUsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMCk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDEpO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDEpO1xuICAgIH1cbiAgICByZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHRoaXMucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xsZXJhbmNlKTtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSB0aGlzLnNwZWVkLnggKiBkZWx0YU1zO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gdGhpcy5zcGVlZC55ICogZGVsdGFNcztcbiAgICB9XG4gICAgYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ZWRQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLngsIHRoaXMuc3BlZWQueCksIHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLnksIHRoaXMuc3BlZWQueSkpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGguYXRhbjIodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnkgLSB0aGlzLnBvc2l0aW9uLnksIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi54IC0gdGhpcy5wb3NpdGlvbi54KTtcbiAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocHJvamVjdGVkUG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xsZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5nZXRTcGVlZCgpID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMuc3BlZWQueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLnNwZWVkLnkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRYID0gTWF0aC5jb3MoYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBjb25zdCBkZXNpcmVkU3BlZWRZID0gTWF0aC5zaW4oYW5nbGUpICogdGhpcy5jdXJyZW50TWF4U3BlZWQ7XG4gICAgICAgICAgICBsZXQgc3RlZXJYID0gZGVzaXJlZFNwZWVkWCAtIHRoaXMuc3BlZWQueDtcbiAgICAgICAgICAgIGxldCBzdGVlclkgPSBkZXNpcmVkU3BlZWRZIC0gdGhpcy5zcGVlZC55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5hY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICAgICAgaWYgKHN0ZWVyTWFnbml0dWRlID4gbWF4U3RlZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG1heFN0ZWVyIC8gc3RlZXJNYWduaXR1ZGU7XG4gICAgICAgICAgICAgICAgc3RlZXJYICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHN0ZWVyWSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3BlZWQueCArPSBzdGVlclg7XG4gICAgICAgICAgICB0aGlzLnNwZWVkLnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3BlZWQgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ueCwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRqdXN0U3BlZWRUb01heFNwZWVkKCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgfVxuICAgIGNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24ocG9zaXRpb24sIHNwZWVkKSB7XG4gICAgICAgIHdoaWxlIChNYXRoLmFicyhzcGVlZCkgPiAwKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiArPSBzcGVlZDtcbiAgICAgICAgICAgIHNwZWVkID0gTWF0aC5zaWduKHNwZWVkKSAqIE1hdGgubWF4KE1hdGguYWJzKHNwZWVkKSAtIHRoaXMuYWNjZWxlcmF0aW9uLCAwKTtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhzcGVlZCkgPD0gdGhpcy5hY2NlbGVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvTWF4U3BlZWQoKSB7XG4gICAgICAgIGxldCBzcGVlZCA9IE1hdGgubWluKHRoaXMuZ2V0U3BlZWQoKSwgdGhpcy5jdXJyZW50TWF4U3BlZWQpO1xuICAgICAgICB2YXIgYW5nbGUgPSBNYXRoLmF0YW4yKHRoaXMuc3BlZWQueSwgdGhpcy5zcGVlZC54KTtcbiAgICAgICAgdGhpcy5zcGVlZC54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMuc3BlZWQueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBnZXRTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLnNwZWVkLngsIDIpICsgTWF0aC5wb3codGhpcy5zcGVlZC55LCAyKSk7XG4gICAgfVxuICAgIGluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgbGV0IG9mZnNldFggPSAwO1xuICAgICAgICBpZiAodGhpcy5pc1N1YnN0aXR1dGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYXG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi54ID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgb2Zmc2V0WDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllciA9IFBsYXllcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzID0gdm9pZCAwO1xudmFyIEdhbWVTdGF0dXM7XG4oZnVuY3Rpb24gKEdhbWVTdGF0dXMpIHtcbiAgICBHYW1lU3RhdHVzW1wiTUVOVVwiXSA9IFwiTUVOVVwiO1xuICAgIEdhbWVTdGF0dXNbXCJXQUlUSU5HX0JBTExcIl0gPSBcIldBSVRJTkdfQkFMTFwiO1xufSkoR2FtZVN0YXR1cyB8fCAoZXhwb3J0cy5HYW1lU3RhdHVzID0gR2FtZVN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgR2FtZVN0YXR1c01hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmdhbWVTdGF0dXMgPSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgICAgICB0aGlzLnN0YXR1c1N0YXJ0VGltZSA9IDA7XG4gICAgfVxuICAgIGNoYW5nZVN0YXR1cyhnYW1lU3RhdHVzKSB7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1cyA9IGdhbWVTdGF0dXM7XG4gICAgICAgIHRoaXMuc3RhdHVzU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG4gICAgaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGF0dXNTdGFydFRpbWUgPCAxMDAwO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSBHYW1lU3RhdHVzTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTaWRlID0gdm9pZCAwO1xudmFyIFBsYXllclNpZGU7XG4oZnVuY3Rpb24gKFBsYXllclNpZGUpIHtcbiAgICBQbGF5ZXJTaWRlW1wiTEVGVFwiXSA9IFwiTEVGVFwiO1xuICAgIFBsYXllclNpZGVbXCJSSUdIVFwiXSA9IFwiUklHSFRcIjtcbn0pKFBsYXllclNpZGUgfHwgKGV4cG9ydHMuUGxheWVyU2lkZSA9IFBsYXllclNpZGUgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50U3lzdGVtID0gdm9pZCAwO1xuY29uc3QgQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL21vdmVtZW50U3RyYXRlZ2llcy9CZWZvcmVHYW1lTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNsYXNzIE1vdmVtZW50U3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5XzEuQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0cmF0ZWdpZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICAgICAgICAgIHBsYXllci5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50U3lzdGVtID0gTW92ZW1lbnRTeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY2xhc3MgQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5IHtcbn1cbmV4cG9ydHMuQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5ID0gQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJlZm9yZUdhbWVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL3N0YXR1cy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uL3N0YXR1cy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBCZWZvcmVHYW1lTW92ZW1lbnRTdHJhdGVneSBleHRlbmRzIEFic3RyYWN0TW92ZW1lbnRTdHJhdGVneV8xLkFic3RyYWN0TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ueSA9XG4gICAgICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpIC8gMjtcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnggKz0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IChwbGF5ZXIubm9ybWFsTWF4U3BlZWQgLyA1KSAqIE1hdGgucmFuZG9tKCkgKyBwbGF5ZXIubm9ybWFsTWF4U3BlZWQgLyA3O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpIHtcbiAgICAgICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSkge1xuICAgICAgICAgICAgICAgIHBsYXllci5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmVmb3JlR2FtZU1vdmVtZW50U3RyYXRlZ3kgPSBCZWZvcmVHYW1lTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lV29ybGQgPSB2b2lkIDA7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vc3RhdHVzL0dhbWVTdGF0dXNNYW5hZ2VyXCIpO1xuY2xhc3MgR2FtZVdvcmxkIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ29hbFBvc3RzID0gbmV3IEdvYWxQb3N0c18xLkdvYWxQb3N0cyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIGNvbnN0IHBsYXlJbWcgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgICAgICB0aGlzLm1lbnVCdXR0b24gPSBuZXcgTWVudUJ1dHRvbl8xLk1lbnVCdXR0b24oZ2FtZUNvbmZpZ3MsIHBsYXlJbWcud2lkdGgsIHBsYXlJbWcuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlciA9IG5ldyBHYW1lU3RhdHVzTWFuYWdlcl8xLkdhbWVTdGF0dXNNYW5hZ2VyKCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lV29ybGQgPSBHYW1lV29ybGQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL3V0aWxzL1BvaW50XCIpO1xuY2xhc3MgTW91c2VJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbk1vdXNlTW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQsIGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljayk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IE1vdXNlSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmllbGRSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJmaWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMuZ29hbEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJnb2FsX2ZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy50cmFja0ZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInRyYWNrLmpwZ1wiKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IGJhY2tncm91bmRDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxyZWFkeVJlbmRlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJBdGhsZXRpY1RyYWNrKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgIHRoaXMucmVuZGVyQm9yZGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IHRydWU7XG4gICAgfVxuICAgIHJlbmRlckJhY2tncm91bmQoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCAwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICogMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgIH1cbiAgICByZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQUFBQUFBXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJBdGhsZXRpY1RyYWNrKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnRyYWNrRmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja0hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgR2F0ZXNSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRjAwMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLSB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gMDsgLy8gVE9ETyBkYSByaXZlZGVyZVxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVJlY3QoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoTWF0aC5QSSAtIGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsUmVjdCgwLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlUmVjdCgwLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSBHYXRlc1JlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0ZpZWxkUmVuZGVyXCIpO1xuY29uc3QgR2F0ZXNSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0dhdGVzUmVuZGVyXCIpO1xuY29uc3QgTWVudVJlbmRlcl8xID0gcmVxdWlyZShcIi4vTWVudVJlbmRlclwiKTtcbmNvbnN0IFBsYXllclJlbmRlcl8xID0gcmVxdWlyZShcIi4vUGxheWVyUmVuZGVyXCIpO1xuY29uc3QgU2NvcmVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3JlUmVuZGVyXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlciA9IGRvbUhhbmRsZXI7XG4gICAgICAgIHRoaXMuZmllbGRSZW5kZXIgPSBuZXcgRmllbGRSZW5kZXJfMS5GaWVsZFJlbmRlcihkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnNjb3JlUmVuZGVyID0gbmV3IFNjb3JlUmVuZGVyXzEuU2NvcmVSZW5kZXIoZG9tSGFuZGxlci5zY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYXRlc1JlbmRlciA9IG5ldyBHYXRlc1JlbmRlcl8xLkdhdGVzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJSZW5kZXIgPSBuZXcgUGxheWVyUmVuZGVyXzEuUGxheWVyUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5tZW51UmVuZGVyID0gbmV3IE1lbnVSZW5kZXJfMS5NZW51UmVuZGVyKGRvbUhhbmRsZXIubWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuZmllbGRSZW5kZXIucmVuZGVyKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuc2NvcmVSZW5kZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMucGxheWVyUmVuZGVyLnJlbmRlcihnYW1lV29ybGQpO1xuICAgICAgICB0aGlzLmdhdGVzUmVuZGVyLnJlbmRlcigpO1xuICAgICAgICB0aGlzLm1lbnVSZW5kZXIucmVuZGVyKGdhbWVXb3JsZCk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuZG9tSGFuZGxlci5nYW1lQ2FudmFzLndpZHRoLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWFpblJlbmRlciA9IE1haW5SZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N0YXR1cy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgTWVudVJlbmRlciB7XG4gICAgY29uc3RydWN0b3IobWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuaG92ZXJGYWN0b3IgPSAxLjM7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQgPSBtZW51Q29udGV4dDtcbiAgICAgICAgdGhpcy5wbGF5SW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMubWVudUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gMSArICh0aGlzLmhvdmVyRmFjdG9yIC0gMSkgKiBnYW1lV29ybGQubWVudUJ1dHRvbi5ob3ZlclByb2dyZXNzO1xuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgIHRoaXMubWVudUNvbnRleHQuZHJhd0ltYWdlKHRoaXMucGxheUltYWdlLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi54IC1cbiAgICAgICAgICAgICAgICAod2lkdGggLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24ud2lkdGgpIC8gMiwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueSAtXG4gICAgICAgICAgICAgICAgKGhlaWdodCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi5oZWlnaHQpIC8gMiwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLk1lbnVSZW5kZXIgPSBNZW51UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVDb25maWdzXzEgPSByZXF1aXJlKFwiLi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBQbGF5ZXJSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNvbG9yTWFwID0gbmV3IE1hcChbXG4gICAgICAgICAgICBbXCJMRUZULTBcIiwgXCIjMDA4MDAwXCJdLFxuICAgICAgICAgICAgW1wiTEVGVC0xXCIsIFwiIzMzODA4OFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTBcIiwgXCIjRkZBNTAwXCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMVwiLCBcIiNGRkZGMDBcIl0sXG4gICAgICAgIF0pO1xuICAgICAgICB0aGlzLnN0dW5uZWRDb2xvciA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJvcmRlckNvbG9yID0gXCIjMDAzMzAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgY29sb3JLZXkgPSBgJHtwbGF5ZXIuc2lkZX0tJHtwbGF5ZXIuY29sb3JJbmRleH1gO1xuICAgICAgICAgICAgbGV0IGNvbG9yID0gcGxheWVyLmlzU3R1bm5lZCA/IHRoaXMuc3R1bm5lZENvbG9yIDogdGhpcy5jb2xvck1hcC5nZXQoY29sb3JLZXkpO1xuICAgICAgICAgICAgaWYgKGNvbG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlckNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLnBsYXllckJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5wb3NpdGlvbi54KSwgTWF0aC5yb3VuZChwbGF5ZXIucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5yYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICBpZiAoR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncy5JU19ERUJVRykge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCJyZWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCJyZWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLngpLCBNYXRoLnJvdW5kKHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnkpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5yYWRpdXMgLyA1LCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSBQbGF5ZXJSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vdXRpbHMvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vdXRpbHMvUG9pbnRcIik7XG5jbGFzcyBTY29yZVJlbmRlciB7XG4gICAgY29uc3RydWN0b3Ioc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZyYW1lRm9yTnVtYmVyID0gNjtcbiAgICAgICAgdGhpcy50b3RhbE51bWJlcnMgPSAxMDtcbiAgICAgICAgdGhpcy5zY29yZUNvbnRleHQgPSBzY29yZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZGlnaXRzSW1hZ2VzID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJkaWdpdHMucG5nXCIpO1xuICAgICAgICB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKHRoaXMuZGlnaXRzSW1hZ2VzLndpZHRoLCB0aGlzLmRpZ2l0c0ltYWdlcy5oZWlnaHQgLyAodGhpcy50b3RhbE51bWJlcnMgKiB0aGlzLmZyYW1lRm9yTnVtYmVyKSk7XG4gICAgICAgIGNvbnN0IHNjb3JlSGVpZ2h0ID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0ICogOSkgLyAxMDtcbiAgICAgICAgdGhpcy5zY29yZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoKHNjb3JlSGVpZ2h0ICogdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCkgLyB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgc2NvcmVIZWlnaHQpO1xuICAgICAgICBjb25zdCB5UG9zaXRpb24gPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgLSB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpIC8gMjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkFycmF5ID0gW1xuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoMCwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoICogMiwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgeVBvc2l0aW9uKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY29yZUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgLy8gVE9ETyBnZXN0aXJlIGFnZ2lvcm5hbWVudG8gcHVudGVnZ2lvXG4gICAgICAgIHRoaXMucG9zaXRpb25BcnJheS5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmRpZ2l0c0ltYWdlcywgMCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQgKiAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgcG9zaXRpb24ueCwgcG9zaXRpb24ueSwgdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSBTY29yZVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gdm9pZCAwO1xuY2xhc3MgVUlJbnRlcmFjdGlvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIH1cbiAgICB1cGRhdGUoaG92ZXJhYmxlLCBvbkNsaWNrLCBkZWx0YU1zKSB7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlcmVkID0gaG92ZXJhYmxlLmNvbnRhaW5zKHRoaXMuaW5wdXQubW91c2VQb3NpdGlvbik7XG4gICAgICAgIGlmIChob3ZlcmFibGUuaG92ZXJlZCAmJiB0aGlzLmlucHV0LmlzTW91c2VQcmVzc2VkKSB7XG4gICAgICAgICAgICBvbkNsaWNrKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RlcCA9IChkZWx0YU1zIC8gaG92ZXJhYmxlLmdldFRyYW5zaXRpb25UaW1lKCkpICogKGhvdmVyYWJsZS5ob3ZlcmVkID8gMSA6IC0xKTtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyArIHN0ZXApKTtcbiAgICB9XG59XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSBVSUludGVyYWN0aW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRpbWVuc2lvbnMgPSB2b2lkIDA7XG5jbGFzcyBEaW1lbnNpb25zIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxufVxuZXhwb3J0cy5EaW1lbnNpb25zID0gRGltZW5zaW9ucztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Eb21IYW5kbGVyID0gdm9pZCAwO1xuY2xhc3MgRG9tSGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIFt0aGlzLmJhY2tncm91bmRDYW52YXMsIHRoaXMuYmFja2dyb3VuZENvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJiYWNrZ3JvdW5kQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5zY29yZUNhbnZhcywgdGhpcy5zY29yZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJzY29yZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuZ2FtZUNhbnZhcywgdGhpcy5nYW1lQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImdhbWVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLm1lbnVDYW52YXMsIHRoaXMubWVudUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJtZW51Q2FudmFzXCIpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0Q2FudmFzKGlkKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBjb250ZXh0IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbY2FudmFzLCBjb250ZXh0XTtcbiAgICB9XG59XG5leHBvcnRzLkRvbUhhbmRsZXIgPSBEb21IYW5kbGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVDb25maWdzID0gdm9pZCAwO1xuY2xhc3MgR2FtZUNvbmZpZ3Mge1xuICAgIGNvbnN0cnVjdG9yKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJCb3JkZXIgPSAyO1xuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgKiA0LjUpIC8gNik7XG4gICAgICAgIHRoaXMuZmllbGRYT2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMTYpO1xuICAgICAgICB0aGlzLmZpZWxkV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLSB0aGlzLmZpZWxkWE9mZnNldCAqIDIpO1xuICAgICAgICB0aGlzLmdvYWxIZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA1KTtcbiAgICAgICAgdGhpcy5nb2FsWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmdvYWxIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMuZ29hbFBvc3RSYWRpdXMgPSBNYXRoLnJvdW5kKHRoaXMuZ29hbEhlaWdodCAvIDIwKTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0ID0gTWF0aC5yb3VuZCgoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCkgKiA1KSAvIDcpO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyID0gTWF0aC5mbG9vcih0aGlzLmZpZWxkSGVpZ2h0IC8gMjYpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciArIHRoaXMucGxheWVyQm9yZGVyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFggPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRXaWR0aCAvIDQpO1xuICAgICAgICB0aGlzLnBsYXllclN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgdGhpcy5jcHVTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyAodGhpcy5maWVsZFdpZHRoIC0gdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYKTtcbiAgICAgICAgdGhpcy5zaGFkb3dCbHVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgdGhpcy5zaGFkb3dPZmZzZXQgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogMC4zO1xuICAgICAgICB0aGlzLmZpZWxkQm9yZGVyU2l6ZSA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDEwMCk7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQgPSB0aGlzLmZpZWxkV2lkdGggLyA4O1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID0gdGhpcy5maWVsZEhlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID1cbiAgICAgICAgICAgIHRoaXMuZmllbGRIZWlnaHQgKyB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ICsgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5nYXRlc0xlbmd0aCA9IHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAzO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSBHYW1lQ29uZmlncztcbkdhbWVDb25maWdzLklTX0RFQlVHID0gdHJ1ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb2ludCA9IHZvaWQgMDtcbmNsYXNzIFBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXREaXN0YW5jZShwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50MS54IC0gcG9pbnQyLngsIDIpICsgTWF0aC5wb3cocG9pbnQxLnkgLSBwb2ludDIueSwgMikpO1xuICAgIH1cbn1cbmV4cG9ydHMuUG9pbnQgPSBQb2ludDtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgQXNzZXRMb2FkZXJfMSA9IHJlcXVpcmUoXCIuL2Fzc2V0cy9Bc3NldExvYWRlclwiKTtcbmNvbnN0IEdhbWVMb29wXzEgPSByZXF1aXJlKFwiLi9jb3JlL0dhbWVMb29wXCIpO1xuY29uc3QgRG9tSGFuZGxlcl8xID0gcmVxdWlyZShcIi4vdXRpbHMvRG9tSGFuZGxlclwiKTtcbmNvbnN0IEdhbWVDb25maWdzXzEgPSByZXF1aXJlKFwiLi91dGlscy9HYW1lQ29uZmlnc1wiKTtcbmNsYXNzIE1haW4ge1xuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0TG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyXzEuQXNzZXRMb2FkZXIoKTtcbiAgICAgICAgYXdhaXQgYXNzZXRMb2FkZXIuaW5pdCgpO1xuICAgICAgICBjb25zdCBkb21IYW5kbGVyID0gbmV3IERvbUhhbmRsZXJfMS5Eb21IYW5kbGVyKCk7XG4gICAgICAgIGNvbnN0IGdhbWVDb25maWdzID0gbmV3IEdhbWVDb25maWdzXzEuR2FtZUNvbmZpZ3MoZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLndpZHRoLCBkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jbG9zZUxvYWRpbmdXaW5kb3coKTtcbiAgICAgICAgY29uc3QgZ2FtZUxvb3AgPSBuZXcgR2FtZUxvb3BfMS5HYW1lTG9vcChnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICBnYW1lTG9vcC5tYWluKCk7XG4gICAgfVxuICAgIGNsb3NlTG9hZGluZ1dpbmRvdygpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZGluZ0RpdlwiKTtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kKCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIG9uVHJhbnNpdGlvbkVuZCk7XG4gICAgICAgICAgICAvL2RvbUhhbmRsZXIubWVudUNhbnZhcy5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9LCB7IG9uY2U6IHRydWUgfSk7XG4gICAgfVxufVxuY29uc3QgbWFpbiA9IG5ldyBNYWluKCk7XG5tYWluLmluaXQoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
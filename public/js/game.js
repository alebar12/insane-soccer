/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/assets/AssetLoader.ts"
/*!***********************************!*\
  !*** ./src/assets/AssetLoader.ts ***!
  \***********************************/
(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssetLoader = void 0;
class AssetLoader {
    constructor() {
        this.IMAGE_FOLDER = "images/";
        this.IMAGE_NAMES = ["balls.png", "field.png",
            "track.jpg", "RedParticle.png", "digits.png", "goal_field.png",
            "star.png", "play.png", "multiplayer.png", "single.png"];
        this.images = new Map();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.IMAGE_NAMES.map(fileName => this.loadImage(fileName, `${this.IMAGE_FOLDER}${fileName}`)));
        });
    }
    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    getImage(imageName) {
        let image = this.images.get(imageName);
        if (image === undefined) {
            throw new Error(imageName + " image not found");
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
const GameWorld_1 = __webpack_require__(/*! ../game/world/GameWorld */ "./src/game/world/GameWorld.ts");
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
class GameLoop {
    constructor(gameConfigs, domHandler) {
        this.delta = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler.backgroundContext);
        this.gameWorld = new GameWorld_1.GameWorld();
    }
    main() {
        const tick = (time) => {
            if (this.prevTime != 0) {
                this.delta = time - this.prevTime;
                this.update();
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    update() {
    }
    render() {
        this.mainRender.render(this.gameWorld);
    }
}
exports.GameLoop = GameLoop;


/***/ },

/***/ "./src/game/world/GameWorld.ts"
/*!*************************************!*\
  !*** ./src/game/world/GameWorld.ts ***!
  \*************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameWorld = void 0;
class GameWorld {
}
exports.GameWorld = GameWorld;


/***/ },

/***/ "./src/main.ts"
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const AssetLoader_1 = __webpack_require__(/*! ./assets/AssetLoader */ "./src/assets/AssetLoader.ts");
const GameLoop_1 = __webpack_require__(/*! ./core/GameLoop */ "./src/core/GameLoop.ts");
const DomHandler_1 = __webpack_require__(/*! ./utils/DomHandler */ "./src/utils/DomHandler.ts");
const GameConfigs_1 = __webpack_require__(/*! ./utils/GameConfigs */ "./src/utils/GameConfigs.ts");
class Main {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield AssetLoader_1.AssetLoader.getInstance().init();
            this.closeLoadingWindow();
            const domHandler = new DomHandler_1.DomHandler();
            const gameConfigs = new GameConfigs_1.GameConfigs(domHandler.mainVanvas.width, domHandler.mainVanvas.height);
            const gameLoop = new GameLoop_1.GameLoop(gameConfigs, domHandler);
            gameLoop.main();
        });
    }
    closeLoadingWindow() {
        const element = document.getElementById("loadingDiv");
        element.style.opacity = "0";
        element.addEventListener("transitionend", function onTransitionEnd() {
            element.style.display = "none";
            element.removeEventListener("transitionend", onTransitionEnd);
        }, { once: true });
        this.showMainMenu();
    }
    showMainMenu() {
        document.getElementById("menuCanvas").style.display = "block";
    }
}
const main = new Main();
main.init();


/***/ },

/***/ "./src/rendering/FieldRender.ts"
/*!**************************************!*\
  !*** ./src/rendering/FieldRender.ts ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FieldRender = void 0;
const AssetLoader_1 = __webpack_require__(/*! ../assets/AssetLoader */ "./src/assets/AssetLoader.ts");
class FieldRender {
    constructor(backgroundContext, gameConfigs) {
        this.fieldImage = AssetLoader_1.AssetLoader.getInstance().getImage("field.png");
        this.goalImage = AssetLoader_1.AssetLoader.getInstance().getImage("goal_field.png");
        this.trackFieldImage = AssetLoader_1.AssetLoader.getInstance().getImage("track.jpg");
        this.backgroundContext = backgroundContext;
        this.gameConfigs = gameConfigs;
        this.borderSize = Math.round(gameConfigs.getFieldHeight() / 100);
    }
    render(gameWorld) {
        this.backgroundContext.clearRect(0, 0, this.backgroundContext.canvas.width, this.backgroundContext.canvas.height);
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.fillStyle = 'rgba(255, 255, 255, 0)';
        this.backgroundContext.save();
        this.backgroundContext.fillRect(this.gameConfigs.width / 2, this.gameConfigs.width / 2, this.gameConfigs.width * 2, this.gameConfigs.width * 2);
        this.renderBackground();
        this.backgroundContext.shadowColor = '#000000';
        this.backgroundContext.shadowOffsetX = this.gameConfigs.getShadowBlur() * 0.3;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.getShadowBlur() * 0.3;
        this.backgroundContext.shadowBlur = this.gameConfigs.getShadowBlur();
        this.renderBorder();
        this.renderGoalPosts();
        this.backgroundContext.restore();
        this.renderAthleticTrack();
    }
    renderBackground() {
        this.backgroundContext.fillStyle = "#BBBBFF";
        this.backgroundContext.drawImage(this.fieldImage, this.gameConfigs.getFieldXOffset(), 0, this.gameConfigs.getFieldWidth(), this.gameConfigs.getFieldHeight());
        this.backgroundContext.drawImage(this.goalImage, 0, this.gameConfigs.getGoalYOffset(), this.gameConfigs.getFieldXOffset(), this.gameConfigs.getGoalHeight());
        this.backgroundContext.drawImage(this.goalImage, this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset(), this.gameConfigs.getFieldXOffset(), this.gameConfigs.getGoalHeight());
    }
    renderBorder() {
        this.backgroundContext.fillStyle = '#FFFFFF';
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = '#000000';
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, 0, this.gameConfigs.getFieldWidth() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, this.gameConfigs.getFieldHeight(), 
        // TODO da rivedere
        this.gameConfigs.getSubstitutionOffsetX() - this.gameConfigs.getFieldXOffset() + this.borderSize, this.borderSize);
        //this.backgroundContext.fillRect(rounded(playerVar.sub_x + playerVar.player_size*1.5), commonVariables.height, cpuVar.sub_x - playerVar.sub_x - playerVar.player_size*3, this.borderSize);
        //this.backgroundContext.fillRect(cpuVar.sub_x + playerVar.player_size*1.5, commonVariables.height, rounded(playerVar.sub_x - this.gameConfigs.getFieldXOffset() - playerVar.player_size*1.5), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, -this.borderSize, this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.getGoalYOffset() - this.borderSize, this.gameConfigs.getFieldXOffset() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getFieldXOffset() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(0, this.gameConfigs.getGoalYOffset() - this.borderSize, this.borderSize, this.gameConfigs.getGoalHeight() + this.borderSize * 2);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), -this.borderSize, this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.borderSize, this.gameConfigs.getGoalYOffset() +
            this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() - this.borderSize, this.gameConfigs.getFieldXOffset(), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getFieldXOffset(), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() * 2 + this.gameConfigs.getFieldWidth() - this.borderSize, this.gameConfigs.getGoalYOffset() - this.borderSize, this.borderSize, this.gameConfigs.getGoalHeight() + this.borderSize * 2);
    }
    renderGoalPosts() {
        this.backgroundContext.fillStyle = '#AAAAAA';
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = '#000000';
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.getFieldXOffset(), this.gameConfigs.getGoalYOffset(), this.gameConfigs.getGoalPostRadius(), 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.getFieldXOffset(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getGoalPostRadius(), 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset(), this.gameConfigs.getGoalPostRadius(), 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getGoalPostRadius(), 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
    }
    renderAthleticTrack() {
        this.backgroundContext.drawImage(this.trackFieldImage, this.gameConfigs.getFieldXOffset(), this.gameConfigs.getFieldHeight() + this.gameConfigs.getAthleticTrackYOffset(), this.gameConfigs.getFieldWidth(), this.gameConfigs.getAthleticTrackHeight());
    }
}
exports.FieldRender = FieldRender;


/***/ },

/***/ "./src/rendering/MainRender.ts"
/*!*************************************!*\
  !*** ./src/rendering/MainRender.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MainRender = void 0;
const FieldRender_1 = __webpack_require__(/*! ./FieldRender */ "./src/rendering/FieldRender.ts");
class MainRender {
    constructor(gameConfigs, backgroundContext) {
        this.fieldRender = new FieldRender_1.FieldRender(backgroundContext, gameConfigs);
    }
    render(gameWorld) {
        this.fieldRender.render(gameWorld);
    }
}
exports.MainRender = MainRender;


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
        this.mainVanvas = document.getElementById('backgroundCanvas');
        this.backgroundContext = this.mainVanvas.getContext("2d");
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
    constructor(canvasWitdh, canvasHeight) {
        this.width = canvasWitdh;
        this.height = canvasHeight;
    }
    getFieldHeight() {
        return Math.round(this.height * 4.5 / 6);
    }
    getFieldXOffset() {
        return Math.round(this.width / 16);
    }
    getFieldWidth() {
        return Math.round(this.width - (this.getFieldXOffset() * 2));
    }
    getGoalHeight() {
        return Math.round(this.getFieldHeight() / 5);
    }
    getShadowBlur() {
        // TODO da rivedere
        return 10;
    }
    getSubstitutionOffsetX() {
        return Math.round(this.getFieldWidth() / 3);
    }
    getGoalYOffset() {
        return Math.round(this.getFieldHeight() - this.getGoalHeight()) / 2;
    }
    getGoalPostRadius() {
        return Math.round(this.getGoalHeight() / 20);
    }
    getAthleticTrackHeight() {
        return Math.round((this.height - this.getFieldHeight()) * 5 / 7);
    }
    getAthleticTrackYOffset() {
        return Math.round((this.height - this.getFieldHeight() - this.getAthleticTrackHeight()) / 2);
    }
}
exports.GameConfigs = GameConfigs;


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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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c0JBQXNCLG1CQUFPLENBQUMscURBQWU7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjs7Ozs7Ozs7Ozs7QUNaTDtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCOzs7Ozs7Ozs7OztBQ1RMO0FBQ2IsOENBQTZDLEVBQUUsYUFBYSxFQUFDO0FBQzdELG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjs7Ozs7OztVQ3hDbkI7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVRTVCQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9hc3NldHMvQXNzZXRMb2FkZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2NvcmUvR2FtZUxvb3AudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvd29ybGQvR2FtZVdvcmxkLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9tYWluLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvRmllbGRSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyL3dlYnBhY2svc3RhcnR1cCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1wiYmFsbHMucG5nXCIsIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLCBcIlJlZFBhcnRpY2xlLnBuZ1wiLCBcImRpZ2l0cy5wbmdcIiwgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLCBcInBsYXkucG5nXCIsIFwibXVsdGlwbGF5ZXIucG5nXCIsIFwic2luZ2xlLnBuZ1wiXTtcbiAgICAgICAgdGhpcy5pbWFnZXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGluaXQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW5zdGFuY2UgfHwgKHRoaXMuX2luc3RhbmNlID0gbmV3IHRoaXMoKSk7XG4gICAgfVxuICAgIGdldEltYWdlKGltYWdlTmFtZSkge1xuICAgICAgICBsZXQgaW1hZ2UgPSB0aGlzLmltYWdlcy5nZXQoaW1hZ2VOYW1lKTtcbiAgICAgICAgaWYgKGltYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihpbWFnZU5hbWUgKyBcIiBpbWFnZSBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBsb2FkSW1hZ2UobmFtZSwgc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZXMuc2V0KG5hbWUsIGltZyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSBBc3NldExvYWRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lTG9vcCA9IHZvaWQgMDtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgTWFpblJlbmRlcl8xID0gcmVxdWlyZShcIi4uL3JlbmRlcmluZy9NYWluUmVuZGVyXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyKSB7XG4gICAgICAgIHRoaXMuZGVsdGEgPSAwO1xuICAgICAgICB0aGlzLnByZXZUaW1lID0gMDtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyID0gbmV3IE1haW5SZW5kZXJfMS5NYWluUmVuZGVyKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0KTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQgPSBuZXcgR2FtZVdvcmxkXzEuR2FtZVdvcmxkKCk7XG4gICAgfVxuICAgIG1haW4oKSB7XG4gICAgICAgIGNvbnN0IHRpY2sgPSAodGltZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldlRpbWUgIT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoKSB7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcih0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVXb3JsZCA9IHZvaWQgMDtcbmNsYXNzIEdhbWVXb3JsZCB7XG59XG5leHBvcnRzLkdhbWVXb3JsZCA9IEdhbWVXb3JsZDtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91dGlscy9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgaW5pdCgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIEFzc2V0TG9hZGVyXzEuQXNzZXRMb2FkZXIuZ2V0SW5zdGFuY2UoKS5pbml0KCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLm1haW5WYW52YXMud2lkdGgsIGRvbUhhbmRsZXIubWFpblZhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgY29uc3QgZ2FtZUxvb3AgPSBuZXcgR2FtZUxvb3BfMS5HYW1lTG9vcChnYW1lQ29uZmlncywgZG9tSGFuZGxlcik7XG4gICAgICAgICAgICBnYW1lTG9vcC5tYWluKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICB9LCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuc2hvd01haW5NZW51KCk7XG4gICAgfVxuICAgIHNob3dNYWluTWVudSgpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtZW51Q2FudmFzXCIpLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgfVxufVxuY29uc3QgbWFpbiA9IG5ldyBNYWluKCk7XG5tYWluLmluaXQoKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaWVsZFJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY2xhc3MgRmllbGRSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyLmdldEluc3RhbmNlKCkuZ2V0SW1hZ2UoXCJmaWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMuZ29hbEltYWdlID0gQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlci5nZXRJbnN0YW5jZSgpLmdldEltYWdlKFwiZ29hbF9maWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMudHJhY2tGaWVsZEltYWdlID0gQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlci5nZXRJbnN0YW5jZSgpLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5ib3JkZXJTaXplID0gTWF0aC5yb3VuZChnYW1lQ29uZmlncy5nZXRGaWVsZEhlaWdodCgpIC8gMTAwKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDApJztcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy53aWR0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3Mud2lkdGggLyAyLCB0aGlzLmdhbWVDb25maWdzLndpZHRoICogMiwgdGhpcy5nYW1lQ29uZmlncy53aWR0aCAqIDIpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9ICcjMDAwMDAwJztcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5nZXRTaGFkb3dCbHVyKCkgKiAwLjM7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0U2hhZG93Qmx1cigpICogMC4zO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLmdldFNoYWRvd0JsdXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQXRobGV0aWNUcmFjaygpO1xuICAgIH1cbiAgICByZW5kZXJCYWNrZ3JvdW5kKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0JCQkJGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCksIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkSGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFdpZHRoKCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCkpO1xuICAgIH1cbiAgICByZW5kZXJCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gJyNGRkZGRkYnO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSAnIzAwMDAwMCc7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAtIHRoaXMuYm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFdpZHRoKCkgKyB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZEhlaWdodCgpLCBcbiAgICAgICAgLy8gVE9ETyBkYSByaXZlZGVyZVxuICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdldFN1YnN0aXR1dGlvbk9mZnNldFgoKSAtIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIC8vdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdChyb3VuZGVkKHBsYXllclZhci5zdWJfeCArIHBsYXllclZhci5wbGF5ZXJfc2l6ZSoxLjUpLCBjb21tb25WYXJpYWJsZXMuaGVpZ2h0LCBjcHVWYXIuc3ViX3ggLSBwbGF5ZXJWYXIuc3ViX3ggLSBwbGF5ZXJWYXIucGxheWVyX3NpemUqMywgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgLy90aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KGNwdVZhci5zdWJfeCArIHBsYXllclZhci5wbGF5ZXJfc2l6ZSoxLjUsIGNvbW1vblZhcmlhYmxlcy5oZWlnaHQsIHJvdW5kZWQocGxheWVyVmFyLnN1Yl94IC0gdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAtIHBsYXllclZhci5wbGF5ZXJfc2l6ZSoxLjUpLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgLSB0aGlzLmJvcmRlclNpemUsIC10aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSwgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KC10aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCgtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCgwLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCkgKyB0aGlzLmJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFdpZHRoKCksIC10aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFdpZHRoKCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbEhlaWdodCgpLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSArXG4gICAgICAgICAgICB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCksIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAqIDIgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbEhlaWdodCgpICsgdGhpcy5ib3JkZXJTaXplICogMik7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSAnI0FBQUFBQSc7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9ICcjMDAwMDAwJztcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxQb3N0UmFkaXVzKCksIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsUG9zdFJhZGl1cygpLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFBvc3RSYWRpdXMoKSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFBvc3RSYWRpdXMoKSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkSGVpZ2h0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEF0aGxldGljVHJhY2tZT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEF0aGxldGljVHJhY2tIZWlnaHQoKSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5SZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vRmllbGRSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYmFja2dyb3VuZENvbnRleHQpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlciA9IG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tYWluVmFudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhY2tncm91bmRDYW52YXMnKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IHRoaXMubWFpblZhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgfVxufVxuZXhwb3J0cy5Eb21IYW5kbGVyID0gRG9tSGFuZGxlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaXRkaCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNXaXRkaDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXNIZWlnaHQ7XG4gICAgfVxuICAgIGdldEZpZWxkSGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmhlaWdodCAqIDQuNSAvIDYpO1xuICAgIH1cbiAgICBnZXRGaWVsZFhPZmZzZXQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAxNik7XG4gICAgfVxuICAgIGdldEZpZWxkV2lkdGgoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMud2lkdGggLSAodGhpcy5nZXRGaWVsZFhPZmZzZXQoKSAqIDIpKTtcbiAgICB9XG4gICAgZ2V0R29hbEhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5nZXRGaWVsZEhlaWdodCgpIC8gNSk7XG4gICAgfVxuICAgIGdldFNoYWRvd0JsdXIoKSB7XG4gICAgICAgIC8vIFRPRE8gZGEgcml2ZWRlcmVcbiAgICAgICAgcmV0dXJuIDEwO1xuICAgIH1cbiAgICBnZXRTdWJzdGl0dXRpb25PZmZzZXRYKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmdldEZpZWxkV2lkdGgoKSAvIDMpO1xuICAgIH1cbiAgICBnZXRHb2FsWU9mZnNldCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQodGhpcy5nZXRGaWVsZEhlaWdodCgpIC0gdGhpcy5nZXRHb2FsSGVpZ2h0KCkpIC8gMjtcbiAgICB9XG4gICAgZ2V0R29hbFBvc3RSYWRpdXMoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuZ2V0R29hbEhlaWdodCgpIC8gMjApO1xuICAgIH1cbiAgICBnZXRBdGhsZXRpY1RyYWNrSGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgLSB0aGlzLmdldEZpZWxkSGVpZ2h0KCkpICogNSAvIDcpO1xuICAgIH1cbiAgICBnZXRBdGhsZXRpY1RyYWNrWU9mZnNldCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5nZXRGaWVsZEhlaWdodCgpIC0gdGhpcy5nZXRBdGhsZXRpY1RyYWNrSGVpZ2h0KCkpIC8gMik7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvbWFpbi50c1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
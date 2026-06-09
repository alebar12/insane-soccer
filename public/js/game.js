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
            "multiplayer.png",
            "single.png",
        ];
        this.images = new Map();
    }
    async init() {
        await Promise.all(this.IMAGE_NAMES.map(fileName => this.loadImage(fileName, `${this.IMAGE_FOLDER}${fileName}`)));
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
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        //private delta : number = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler.backgroundContext, assetLoader);
    }
    main() {
        const tick = (time) => {
            if (this.prevTime !== 0) {
                //this.delta = time - this.prevTime;
                this.update();
                this.render();
            }
            this.prevTime = time;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    update() { }
    render() {
        this.mainRender.render();
    }
}
exports.GameLoop = GameLoop;


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
        this.fieldImage = assetLoader.getImage("field.png");
        this.goalImage = assetLoader.getImage("goal_field.png");
        this.trackFieldImage = assetLoader.getImage("track.jpg");
        this.backgroundContext = backgroundContext;
        this.gameConfigs = gameConfigs;
        this.borderSize = Math.round(gameConfigs.fieldHeight / 100);
    }
    render() {
        this.backgroundContext.clearRect(0, 0, this.backgroundContext.canvas.width, this.backgroundContext.canvas.height);
        this.backgroundContext.save();
        this.renderBackground();
        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.shadowBlur * 0.3;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.shadowBlur * 0.3;
        this.backgroundContext.shadowBlur = this.gameConfigs.shadowBlur;
        this.renderBorder();
        this.renderGoalPosts();
        this.backgroundContext.restore();
        this.renderAthleticTrack();
    }
    renderBackground() {
        this.backgroundContext.fillStyle = "#BBBBFF";
        this.backgroundContext.drawImage(this.fieldImage, this.gameConfigs.fieldXOffset, 0, this.gameConfigs.fieldWidth, this.gameConfigs.fieldHeight);
        this.backgroundContext.drawImage(this.goalImage, 0, this.gameConfigs.goalYOffset, this.gameConfigs.fieldXOffset, this.gameConfigs.goalHeight);
        this.backgroundContext.drawImage(this.goalImage, this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset, this.gameConfigs.fieldXOffset, this.gameConfigs.goalHeight);
    }
    renderBorder() {
        this.backgroundContext.fillStyle = "#FFFFFF";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset - this.borderSize, 0, this.gameConfigs.fieldWidth + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset - this.borderSize, this.gameConfigs.fieldHeight, 
        // TODO da rivedere
        this.gameConfigs.substitutionOffsetX - this.gameConfigs.fieldXOffset + this.borderSize, this.borderSize);
        //this.backgroundContext.fillRect(rounded(playerVar.sub_x + playerVar.player_size*1.5), commonVariables.height, cpuVar.sub_x - playerVar.sub_x - playerVar.player_size*3, this.borderSize);
        //this.backgroundContext.fillRect(cpuVar.sub_x + playerVar.player_size*1.5, commonVariables.height, rounded(playerVar.sub_x - this.gameConfigs.fieldXOffset - playerVar.player_size*1.5), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset - this.borderSize, -this.borderSize, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset - this.borderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.goalYOffset - this.borderSize, this.gameConfigs.fieldXOffset + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(0, this.gameConfigs.goalYOffset - this.borderSize, this.borderSize, this.gameConfigs.goalHeight + this.borderSize * 2);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, -this.borderSize, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset - this.borderSize, this.gameConfigs.fieldXOffset, this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset, this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.fieldXOffset * 2 + this.gameConfigs.fieldWidth - this.borderSize, this.gameConfigs.goalYOffset - this.borderSize, this.borderSize, this.gameConfigs.goalHeight + this.borderSize * 2);
    }
    renderGoalPosts() {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.fieldXOffset, this.gameConfigs.goalYOffset, this.gameConfigs.goalPostRadius, 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.fieldXOffset, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.goalPostRadius, 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset, this.gameConfigs.goalPostRadius, 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
        this.backgroundContext.beginPath();
        this.backgroundContext.arc(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.goalPostRadius, 0, 2 * Math.PI, false);
        this.backgroundContext.closePath();
        this.backgroundContext.fill();
        this.backgroundContext.stroke();
    }
    renderAthleticTrack() {
        this.backgroundContext.drawImage(this.trackFieldImage, this.gameConfigs.fieldXOffset, this.gameConfigs.fieldHeight + this.gameConfigs.athleticTrackYOffset, this.gameConfigs.fieldWidth, this.gameConfigs.athleticTrackHeight);
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
    constructor(gameConfigs, backgroundContext, assetLoader) {
        this.fieldRender = new FieldRender_1.FieldRender(backgroundContext, gameConfigs, assetLoader);
    }
    render() {
        this.fieldRender.render();
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
        this.mainCanvas = document.getElementById("backgroundCanvas");
        if (!this.mainCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const backgroundContext = this.mainCanvas.getContext("2d");
        if (!backgroundContext) {
            throw new Error("backgroundContext not found");
        }
        this.backgroundContext = backgroundContext;
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
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.fieldHeight = Math.round((this.height * 4.5) / 6);
        this.fieldXOffset = Math.round(this.width / 16);
        this.fieldWidth = Math.round(this.width - this.fieldXOffset * 2);
        this.goalHeight = Math.round(this.fieldHeight / 5);
        this.goalYOffset = Math.round((this.fieldHeight - this.goalHeight) / 2);
        this.shadowBlur = 10; // TODO DA RIVEDERE
        this.substitutionOffsetX = Math.round(this.fieldWidth / 3);
        this.goalPostRadius = Math.round(this.goalHeight / 20);
        this.athleticTrackHeight = Math.round(((this.height - this.fieldHeight) * 5) / 7);
        this.athleticTrackYOffset = Math.round((this.height - this.fieldHeight - this.athleticTrackHeight) / 2);
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
        this.closeLoadingWindow();
        const domHandler = new DomHandler_1.DomHandler();
        const gameConfigs = new GameConfigs_1.GameConfigs(domHandler.mainCanvas.width, domHandler.mainCanvas.height);
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
        }, { once: true });
        this.showMainMenu();
    }
    showMainMenu() {
        const element = document.getElementById("menuCanvas");
        if (!element) {
            return;
        }
        element.style.display = "block";
    }
}
const main = new Main();
main.init();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksWUFBWTtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvRmllbGRSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiLFxuICAgICAgICAgICAgXCJtdWx0aXBsYXllci5wbmdcIixcbiAgICAgICAgICAgIFwic2luZ2xlLnBuZ1wiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmltYWdlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5JTUFHRV9OQU1FUy5tYXAoZmlsZU5hbWUgPT4gdGhpcy5sb2FkSW1hZ2UoZmlsZU5hbWUsIGAke3RoaXMuSU1BR0VfRk9MREVSfSR7ZmlsZU5hbWV9YCkpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGxldCBpbWFnZSA9IHRoaXMuaW1hZ2VzLmdldChpbWFnZU5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGltYWdlTmFtZSArIFwiIGltYWdlIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgTWFpblJlbmRlcl8xID0gcmVxdWlyZShcIi4uL3JlbmRlcmluZy9NYWluUmVuZGVyXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICAvL3ByaXZhdGUgZGVsdGEgOiBudW1iZXIgPSAwO1xuICAgICAgICB0aGlzLnByZXZUaW1lID0gMDtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyID0gbmV3IE1haW5SZW5kZXJfMS5NYWluUmVuZGVyKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBhc3NldExvYWRlcik7XG4gICAgfVxuICAgIG1haW4oKSB7XG4gICAgICAgIGNvbnN0IHRpY2sgPSAodGltZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldlRpbWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICAvL3RoaXMuZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoKSB7IH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMubWFpblJlbmRlci5yZW5kZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVMb29wID0gR2FtZUxvb3A7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmllbGRSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImdvYWxfZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLnRyYWNrRmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5ib3JkZXJTaXplID0gTWF0aC5yb3VuZChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDEwMCk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXIgKiAwLjM7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1ciAqIDAuMztcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICB0aGlzLnJlbmRlckJvcmRlcigpO1xuICAgICAgICB0aGlzLnJlbmRlckdvYWxQb3N0cygpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJBdGhsZXRpY1RyYWNrKCk7XG4gICAgfVxuICAgIHJlbmRlckJhY2tncm91bmQoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQkJCQkZGXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCAwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuYm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCBcbiAgICAgICAgLy8gVE9ETyBkYSByaXZlZGVyZVxuICAgICAgICB0aGlzLmdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFggLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgLy90aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHJvdW5kZWQocGxheWVyVmFyLnN1Yl94ICsgcGxheWVyVmFyLnBsYXllcl9zaXplKjEuNSksIGNvbW1vblZhcmlhYmxlcy5oZWlnaHQsIGNwdVZhci5zdWJfeCAtIHBsYXllclZhci5zdWJfeCAtIHBsYXllclZhci5wbGF5ZXJfc2l6ZSozLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICAvL3RoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QoY3B1VmFyLnN1Yl94ICsgcGxheWVyVmFyLnBsYXllcl9zaXplKjEuNSwgY29tbW9uVmFyaWFibGVzLmhlaWdodCwgcm91bmRlZChwbGF5ZXJWYXIuc3ViX3ggLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHBsYXllclZhci5wbGF5ZXJfc2l6ZSoxLjUpLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5ib3JkZXJTaXplLCAtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KC10aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KC10aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5ib3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIC10aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAqIDIgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5ib3JkZXJTaXplICogMik7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNBQUFBQUFcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFBvc3RSYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICB9XG4gICAgcmVuZGVyQXRobGV0aWNUcmFjaygpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy50cmFja0ZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tIZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmllbGRSZW5kZXIgPSBGaWVsZFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0ZpZWxkUmVuZGVyXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGJhY2tncm91bmRDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZpZWxkUmVuZGVyID0gbmV3IEZpZWxkUmVuZGVyXzEuRmllbGRSZW5kZXIoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tYWluQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWNrZ3JvdW5kQ2FudmFzXCIpO1xuICAgICAgICBpZiAoIXRoaXMubWFpbkNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYmFja2dyb3VuZENhbnZhcyBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYmFja2dyb3VuZENvbnRleHQgPSB0aGlzLm1haW5DYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoIWJhY2tncm91bmRDb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJiYWNrZ3JvdW5kQ29udGV4dCBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IGJhY2tncm91bmRDb250ZXh0O1xuICAgIH1cbn1cbmV4cG9ydHMuRG9tSGFuZGxlciA9IERvbUhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSB2b2lkIDA7XG5jbGFzcyBHYW1lQ29uZmlncyB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCkge1xuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgKiA0LjUpIC8gNik7XG4gICAgICAgIHRoaXMuZmllbGRYT2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMTYpO1xuICAgICAgICB0aGlzLmZpZWxkV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLSB0aGlzLmZpZWxkWE9mZnNldCAqIDIpO1xuICAgICAgICB0aGlzLmdvYWxIZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA1KTtcbiAgICAgICAgdGhpcy5nb2FsWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmdvYWxIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IDEwOyAvLyBUT0RPIERBIFJJVkVERVJFXG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCA9IE1hdGgucm91bmQodGhpcy5maWVsZFdpZHRoIC8gMyk7XG4gICAgICAgIHRoaXMuZ29hbFBvc3RSYWRpdXMgPSBNYXRoLnJvdW5kKHRoaXMuZ29hbEhlaWdodCAvIDIwKTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0ID0gTWF0aC5yb3VuZCgoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCkgKiA1KSAvIDcpO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0KSAvIDIpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSBHYW1lQ29uZmlncztcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgQXNzZXRMb2FkZXJfMSA9IHJlcXVpcmUoXCIuL2Fzc2V0cy9Bc3NldExvYWRlclwiKTtcbmNvbnN0IEdhbWVMb29wXzEgPSByZXF1aXJlKFwiLi9jb3JlL0dhbWVMb29wXCIpO1xuY29uc3QgRG9tSGFuZGxlcl8xID0gcmVxdWlyZShcIi4vdXRpbHMvRG9tSGFuZGxlclwiKTtcbmNvbnN0IEdhbWVDb25maWdzXzEgPSByZXF1aXJlKFwiLi91dGlscy9HYW1lQ29uZmlnc1wiKTtcbmNsYXNzIE1haW4ge1xuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0TG9hZGVyID0gbmV3IEFzc2V0TG9hZGVyXzEuQXNzZXRMb2FkZXIoKTtcbiAgICAgICAgYXdhaXQgYXNzZXRMb2FkZXIuaW5pdCgpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBkb21IYW5kbGVyID0gbmV3IERvbUhhbmRsZXJfMS5Eb21IYW5kbGVyKCk7XG4gICAgICAgIGNvbnN0IGdhbWVDb25maWdzID0gbmV3IEdhbWVDb25maWdzXzEuR2FtZUNvbmZpZ3MoZG9tSGFuZGxlci5tYWluQ2FudmFzLndpZHRoLCBkb21IYW5kbGVyLm1haW5DYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29uc3QgZ2FtZUxvb3AgPSBuZXcgR2FtZUxvb3BfMS5HYW1lTG9vcChnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICBnYW1lTG9vcC5tYWluKCk7XG4gICAgfVxuICAgIGNsb3NlTG9hZGluZ1dpbmRvdygpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZGluZ0RpdlwiKTtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kKCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIG9uVHJhbnNpdGlvbkVuZCk7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5zaG93TWFpbk1lbnUoKTtcbiAgICB9XG4gICAgc2hvd01haW5NZW51KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtZW51Q2FudmFzXCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgfVxufVxuY29uc3QgbWFpbiA9IG5ldyBNYWluKCk7XG5tYWluLmluaXQoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==
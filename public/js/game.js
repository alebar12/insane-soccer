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
    constructor(gameConfigs, domHandler) {
        //private delta : number = 0;
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler.backgroundContext);
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
    render() {
        this.backgroundContext.clearRect(0, 0, this.backgroundContext.canvas.width, this.backgroundContext.canvas.height);
        this.backgroundContext.save();
        this.backgroundContext.fillRect(this.gameConfigs.width / 2, this.gameConfigs.width / 2, this.gameConfigs.width * 2, this.gameConfigs.width * 2);
        this.renderBackground();
        this.backgroundContext.shadowColor = "#000000";
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
        this.backgroundContext.fillStyle = "#FFFFFF";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, 0, this.gameConfigs.getFieldWidth() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, this.gameConfigs.getFieldHeight(), 
        // TODO da rivedere
        this.gameConfigs.getSubstitutionOffsetX() -
            this.gameConfigs.getFieldXOffset() +
            this.borderSize, this.borderSize);
        //this.backgroundContext.fillRect(rounded(playerVar.sub_x + playerVar.player_size*1.5), commonVariables.height, cpuVar.sub_x - playerVar.sub_x - playerVar.player_size*3, this.borderSize);
        //this.backgroundContext.fillRect(cpuVar.sub_x + playerVar.player_size*1.5, commonVariables.height, rounded(playerVar.sub_x - this.gameConfigs.getFieldXOffset() - playerVar.player_size*1.5), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, -this.borderSize, this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() - this.borderSize, this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.getGoalYOffset() - this.borderSize, this.gameConfigs.getFieldXOffset() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(-this.borderSize, this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getFieldXOffset() + this.borderSize, this.borderSize);
        this.backgroundContext.fillRect(0, this.gameConfigs.getGoalYOffset() - this.borderSize, this.borderSize, this.gameConfigs.getGoalHeight() + this.borderSize * 2);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), -this.borderSize, this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.borderSize, this.gameConfigs.getGoalYOffset() + this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() - this.borderSize, this.gameConfigs.getFieldXOffset(), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() + this.gameConfigs.getFieldWidth(), this.gameConfigs.getGoalYOffset() + this.gameConfigs.getGoalHeight(), this.gameConfigs.getFieldXOffset(), this.borderSize);
        this.backgroundContext.fillRect(this.gameConfigs.getFieldXOffset() * 2 +
            this.gameConfigs.getFieldWidth() -
            this.borderSize, this.gameConfigs.getGoalYOffset() - this.borderSize, this.borderSize, this.gameConfigs.getGoalHeight() + this.borderSize * 2);
    }
    renderGoalPosts() {
        this.backgroundContext.fillStyle = "#AAAAAA";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.strokeStyle = "#000000";
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
        this.backgroundContext = this.mainCanvas.getContext("2d");
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
    }
    getFieldHeight() {
        return Math.round((this.height * 4.5) / 6);
    }
    getFieldXOffset() {
        return Math.round(this.width / 16);
    }
    getFieldWidth() {
        return Math.round(this.width - this.getFieldXOffset() * 2);
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
        return Math.round((this.getFieldHeight() - this.getGoalHeight()) / 2);
    }
    getGoalPostRadius() {
        return Math.round(this.getGoalHeight() / 20);
    }
    getAthleticTrackHeight() {
        return Math.round(((this.height - this.getFieldHeight()) * 5) / 7);
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
        await AssetLoader_1.AssetLoader.getInstance().init();
        this.closeLoadingWindow();
        const domHandler = new DomHandler_1.DomHandler();
        const gameConfigs = new GameConfigs_1.GameConfigs(domHandler.mainCanvas.width, domHandler.mainCanvas.height);
        const gameLoop = new GameLoop_1.GameLoop(gameConfigs, domHandler);
        gameLoop.main();
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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cEQsbUJBQW1CLG1CQUFPLENBQUMsK0NBQWlCO0FBQzVDLHFCQUFxQixtQkFBTyxDQUFDLHFEQUFvQjtBQUNqRCxzQkFBc0IsbUJBQU8sQ0FBQyx1REFBcUI7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9hc3NldHMvQXNzZXRMb2FkZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2NvcmUvR2FtZUxvb3AudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9GaWVsZFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01haW5SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0RvbUhhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0dhbWVDb25maWdzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSB2b2lkIDA7XG5jbGFzcyBBc3NldExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuSU1BR0VfRk9MREVSID0gXCJpbWFnZXMvXCI7XG4gICAgICAgIHRoaXMuSU1BR0VfTkFNRVMgPSBbXG4gICAgICAgICAgICBcImJhbGxzLnBuZ1wiLFxuICAgICAgICAgICAgXCJmaWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwidHJhY2suanBnXCIsXG4gICAgICAgICAgICBcIlJlZFBhcnRpY2xlLnBuZ1wiLFxuICAgICAgICAgICAgXCJkaWdpdHMucG5nXCIsXG4gICAgICAgICAgICBcImdvYWxfZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInN0YXIucG5nXCIsXG4gICAgICAgICAgICBcInBsYXkucG5nXCIsXG4gICAgICAgICAgICBcIm11bHRpcGxheWVyLnBuZ1wiLFxuICAgICAgICAgICAgXCJzaW5nbGUucG5nXCIsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0SW5zdGFuY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZSB8fCAodGhpcy5faW5zdGFuY2UgPSBuZXcgdGhpcygpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGxldCBpbWFnZSA9IHRoaXMuaW1hZ2VzLmdldChpbWFnZU5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGltYWdlTmFtZSArIFwiIGltYWdlIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgTWFpblJlbmRlcl8xID0gcmVxdWlyZShcIi4uL3JlbmRlcmluZy9NYWluUmVuZGVyXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyKSB7XG4gICAgICAgIC8vcHJpdmF0ZSBkZWx0YSA6IG51bWJlciA9IDA7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENvbnRleHQpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgLy90aGlzLmRlbHRhID0gdGltZSAtIHRoaXMucHJldlRpbWU7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICB9XG4gICAgdXBkYXRlKCkgeyB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIucmVuZGVyKCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgQXNzZXRMb2FkZXJfMSA9IHJlcXVpcmUoXCIuLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZmllbGRJbWFnZSA9IEFzc2V0TG9hZGVyXzEuQXNzZXRMb2FkZXIuZ2V0SW5zdGFuY2UoKS5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyLmdldEluc3RhbmNlKCkuZ2V0SW1hZ2UoXCJnb2FsX2ZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy50cmFja0ZpZWxkSW1hZ2UgPSBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyLmdldEluc3RhbmNlKCkuZ2V0SW1hZ2UoXCJ0cmFjay5qcGdcIik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLmJvcmRlclNpemUgPSBNYXRoLnJvdW5kKGdhbWVDb25maWdzLmdldEZpZWxkSGVpZ2h0KCkgLyAxMDApO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLndpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy53aWR0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3Mud2lkdGggKiAyLCB0aGlzLmdhbWVDb25maWdzLndpZHRoICogMik7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0U2hhZG93Qmx1cigpICogMC4zO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLmdldFNoYWRvd0JsdXIoKSAqIDAuMztcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5nZXRTaGFkb3dCbHVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQm9yZGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyR29hbFBvc3RzKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICB9XG4gICAgcmVuZGVyQmFja2dyb3VuZCgpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNCQkJCRkZcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5maWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCAwLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZEhlaWdodCgpKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbEhlaWdodCgpKTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCAwLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSArIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkSGVpZ2h0KCksIFxuICAgICAgICAvLyBUT0RPIGRhIHJpdmVkZXJlXG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0U3Vic3RpdHV0aW9uT2Zmc2V0WCgpIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgK1xuICAgICAgICAgICAgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICAvL3RoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3Qocm91bmRlZChwbGF5ZXJWYXIuc3ViX3ggKyBwbGF5ZXJWYXIucGxheWVyX3NpemUqMS41KSwgY29tbW9uVmFyaWFibGVzLmhlaWdodCwgY3B1VmFyLnN1Yl94IC0gcGxheWVyVmFyLnN1Yl94IC0gcGxheWVyVmFyLnBsYXllcl9zaXplKjMsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIC8vdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdChjcHVWYXIuc3ViX3ggKyBwbGF5ZXJWYXIucGxheWVyX3NpemUqMS41LCBjb21tb25WYXJpYWJsZXMuaGVpZ2h0LCByb3VuZGVkKHBsYXllclZhci5zdWJfeCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgLSBwbGF5ZXJWYXIucGxheWVyX3NpemUqMS41KSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCAtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsUmVjdCgtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QoLXRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbEhlaWdodCgpICsgdGhpcy5ib3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCAtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFlPZmZzZXQoKSArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSwgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpIC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCksIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QodGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSAqIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFdpZHRoKCkgLVxuICAgICAgICAgICAgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCkgKyB0aGlzLmJvcmRlclNpemUgKiAyKTtcbiAgICB9XG4gICAgcmVuZGVyR29hbFBvc3RzKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0FBQUFBQVwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxQb3N0UmFkaXVzKCksIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyh0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxIZWlnaHQoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsUG9zdFJhZGl1cygpLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5nZXRGaWVsZFhPZmZzZXQoKSArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEdvYWxZT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFBvc3RSYWRpdXMoKSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRYT2Zmc2V0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkV2lkdGgoKSwgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsWU9mZnNldCgpICsgdGhpcy5nYW1lQ29uZmlncy5nZXRHb2FsSGVpZ2h0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0R29hbFBvc3RSYWRpdXMoKSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkWE9mZnNldCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEZpZWxkSGVpZ2h0KCkgKyB0aGlzLmdhbWVDb25maWdzLmdldEF0aGxldGljVHJhY2tZT2Zmc2V0KCksIHRoaXMuZ2FtZUNvbmZpZ3MuZ2V0RmllbGRXaWR0aCgpLCB0aGlzLmdhbWVDb25maWdzLmdldEF0aGxldGljVHJhY2tIZWlnaHQoKSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5SZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vRmllbGRSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYmFja2dyb3VuZENvbnRleHQpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlciA9IG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tYWluQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiYWNrZ3JvdW5kQ2FudmFzXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gdGhpcy5tYWluQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICB9XG59XG5leHBvcnRzLkRvbUhhbmRsZXIgPSBEb21IYW5kbGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVDb25maWdzID0gdm9pZCAwO1xuY2xhc3MgR2FtZUNvbmZpZ3Mge1xuICAgIGNvbnN0cnVjdG9yKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICB9XG4gICAgZ2V0RmllbGRIZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAqIDQuNSkgLyA2KTtcbiAgICB9XG4gICAgZ2V0RmllbGRYT2Zmc2V0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMTYpO1xuICAgIH1cbiAgICBnZXRGaWVsZFdpZHRoKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5nZXRGaWVsZFhPZmZzZXQoKSAqIDIpO1xuICAgIH1cbiAgICBnZXRHb2FsSGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmdldEZpZWxkSGVpZ2h0KCkgLyA1KTtcbiAgICB9XG4gICAgZ2V0U2hhZG93Qmx1cigpIHtcbiAgICAgICAgLy8gVE9ETyBkYSByaXZlZGVyZVxuICAgICAgICByZXR1cm4gMTA7XG4gICAgfVxuICAgIGdldFN1YnN0aXR1dGlvbk9mZnNldFgoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHRoaXMuZ2V0RmllbGRXaWR0aCgpIC8gMyk7XG4gICAgfVxuICAgIGdldEdvYWxZT2Zmc2V0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgodGhpcy5nZXRGaWVsZEhlaWdodCgpIC0gdGhpcy5nZXRHb2FsSGVpZ2h0KCkpIC8gMik7XG4gICAgfVxuICAgIGdldEdvYWxQb3N0UmFkaXVzKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmdldEdvYWxIZWlnaHQoKSAvIDIwKTtcbiAgICB9XG4gICAgZ2V0QXRobGV0aWNUcmFja0hlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZ2V0RmllbGRIZWlnaHQoKSkgKiA1KSAvIDcpO1xuICAgIH1cbiAgICBnZXRBdGhsZXRpY1RyYWNrWU9mZnNldCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5nZXRGaWVsZEhlaWdodCgpIC0gdGhpcy5nZXRBdGhsZXRpY1RyYWNrSGVpZ2h0KCkpIC8gMik7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91dGlscy9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlci5nZXRJbnN0YW5jZSgpLmluaXQoKTtcbiAgICAgICAgdGhpcy5jbG9zZUxvYWRpbmdXaW5kb3coKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIubWFpbkNhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5tYWluQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIpO1xuICAgICAgICBnYW1lTG9vcC5tYWluKCk7XG4gICAgfVxuICAgIGNsb3NlTG9hZGluZ1dpbmRvdygpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9hZGluZ0RpdlwiKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gXCIwXCI7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kKCkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIG9uVHJhbnNpdGlvbkVuZCk7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICAgICAgdGhpcy5zaG93TWFpbk1lbnUoKTtcbiAgICB9XG4gICAgc2hvd01haW5NZW51KCkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1lbnVDYW52YXNcIikuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
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
            "play.png"
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
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
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
        this.renderAthleticTrack();
        this.backgroundContext.shadowColor = "#000000";
        this.backgroundContext.shadowOffsetX = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowOffsetY = this.gameConfigs.shadowOffset;
        this.backgroundContext.shadowBlur = this.gameConfigs.shadowBlur;
        this.renderBorder();
        this.renderGoalPosts();
        this.renderWindows();
        this.backgroundContext.restore();
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
        this.backgroundContext.beginPath();
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.borderSize, 0, this.gameConfigs.fieldWidth + this.borderSize, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.borderSize, this.gameConfigs.fieldHeight, this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.fieldXOffset -
            this.gameConfigs.playerSizeWithBorder +
            this.borderSize, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.playerSubstitutionX + this.gameConfigs.playerSizeWithBorder, this.gameConfigs.fieldHeight, this.gameConfigs.cpuSubstitutionX -
            this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.playerSizeWithBorder * 2, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.cpuSubstitutionX + this.gameConfigs.playerSizeWithBorder, this.gameConfigs.fieldHeight, this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.fieldXOffset -
            this.gameConfigs.playerSizeWithBorder, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.borderSize, -this.borderSize, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset - this.borderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.rect(-this.borderSize, this.gameConfigs.goalYOffset - this.borderSize, this.gameConfigs.fieldXOffset + this.borderSize, this.borderSize);
        this.backgroundContext.rect(-this.borderSize, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset + this.borderSize, this.borderSize);
        this.backgroundContext.rect(0, this.gameConfigs.goalYOffset - this.borderSize, this.borderSize, this.gameConfigs.goalHeight + this.borderSize * 2);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, -this.borderSize, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.borderSize, this.gameConfigs.goalYOffset + this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset - this.borderSize, this.gameConfigs.fieldXOffset, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset + this.gameConfigs.fieldWidth, this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight, this.gameConfigs.fieldXOffset, this.borderSize);
        this.backgroundContext.rect(this.gameConfigs.fieldXOffset * 2 + this.gameConfigs.fieldWidth - this.borderSize, this.gameConfigs.goalYOffset - this.borderSize, this.borderSize, this.gameConfigs.goalHeight + this.borderSize * 2);
        this.backgroundContext.fill();
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
    // TODO to move to player canvas
    renderWindows() {
        this.backgroundContext.fillStyle = "#FF0000";
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.translate(this.gameConfigs.playerSubstitutionX - this.gameConfigs.playerSizeWithBorder, this.gameConfigs.fieldHeight);
        const angle = 0; // TODO da rivedere
        this.backgroundContext.rotate(angle);
        this.backgroundContext.fillRect(0, 0, this.gameConfigs.playerSizeWithBorder * 2, this.borderSize);
        this.backgroundContext.strokeRect(0, 0, this.gameConfigs.playerSizeWithBorder * 2, this.borderSize);
        this.backgroundContext.rotate(angle);
        this.backgroundContext.translate(this.gameConfigs.cpuSubstitutionX -
            this.gameConfigs.playerSubstitutionX +
            this.gameConfigs.playerSizeWithBorder * 2, -this.borderSize);
        this.backgroundContext.rotate(Math.PI - angle);
        this.backgroundContext.fillRect(0, -this.borderSize * 2, this.gameConfigs.playerSizeWithBorder * 2, this.borderSize);
        this.backgroundContext.strokeRect(0, -this.borderSize * 2, this.gameConfigs.playerSizeWithBorder * 2, this.borderSize);
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
const ScoreRendering_1 = __webpack_require__(/*! ./ScoreRendering */ "./src/rendering/ScoreRendering.ts");
class MainRender {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.fieldRender = new FieldRender_1.FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader);
        this.scoreRendering = new ScoreRendering_1.ScoreRendering(domHandler.scoreContext, gameConfigs, assetLoader);
    }
    render() {
        this.fieldRender.render();
        this.scoreRendering.render();
    }
}
exports.MainRender = MainRender;


/***/ },

/***/ "./src/rendering/ScoreRendering.ts"
/*!*****************************************!*\
  !*** ./src/rendering/ScoreRendering.ts ***!
  \*****************************************/
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreRendering = void 0;
class ScoreRendering {
    //private readonly frameForNumber: number = 6;
    //private readonly totalNumbers: number = 9;
    constructor(scoreContext, gameConfigs, assetLoader) {
        this.innerImageHeight = 90;
        this.scoreContext = scoreContext;
        this.gameConfigs = gameConfigs;
        this.digitsImages = assetLoader.getImage("digits.png");
        this.innerImageWidth = this.digitsImages.width;
        this.scoreHeight = (scoreContext.canvas.height * 9) / 10;
        this.scoreWidth = (this.scoreHeight * this.innerImageWidth) / this.innerImageHeight;
        this.xPositionsArray = [
            0,
            this.scoreWidth,
            scoreContext.canvas.width - this.scoreWidth * 2,
            scoreContext.canvas.width - this.scoreWidth,
        ];
        this.yPosition = (scoreContext.canvas.height - this.scoreHeight) / 2;
    }
    render() {
        this.scoreContext.clearRect(0, 0, this.gameConfigs.width, this.gameConfigs.height);
        // TODO gestire aggiornamento punteggio
        this.xPositionsArray.forEach(x => {
            this.scoreContext.drawImage(this.digitsImages, 0, this.scoreHeight * 0, this.innerImageWidth, this.innerImageHeight, x, this.yPosition, this.scoreWidth, this.scoreHeight);
        });
    }
}
exports.ScoreRendering = ScoreRendering;


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
        this.backgroundCanvas = document.getElementById("backgroundCanvas");
        if (!this.backgroundCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const backgroundContext = this.backgroundCanvas.getContext("2d");
        if (!backgroundContext) {
            throw new Error("backgroundContext not found");
        }
        this.backgroundContext = backgroundContext;
        this.scoreCanvas = document.getElementById("scoreCanvas");
        if (!this.scoreCanvas) {
            throw new Error("backgroundCanvas not found");
        }
        const scoreContext = this.scoreCanvas.getContext("2d");
        if (!scoreContext) {
            throw new Error("backgroundContext not found");
        }
        this.scoreContext = scoreContext;
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
        this.substitutionOffsetX = Math.round(this.fieldWidth / 3);
        this.goalPostRadius = Math.round(this.goalHeight / 20);
        this.athleticTrackHeight = Math.round(((this.height - this.fieldHeight) * 5) / 7);
        this.athleticTrackYOffset = Math.round((this.height - this.fieldHeight - this.athleticTrackHeight) / 2);
        this.playerSizeWithoutBorder = Math.floor(this.fieldHeight / 16);
        this.playerSizeWithBorder = this.playerSizeWithoutBorder + this.playerBorder;
        const substitutionOffsetX = Math.round(this.fieldWidth / 4);
        this.playerSubstitutionX = this.fieldXOffset + substitutionOffsetX;
        this.cpuSubstitutionX = this.fieldXOffset + (this.fieldWidth - substitutionOffsetX);
        this.shadowBlur = this.playerSizeWithoutBorder;
        this.shadowOffset = this.playerSizeWithoutBorder * 0.3;
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
        const gameConfigs = new GameConfigs_1.GameConfigs(domHandler.backgroundCanvas.width, domHandler.backgroundCanvas.height);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUI7Ozs7Ozs7VUMxQm5CO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7QUM1QmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0Qsc0JBQXNCLG1CQUFPLENBQUMseURBQXNCO0FBQ3BELG1CQUFtQixtQkFBTyxDQUFDLCtDQUFpQjtBQUM1QyxxQkFBcUIsbUJBQU8sQ0FBQyxxREFBb0I7QUFDakQsc0JBQXNCLG1CQUFPLENBQUMsdURBQXFCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2Fzc2V0cy9Bc3NldExvYWRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvY29yZS9HYW1lTG9vcC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvTWFpblJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL1Njb3JlUmVuZGVyaW5nLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBnZXRJbWFnZShpbWFnZU5hbWUpIHtcbiAgICAgICAgbGV0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoaW1hZ2VOYW1lICsgXCIgaW1hZ2Ugbm90IGZvdW5kXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9XG4gICAgbG9hZEltYWdlKG5hbWUsIHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChuYW1lLCBpbWcpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gQXNzZXRMb2FkZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUxvb3AgPSB2b2lkIDA7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jbGFzcyBHYW1lTG9vcCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIC8vcHJpdmF0ZSBkZWx0YSA6IG51bWJlciA9IDA7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICB9XG4gICAgbWFpbigpIHtcbiAgICAgICAgY29uc3QgdGljayA9ICh0aW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2VGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIC8vdGhpcy5kZWx0YSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHJldlRpbWUgPSB0aW1lO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgfVxuICAgIHVwZGF0ZSgpIHsgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcigpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUxvb3AgPSBHYW1lTG9vcDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaWVsZFJlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpZWxkUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihiYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLmdvYWxJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZ29hbF9maWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMudHJhY2tGaWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJ0cmFjay5qcGdcIik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLmJvcmRlclNpemUgPSBNYXRoLnJvdW5kKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMTAwKTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJXaW5kb3dzKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbiAgICByZW5kZXJCYWNrZ3JvdW5kKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0JCQkJGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZpZWxkSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCAwLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCk7XG4gICAgfVxuICAgIHJlbmRlckJvcmRlcigpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuYm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyICtcbiAgICAgICAgICAgIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlciAqIDIsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggKyB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlciwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5ib3JkZXJTaXplLCAtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5ib3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQgKyB0aGlzLmJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCAtdGhpcy5ib3JkZXJTaXplLCB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAqIDIgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmJvcmRlclNpemUsIHRoaXMuYm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5ib3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgIH1cbiAgICByZW5kZXJHb2FsUG9zdHMoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQUFBQUFBXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5hcmModGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFBvc3RSYWRpdXMsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja1lPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrSGVpZ2h0KTtcbiAgICB9XG4gICAgLy8gVE9ETyB0byBtb3ZlIHRvIHBsYXllciBjYW52YXNcbiAgICByZW5kZXJXaW5kb3dzKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQudHJhbnNsYXRlKHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IDA7IC8vIFRPRE8gZGEgcml2ZWRlcmVcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yb3RhdGUoYW5nbGUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAyLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVJlY3QoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlciAqIDIsIHRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC50cmFuc2xhdGUodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyICogMiwgLXRoaXMuYm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucm90YXRlKE1hdGguUEkgLSBhbmdsZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFJlY3QoMCwgLXRoaXMuYm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAyLCB0aGlzLmJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVJlY3QoMCwgLXRoaXMuYm9yZGVyU2l6ZSAqIDIsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAyLCB0aGlzLmJvcmRlclNpemUpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmllbGRSZW5kZXIgPSBGaWVsZFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL0ZpZWxkUmVuZGVyXCIpO1xuY29uc3QgU2NvcmVSZW5kZXJpbmdfMSA9IHJlcXVpcmUoXCIuL1Njb3JlUmVuZGVyaW5nXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuZmllbGRSZW5kZXIgPSBuZXcgRmllbGRSZW5kZXJfMS5GaWVsZFJlbmRlcihkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnNjb3JlUmVuZGVyaW5nID0gbmV3IFNjb3JlUmVuZGVyaW5nXzEuU2NvcmVSZW5kZXJpbmcoZG9tSGFuZGxlci5zY29yZUNvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5maWVsZFJlbmRlci5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5zY29yZVJlbmRlcmluZy5yZW5kZXIoKTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlUmVuZGVyaW5nID0gdm9pZCAwO1xuY2xhc3MgU2NvcmVSZW5kZXJpbmcge1xuICAgIC8vcHJpdmF0ZSByZWFkb25seSBmcmFtZUZvck51bWJlcjogbnVtYmVyID0gNjtcbiAgICAvL3ByaXZhdGUgcmVhZG9ubHkgdG90YWxOdW1iZXJzOiBudW1iZXIgPSA5O1xuICAgIGNvbnN0cnVjdG9yKHNjb3JlQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuaW5uZXJJbWFnZUhlaWdodCA9IDkwO1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dCA9IHNjb3JlQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlV2lkdGggPSB0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aDtcbiAgICAgICAgdGhpcy5zY29yZUhlaWdodCA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAqIDkpIC8gMTA7XG4gICAgICAgIHRoaXMuc2NvcmVXaWR0aCA9ICh0aGlzLnNjb3JlSGVpZ2h0ICogdGhpcy5pbm5lckltYWdlV2lkdGgpIC8gdGhpcy5pbm5lckltYWdlSGVpZ2h0O1xuICAgICAgICB0aGlzLnhQb3NpdGlvbnNBcnJheSA9IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB0aGlzLnNjb3JlV2lkdGgsXG4gICAgICAgICAgICBzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZVdpZHRoICogMixcbiAgICAgICAgICAgIHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlV2lkdGgsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMueVBvc2l0aW9uID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0IC0gdGhpcy5zY29yZUhlaWdodCkgLyAyO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmdhbWVDb25maWdzLndpZHRoLCB0aGlzLmdhbWVDb25maWdzLmhlaWdodCk7XG4gICAgICAgIC8vIFRPRE8gZ2VzdGlyZSBhZ2dpb3JuYW1lbnRvIHB1bnRlZ2dpb1xuICAgICAgICB0aGlzLnhQb3NpdGlvbnNBcnJheS5mb3JFYWNoKHggPT4ge1xuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLnNjb3JlSGVpZ2h0ICogMCwgdGhpcy5pbm5lckltYWdlV2lkdGgsIHRoaXMuaW5uZXJJbWFnZUhlaWdodCwgeCwgdGhpcy55UG9zaXRpb24sIHRoaXMuc2NvcmVXaWR0aCwgdGhpcy5zY29yZUhlaWdodCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVSZW5kZXJpbmcgPSBTY29yZVJlbmRlcmluZztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Eb21IYW5kbGVyID0gdm9pZCAwO1xuY2xhc3MgRG9tSGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmFja2dyb3VuZENhbnZhc1wiKTtcbiAgICAgICAgaWYgKCF0aGlzLmJhY2tncm91bmRDYW52YXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJhY2tncm91bmRDYW52YXMgbm90IGZvdW5kXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmRDb250ZXh0ID0gdGhpcy5iYWNrZ3JvdW5kQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKCFiYWNrZ3JvdW5kQ29udGV4dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYmFja2dyb3VuZENvbnRleHQgbm90IGZvdW5kXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQgPSBiYWNrZ3JvdW5kQ29udGV4dDtcbiAgICAgICAgdGhpcy5zY29yZUNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2NvcmVDYW52YXNcIik7XG4gICAgICAgIGlmICghdGhpcy5zY29yZUNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYmFja2dyb3VuZENhbnZhcyBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2NvcmVDb250ZXh0ID0gdGhpcy5zY29yZUNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGlmICghc2NvcmVDb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJiYWNrZ3JvdW5kQ29udGV4dCBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY29yZUNvbnRleHQgPSBzY29yZUNvbnRleHQ7XG4gICAgfVxufVxuZXhwb3J0cy5Eb21IYW5kbGVyID0gRG9tSGFuZGxlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFggPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRXaWR0aCAvIDMpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDE2KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgY29uc3Qgc3Vic3RpdHV0aW9uT2Zmc2V0WCA9IE1hdGgucm91bmQodGhpcy5maWVsZFdpZHRoIC8gNCk7XG4gICAgICAgIHRoaXMucGxheWVyU3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgdGhpcy5jcHVTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyAodGhpcy5maWVsZFdpZHRoIC0gc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICB9XG59XG5leHBvcnRzLkdhbWVDb25maWdzID0gR2FtZUNvbmZpZ3M7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jb25zdCBHYW1lTG9vcF8xID0gcmVxdWlyZShcIi4vY29yZS9HYW1lTG9vcFwiKTtcbmNvbnN0IERvbUhhbmRsZXJfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0RvbUhhbmRsZXJcIik7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBNYWluIHtcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBhc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGF3YWl0IGFzc2V0TG9hZGVyLmluaXQoKTtcbiAgICAgICAgdGhpcy5jbG9zZUxvYWRpbmdXaW5kb3coKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgZ2FtZUxvb3AubWFpbigpO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICB9LCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuc2hvd01haW5NZW51KCk7XG4gICAgfVxuICAgIHNob3dNYWluTWVudSgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWVudUNhbnZhc1wiKTtcbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgIH1cbn1cbmNvbnN0IG1haW4gPSBuZXcgTWFpbigpO1xubWFpbi5pbml0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
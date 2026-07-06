/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/eventemitter2/lib/eventemitter2.js"
/*!*********************************************************!*\
  !*** ./node_modules/eventemitter2/lib/eventemitter2.js ***!
  \*********************************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {
      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      this._maxListeners = conf.maxListeners !== undefined ? conf.maxListeners : defaultMaxListeners;

      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this._newListener = conf.newListener);
      conf.removeListener && (this._removeListener = conf.removeListener);
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    } else {
      this._maxListeners = defaultMaxListeners;
    }
  }

  function logPossibleMemoryLeak(count, eventName) {
    var errorMsg = '(node) warning: possible EventEmitter memory ' +
        'leak detected. ' + count + ' listeners added. ' +
        'Use emitter.setMaxListeners() to increase limit.';

    if(this.verboseMemoryLeak){
      errorMsg += ' Event name: ' + eventName + '.';
    }

    if(typeof process !== 'undefined' && process.emitWarning){
      var e = new Error(errorMsg);
      e.name = 'MaxListenersExceededWarning';
      e.emitter = this;
      e.count = count;
      process.emitWarning(e);
    } else {
      console.error(errorMsg);

      if (console.trace){
        console.trace();
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this._newListener = false;
    this._removeListener = false;
    this.verboseMemoryLeak = false;
    configure.call(this, conf);
  }
  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name !== undefined) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else {
          if (typeof tree._listeners === 'function') {
            tree._listeners = [tree._listeners];
          }

          tree._listeners.push(listener);

          if (
            !tree._listeners.warned &&
            this._maxListeners > 0 &&
            tree._listeners.length > this._maxListeners
          ) {
            tree._listeners.warned = true;
            logPossibleMemoryLeak.call(this, tree._listeners.length, name);
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    if (n !== undefined) {
      this._maxListeners = n;
      if (!this._conf) this._conf = {};
      this._conf.maxListeners = n;
    }
  };

  EventEmitter.prototype.event = '';


  EventEmitter.prototype.once = function(event, fn) {
    return this._once(event, fn, false);
  };

  EventEmitter.prototype.prependOnceListener = function(event, fn) {
    return this._once(event, fn, true);
  };

  EventEmitter.prototype._once = function(event, fn, prepend) {
    this._many(event, 1, fn, prepend);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    return this._many(event, ttl, fn, false);
  }

  EventEmitter.prototype.prependMany = function(event, ttl, fn) {
    return this._many(event, ttl, fn, true);
  }

  EventEmitter.prototype._many = function(event, ttl, fn, prepend) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      return fn.apply(this, arguments);
    }

    listener._origin = fn;

    this._on(event, listener, prepend);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this._newListener) {
      if (!this._events.newListener) {
        return false;
      }
    }

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all && this._all.length) {
      handler = this._all.slice();
      if (al > 3) {
        args = new Array(al);
        for (j = 0; j < al; j++) args[j] = arguments[j];
      }

      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this, type);
          break;
        case 2:
          handler[i].call(this, type, arguments[1]);
          break;
        case 3:
          handler[i].call(this, type, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
      if (typeof handler === 'function') {
        this.event = type;
        switch (al) {
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        default:
          args = new Array(al - 1);
          for (j = 1; j < al; j++) args[j - 1] = arguments[j];
          handler.apply(this, args);
        }
        return true;
      } else if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice();
      }
    }

    if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this);
          break;
        case 2:
          handler[i].call(this, arguments[1]);
          break;
        case 3:
          handler[i].call(this, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
      return true;
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      // removed by dead control flow

    }

    return !!this._all;
  };

  EventEmitter.prototype.emitAsync = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this._newListener) {
        if (!this._events.newListener) { return Promise.resolve([false]); }
    }

    var promises= [];

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all) {
      if (al > 3) {
        args = new Array(al);
        for (j = 1; j < al; j++) args[j] = arguments[j];
      }
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(this._all[i].call(this, type));
          break;
        case 2:
          promises.push(this._all[i].call(this, type, arguments[1]));
          break;
        case 3:
          promises.push(this._all[i].call(this, type, arguments[1], arguments[2]));
          break;
        default:
          promises.push(this._all[i].apply(this, args));
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      switch (al) {
      case 1:
        promises.push(handler.call(this));
        break;
      case 2:
        promises.push(handler.call(this, arguments[1]));
        break;
      case 3:
        promises.push(handler.call(this, arguments[1], arguments[2]));
        break;
      default:
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
        promises.push(handler.apply(this, args));
      }
    } else if (handler && handler.length) {
      handler = handler.slice();
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(handler[i].call(this));
          break;
        case 2:
          promises.push(handler[i].call(this, arguments[1]));
          break;
        case 3:
          promises.push(handler[i].call(this, arguments[1], arguments[2]));
          break;
        default:
          promises.push(handler[i].apply(this, args));
        }
      }
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]); // Unhandled 'error' event
      } else {
        return Promise.reject("Uncaught, unspecified 'error' event.");
      }
    }

    return Promise.all(promises);
  };

  EventEmitter.prototype.on = function(type, listener) {
    return this._on(type, listener, false);
  };

  EventEmitter.prototype.prependListener = function(type, listener) {
    return this._on(type, listener, true);
  };

  EventEmitter.prototype.onAny = function(fn) {
    return this._onAny(fn, false);
  };

  EventEmitter.prototype.prependAny = function(fn) {
    return this._onAny(fn, true);
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype._onAny = function(fn, prepend){
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if (!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    if(prepend){
      this._all.unshift(fn);
    }else{
      this._all.push(fn);
    }

    return this;
  }

  EventEmitter.prototype._on = function(type, listener, prepend) {
    if (typeof type === 'function') {
      this._onAny(type, listener);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    if (this._newListener)
       this.emit('newListener', type, listener);

    if (this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else {
      if (typeof this._events[type] === 'function') {
        // Change to array.
        this._events[type] = [this._events[type]];
      }

      // If we've already got an array, just add
      if(prepend){
        this._events[type].unshift(listener);
      }else{
        this._events[type].push(listener);
      }

      // Check for listener leak
      if (
        !this._events[type].warned &&
        this._maxListeners > 0 &&
        this._events[type].length > this._maxListeners
      ) {
        this._events[type].warned = true;
        logPossibleMemoryLeak.call(this, this._events[type].length, type);
      }
    }

    return this;
  }

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        if (this._removeListener)
          this.emit("removeListener", type, listener);

        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
        if (this._removeListener)
          this.emit("removeListener", type, listener);
      }
    }

    function recursivelyGarbageCollect(root) {
      if (root === undefined) {
        return;
      }
      var keys = Object.keys(root);
      for (var i in keys) {
        var key = keys[i];
        var obj = root[key];
        if ((obj instanceof Function) || (typeof obj !== "object") || (obj === null))
          continue;
        if (Object.keys(obj).length > 0) {
          recursivelyGarbageCollect(root[key]);
        }
        if (Object.keys(obj).length === 0) {
          delete root[key];
        }
      }
    }
    recursivelyGarbageCollect(this.listenerTree);

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          if (this._removeListener)
            this.emit("removeListenerAny", fn);
          return this;
        }
      }
    } else {
      fns = this._all;
      if (this._removeListener) {
        for(i = 0, l = fns.length; i < l; i++)
          this.emit("removeListenerAny", fns[i]);
      }
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (type === undefined) {
      !this._events || init.call(this);
      return this;
    }

    if (this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else if (this._events) {
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.eventNames = function(){
    return Object.keys(this._events);
  }

  EventEmitter.prototype.listenerCount = function(type) {
    return this.listeners(type).length;
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (true) {
     // AMD. Register as an anonymous module.
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
      return EventEmitter;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else // removed by dead control flow
{}
}();


/***/ },

/***/ "./node_modules/ts-bus/EventBus.js"
/*!*****************************************!*\
  !*** ./node_modules/ts-bus/EventBus.js ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// Using EventEmitter2 in order to be able to use wildcards to subscribe to all events
var eventemitter2_1 = __webpack_require__(/*! eventemitter2 */ "./node_modules/eventemitter2/lib/eventemitter2.js");
function showWarning(msg) {
    /* istanbul ignore next */
    if (process && process.env && "development" !== "production") {
        console.warn(msg);
    }
}
function isEventDescriptor(descriptor) {
    return !!descriptor && descriptor.eventType;
}
function isPredicateFn(descriptor) {
    return !isEventDescriptor(descriptor) && typeof descriptor === "function";
}
function createEventDefinition(options) {
    return function (type) {
        function eventCreator(payload) {
            // Allow runtime payload checking for plain JavaScript usage
            if (options && payload) {
                var testFn = typeof options === "function" ? options : options.test;
                /* istanbul ignore next */
                if (testFn && !testFn(payload)) {
                    showWarning(JSON.stringify(payload) + " does not match expected payload.");
                }
            }
            return {
                type: type,
                payload: payload
            };
        }
        eventCreator.eventType = type;
        eventCreator.toString = function () { return type; }; // allow String coercion to deliver the eventType
        return eventCreator;
    };
}
exports.createEventDefinition = createEventDefinition;
function defineEvent(type) {
    showWarning("defineEvent is deprecated and will be removed in the future. Please use createEventDefinition instead.");
    var eventCreator = function (payload) { return ({
        type: type,
        payload: payload
    }); };
    eventCreator.eventType = type;
    return eventCreator;
}
exports.defineEvent = defineEvent;
function getEventType(descriptor) {
    if (isEventDescriptor(descriptor))
        return descriptor.eventType;
    return descriptor;
}
function filter(predicate, handler) {
    return function (event) {
        if (predicate(event))
            return handler(event);
    };
}
var EventBus = /** @class */ (function () {
    function EventBus() {
        this.emitter = new eventemitter2_1.EventEmitter2({ wildcard: true });
    }
    EventBus.prototype.publish = function (event, meta) {
        this.emitter.emit(event.type, !meta ? event : __assign({}, event, { meta: __assign({}, event.meta, meta) }));
    };
    EventBus.prototype.subscribe = function (subscription, handler) {
        // store emitter on closure
        var emitter = this.emitter;
        var subscribeToSubdef = function (subdef) {
            if (isPredicateFn(subdef)) {
                var filteredHandler_1 = filter(subdef, handler);
                emitter.on("**", filteredHandler_1);
                return function () { return emitter.off("**", filteredHandler_1); };
            }
            var type = getEventType(subdef);
            emitter.on(type, handler);
            return function () { return emitter.off(type, handler); };
        };
        var subs = Array.isArray(subscription) ? subscription : [subscription];
        var unsubscribers = subs.map(subscribeToSubdef);
        return function () { return unsubscribers.forEach(function (u) { return u(); }); };
    };
    return EventBus;
}());
exports.EventBus = EventBus;
//# sourceMappingURL=EventBus.js.map

/***/ },

/***/ "./node_modules/ts-bus/index.js"
/*!**************************************!*\
  !*** ./node_modules/ts-bus/index.js ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var EventBus_1 = __webpack_require__(/*! ./EventBus */ "./node_modules/ts-bus/EventBus.js");
exports.EventBus = EventBus_1.EventBus;
exports.defineEvent = EventBus_1.defineEvent;
exports.createEventDefinition = EventBus_1.createEventDefinition;
//# sourceMappingURL=index.js.map

/***/ },

/***/ "./src/assets/AssetLoader.ts"
/*!***********************************!*\
  !*** ./src/assets/AssetLoader.ts ***!
  \***********************************/
(__unused_webpack_module, exports) {

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameLoop = void 0;
const GameStatus_1 = __webpack_require__(/*! ../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const MainSystem_1 = __webpack_require__(/*! ../game/systems/MainSystem */ "./src/game/systems/MainSystem.ts");
const GameWorld_1 = __webpack_require__(/*! ../game/world/GameWorld */ "./src/game/world/GameWorld.ts");
const MouseInputManager_1 = __webpack_require__(/*! ../input/MouseInputManager */ "./src/input/MouseInputManager.ts");
const MainRender_1 = __webpack_require__(/*! ../rendering/MainRender */ "./src/rendering/MainRender.ts");
const UIInteractionSystem_1 = __webpack_require__(/*! ../ui/UIInteractionSystem */ "./src/ui/UIInteractionSystem.ts");
class GameLoop {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.prevTime = 0;
        this.mainRender = new MainRender_1.MainRender(gameConfigs, domHandler, assetLoader);
        this.gameWorld = new GameWorld_1.GameWorld(gameConfigs, assetLoader);
        this.uiInteractionSystem = new UIInteractionSystem_1.UIInteractionSystem(new MouseInputManager_1.MouseInputManager(domHandler.menuCanvas));
        this.mainSystem = new MainSystem_1.MainSystem(gameConfigs);
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
        this.mainSystem.update(this.gameWorld, delta);
        this.gameWorld.fireworks.update(delta);
        this.gameWorld.explosion.update(delta);
        this.gameWorld.score.update(delta);
    }
    updateInputs(delta) {
        this.uiInteractionSystem.update(this.gameWorld.menuButton, () => {
            if (this.gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU) {
                this.gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
                this.gameWorld.fireworks.reset();
                this.uiInteractionSystem.input.reset();
            }
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Ball = void 0;
const BallStatus_1 = __webpack_require__(/*! ../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const PowerShotType_1 = __webpack_require__(/*! ../enums/PowerShotType */ "./src/game/enums/PowerShotType.ts");
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
const PositionHistory_1 = __webpack_require__(/*! ../geometry/PositionHistory */ "./src/game/geometry/PositionHistory.ts");
const BallPowerShot_1 = __webpack_require__(/*! ./powerShots/BallPowerShot */ "./src/game/entities/powerShots/BallPowerShot.ts");
class Ball {
    constructor(gameConfigs) {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
        this.angleWithPlayer = 0;
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.isSetForStart = false;
        this.positionHistory = new PositionHistory_1.PositionHistory(5000);
        this.ballPowerShot = new BallPowerShot_1.BallPowerShot();
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
        if (this.ballPowerShot.isPowerShot) {
            this.positionHistory.addPosition(new Point_1.Point(this.movementPosition.position.x, this.movementPosition.position.y));
        }
        this.movementPosition.updatePosition(deltaMs);
        this.movementPosition.decrementSpeed(deltaMs);
        if (this.movementPosition.getSpeed() < this.maxSpeed / 2) {
            this.ballPowerShot.resetPowerShot();
        }
    }
    updateTrajectory(deltaMs) {
        this.positionHistory.update(deltaMs);
    }
    attachToPlayer(player) {
        this.attachedPlayer = player;
        this.ballStatus = BallStatus_1.BallStatus.ATTACHED;
        this.angleWithPlayer = Point_1.Point.getAngleBetweenPoints(player.movementPosition.position, this.movementPosition.position);
        this.ballPowerShot.resetPowerShot();
    }
    detachFromPlayer() {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        let speedFactor = 1;
        if (this.attachedPlayer?.powerShotWrapper.getPowerShot()) {
            this.ballPowerShot.enablePowerShot(this.attachedPlayer);
            speedFactor = PowerShotType_1.PowerShotUtilities.getSpeedFactor(this.ballPowerShot.getPowerShotType());
        }
        this.attachedPlayer?.powerShotWrapper.resetPowerShot();
        this.attachedPlayer = null;
        this.movementPosition.setSpeed(this.maxSpeed * speedFactor, this.angleWithPlayer);
    }
    resetOnGoal() {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
        this.ballPowerShot.resetPowerShot();
    }
}
exports.Ball = Ball;


/***/ },

/***/ "./src/game/entities/Explosion.ts"
/*!****************************************!*\
  !*** ./src/game/entities/Explosion.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExplosionComponent = exports.Explosion = void 0;
const PowerShotType_1 = __webpack_require__(/*! ../enums/PowerShotType */ "./src/game/enums/PowerShotType.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class Explosion {
    constructor(gameConfigs) {
        this.maxComponents = 40;
        this.minComponents = 20;
        this.maxTime = 1000;
        this.colorOffset = 80;
        this.position = new Point_1.Point(0, 0);
        this.components = [];
        this.maxSize = gameConfigs.fieldHeight / 26;
        this.maxDistance = this.maxSize * 3;
    }
    addExplosion(position, powerShotType) {
        this.position = new Point_1.Point(position.x, position.y);
        const numberOfComponents = Math.round(Math.random() * (this.maxComponents - this.minComponents) + this.minComponents);
        this.components = [];
        for (let i = 0; i < numberOfComponents; i++) {
            const duration = Math.random() * this.maxTime;
            const angle = Math.random() * Math.PI * 2;
            const g = Math.round(Math.random() * this.colorOffset);
            let r, b;
            if (powerShotType === PowerShotType_1.PowerShotType.FIRE) {
                r = 255 - Math.round(Math.random() * this.colorOffset);
                b = Math.round(Math.random() * this.colorOffset);
            }
            else {
                r = Math.round(Math.random() * this.colorOffset);
                b = 255 - Math.round(Math.random() * this.colorOffset);
            }
            const color = "#" +
                r.toString(16).padStart(2, "0") +
                g.toString(16).padStart(2, "0") +
                b.toString(16).padStart(2, "0");
            this.components.push(new ExplosionComponent(duration, angle, color));
        }
    }
    update(delta) {
        this.components.forEach(component => {
            component.update(delta);
        });
        this.components = this.components.filter(component => !component.isFinished());
    }
}
exports.Explosion = Explosion;
class ExplosionComponent {
    constructor(duration, angle, color) {
        this.duration = duration;
        this.angle = angle;
        this.color = color;
        this.delta = 0;
    }
    update(delta) {
        this.delta += delta;
    }
    isFinished() {
        return this.delta >= this.duration;
    }
    getFactor() {
        return this.delta / this.duration;
    }
}
exports.ExplosionComponent = ExplosionComponent;


/***/ },

/***/ "./src/game/entities/Fireworks.ts"
/*!****************************************!*\
  !*** ./src/game/entities/Fireworks.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FireworkComponentDto = exports.FireworkDto = exports.Fireworks = void 0;
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
class Fireworks {
    constructor(gameConfigs) {
        this.colorOffset = 100;
        this.maxComponents = 20;
        this.minComponents = 20;
        this.interval = 100;
        this.numberOfFireworks = Math.round(Fireworks.animationTime / this.interval);
        this.fireworks = [];
        this.gameConfigs = gameConfigs;
        this.maxDistance = gameConfigs.playerSizeWithoutBorder * 7;
        this.minDistance = this.maxDistance / 5;
        this.lineWidth = Math.ceil(gameConfigs.playerSizeWithoutBorder / 12);
    }
    initFireworks() {
        this.fireworks = [];
        for (var i = 0; i < this.numberOfFireworks; i++) {
            const red = this.getRandomColorValue();
            const green = this.getRandomColorValue();
            const blue = this.getRandomColorValue();
            const components_number = Math.random() * (this.maxComponents - this.minComponents) + this.minComponents;
            let components = [];
            for (var j = 0; j < components_number; j++) {
                const r = this.getColorValueWithOffset(red);
                const g = this.getColorValueWithOffset(green);
                const b = this.getColorValueWithOffset(blue);
                const color = "#" +
                    r.toString(16).padStart(2, "0") +
                    g.toString(16).padStart(2, "0") +
                    b.toString(16).padStart(2, "0");
                components.push(new FireworkComponentDto(color, Math.random() * Math.PI * 2, Math.round(Math.random() * (this.maxDistance - this.minDistance) +
                    this.minDistance)));
            }
            this.fireworks.push(new FireworkDto(new Point_1.Point(this.gameConfigs.fieldXOffset + Math.random() * this.gameConfigs.fieldWidth, this.gameConfigs.fieldHeight * Math.random()), -i * this.interval, components));
        }
    }
    update(delta) {
        this.fireworks.forEach(firework => {
            firework.startTime += delta;
        });
    }
    reset() {
        this.fireworks = [];
    }
    getRandomColorValue() {
        return Math.round(Math.random() * 255);
    }
    getColorValueWithOffset(coloValue) {
        return Math.min(Math.max(coloValue +
            Math.round(Math.random() * (this.colorOffset / 2) - this.colorOffset / 2), 0), 255);
    }
}
exports.Fireworks = Fireworks;
Fireworks.animationTime = 5000;
class FireworkDto {
    constructor(position, startTime, components = []) {
        this.position = position;
        this.startTime = startTime;
        this.components = components;
        this.singleDuration = 700;
        this.maxLengthFactor = 0.3;
    }
    isFiring() {
        return this.startTime >= 0 && this.startTime <= this.singleDuration;
    }
    getLenght() {
        const factor = this.startTime >= this.singleDuration / 2
            ? (this.singleDuration - this.startTime) / (this.singleDuration / 2)
            : this.startTime / (this.singleDuration / 2);
        return this.maxLengthFactor * factor;
    }
    getTimeFactor() {
        return this.startTime / this.singleDuration;
    }
}
exports.FireworkDto = FireworkDto;
class FireworkComponentDto {
    constructor(color, angle, distance) {
        this.color = color;
        this.angle = angle;
        this.distance = distance;
    }
}
exports.FireworkComponentDto = FireworkComponentDto;


/***/ },

/***/ "./src/game/entities/Gate.ts"
/*!***********************************!*\
  !*** ./src/game/entities/Gate.ts ***!
  \***********************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gate = void 0;
class Gate {
    constructor() {
        this.angle = 0;
        this.maxAngle = Math.PI / 2;
        this.openTime = 300;
        this.step = this.maxAngle / this.openTime;
    }
    update(delta, isOpen) {
        if (isOpen) {
            this.angle += this.step * delta;
        }
        else {
            this.angle -= this.step * delta;
        }
        this.angle = Math.max(0, Math.min(this.maxAngle, this.angle));
    }
    get currentAngle() {
        return this.angle;
    }
}
exports.Gate = Gate;


/***/ },

/***/ "./src/game/entities/GoalPosts.ts"
/*!****************************************!*\
  !*** ./src/game/entities/GoalPosts.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Player = void 0;
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const PlayerStatus_1 = __webpack_require__(/*! ../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
const BounceWrapper_1 = __webpack_require__(/*! ./bounce/BounceWrapper */ "./src/game/entities/bounce/BounceWrapper.ts");
const PowerShotWrapper_1 = __webpack_require__(/*! ./powerShots/PowerShotWrapper */ "./src/game/entities/powerShots/PowerShotWrapper.ts");
const StunnedWrapper_1 = __webpack_require__(/*! ./stunned/StunnedWrapper */ "./src/game/entities/stunned/StunnedWrapper.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.bounceWrapper = new BounceWrapper_1.BounceWrapper();
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.currentMaxSpeed = 0;
        this.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
        this.stunnedWrapper = new StunnedWrapper_1.StunnedWrapper(this);
        this.normalMaxSpeed = gameConfigs.fieldHeight / 700;
        if (isCpu) {
            this.normalMaxSpeed = this.normalMaxSpeed * 0.8;
        }
        this.reachedDistanceTolerance = gameConfigs.fieldWidth / 100;
        this.movementPosition.acceleration = this.normalMaxSpeed / 300;
        this.closeToPointDistance = gameConfigs.fieldWidth / 10;
        this.movementPosition.size = gameConfigs.playerSizeWithBorder;
        this.isCpu = isCpu;
        this.isSubstitute = isSubstitute;
        this.side = side;
        this.colorIndex = colorIndex;
        this.initPositions(gameConfigs);
        this.powerShotWrapper = new PowerShotWrapper_1.PowerShotWrapper(gameConfigs, side);
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
        const targetPosition = this.destinationPosition.projectToFinalPosition();
        const angle = Point_1.Point.getAngleBetweenPoints(this.movementPosition.position, targetPosition);
        if (Point_1.Point.getDistance(projectedPosition, targetPosition) < this.reachedDistanceTolerance) {
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
    switchColorIndex() {
        this.colorIndex = this.colorIndex === 0 ? 1 : 0;
    }
    updatePowerShot(deltaMs) {
        this.powerShotWrapper.update(deltaMs, this);
    }
    resetOnGoal() {
        this.bounceWrapper.reset();
        this.stunnedWrapper.reset();
        this.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
        this.resetToStartGame();
    }
    startBouncing() {
        if (this.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.bounceWrapper.startBouncing();
        }
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

/***/ "./src/game/entities/bounce/BounceWrapper.ts"
/*!***************************************************!*\
  !*** ./src/game/entities/bounce/BounceWrapper.ts ***!
  \***************************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BounceWrapper = void 0;
class BounceWrapper {
    constructor() {
        this.bouncingDuration = 2000;
        this.bounceMaxAmplitude = 0.5;
        this.bounceExponentialFactor = 0.00346;
        this.bounceNumber = 5;
        this.bouncingTime = this.bouncingDuration;
    }
    startBouncing() {
        if (this.bouncingTime > this.bouncingDuration / 2) {
            this.bouncingTime = 0;
        }
    }
    update(deltaMs) {
        this.bouncingTime += deltaMs;
    }
    getBouncingAmplitude() {
        if (!this.isBouncing()) {
            return 0;
        }
        return (this.bounceMaxAmplitude *
            Math.pow(Math.E, -this.bouncingTime * this.bounceExponentialFactor) *
            Math.sin(this.bouncingTime / (2 * Math.PI * this.bounceNumber)));
    }
    reset() {
        this.bouncingTime = this.bouncingDuration;
    }
    isBouncing() {
        return this.bouncingTime <= this.bouncingDuration;
    }
}
exports.BounceWrapper = BounceWrapper;


/***/ },

/***/ "./src/game/entities/powerShots/BallPowerShot.ts"
/*!*******************************************************!*\
  !*** ./src/game/entities/powerShots/BallPowerShot.ts ***!
  \*******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallPowerShot = void 0;
const PlayerSide_1 = __webpack_require__(/*! ../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const PowerShotType_1 = __webpack_require__(/*! ../../enums/PowerShotType */ "./src/game/enums/PowerShotType.ts");
class BallPowerShot {
    constructor() {
        this.powerShot = false;
        this.powerShotType = null;
        this.powerShotDestionationSide = null;
    }
    get isPowerShot() {
        return this.powerShot;
    }
    getPowerShotType() {
        return this.powerShotType;
    }
    enablePowerShot(player) {
        this.powerShot = true;
        this.powerShotType = PowerShotType_1.PowerShotUtilities.getPowerShotType(player.colorIndex);
        this.powerShotDestionationSide = PlayerSide_1.PlayerSideUtilities.getOppositeSide(player.side);
    }
    resetPowerShot() {
        this.powerShot = false;
        this.powerShotType = null;
        this.powerShotDestionationSide = null;
    }
    shouldStopOnPlayerBounce() {
        if (!this.powerShot || this.powerShotType === null) {
            return true;
        }
        return PowerShotType_1.PowerShotUtilities.shouldStopOnPlayerBounce(this.powerShotType);
    }
    shouldMoveToGoal() {
        if (!this.powerShot || this.powerShotType === null) {
            return false;
        }
        return PowerShotType_1.PowerShotUtilities.shouldMoveToGoal(this.powerShotType);
    }
    getPowerShotDestinationSide() {
        return this.powerShotDestionationSide;
    }
}
exports.BallPowerShot = BallPowerShot;


/***/ },

/***/ "./src/game/entities/powerShots/ElectricPowerShot.ts"
/*!***********************************************************!*\
  !*** ./src/game/entities/powerShots/ElectricPowerShot.ts ***!
  \***********************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ElectricPowerShot = void 0;
const PlayerStatus_1 = __webpack_require__(/*! ../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
const Point_1 = __webpack_require__(/*! ../../geometry/Point */ "./src/game/geometry/Point.ts");
class ElectricPowerShot {
    constructor(gameConfigs) {
        this.interval = 50;
        this.lightningBoltSize = 10;
        this.lastChangeDeltaTime = this.interval;
        this.angleOffset = 0;
        this.lightningBoltPointArray = [];
        this.whiteLineVisible = false;
        this.width = Math.round(Math.floor(gameConfigs.playerSizeWithoutBorder * 2.5));
        this.height = Math.round(this.width / 5);
        this.lineWidth = Math.ceil(this.height / 4);
        this.bigLineWidth = Math.round(this.lineWidth * 3);
    }
    update(deltaMs) {
        this.lastChangeDeltaTime += deltaMs;
        this.whiteLineVisible = true;
        if (this.lastChangeDeltaTime >= this.interval) {
            this.lastChangeDeltaTime = 0;
            this.regenerateLightningBoltPoints();
            this.angleOffset += (Math.PI / 45) * this.interval * 0.05;
            this.whiteLineVisible = false;
        }
    }
    shouldRender(player) {
        return (player.colorIndex === 1 &&
            player.powerShotWrapper.getPowerShot() &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL);
    }
    regenerateLightningBoltPoints() {
        this.lightningBoltPointArray = [];
        for (let i = 0; i < this.lightningBoltSize; i++) {
            this.lightningBoltPointArray.push(new Point_1.Point((this.width / this.lightningBoltSize) * i - this.width / 2, Math.round(Math.random() * this.height) - this.height / 2));
        }
    }
}
exports.ElectricPowerShot = ElectricPowerShot;


/***/ },

/***/ "./src/game/entities/powerShots/FirePowerShot.ts"
/*!*******************************************************!*\
  !*** ./src/game/entities/powerShots/FirePowerShot.ts ***!
  \*******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FlameDto = exports.FirePowerShot = void 0;
const PlayerStatus_1 = __webpack_require__(/*! ../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
const Point_1 = __webpack_require__(/*! ../../geometry/Point */ "./src/game/geometry/Point.ts");
class FirePowerShot {
    constructor(gameConfigs) {
        this.maxIndex = 16;
        this.interval = 1;
        this.lastAddedDeltaTime = this.interval;
        this.flames = [];
        this.maxSize = Math.round(gameConfigs.fieldHeight / 2);
        this.minSize = this.maxSize / 5;
    }
    update(deltaMs, player) {
        this.flames.forEach(flame => {
            flame.update(deltaMs);
            if (flame.isFinished()) {
                this.flames.splice(this.flames.indexOf(flame), 1);
            }
        });
        this.lastAddedDeltaTime += deltaMs;
        if (this.lastAddedDeltaTime >= this.interval &&
            player.powerShotWrapper.getPowerShot() &&
            player.colorIndex === 0 &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.flames.push(new FlameDto(new Point_1.Point(player.movementPosition.position.x, player.movementPosition.position.y), Math.round(Math.random() * this.maxIndex)));
            this.lastAddedDeltaTime = 0;
        }
    }
    shouldRender(_player) {
        return true;
    }
}
exports.FirePowerShot = FirePowerShot;
class FlameDto {
    constructor(position, index) {
        this.position = position;
        this.index = index;
        this.duration = 0;
        this.maxDuration = 1000;
    }
    update(deltaMs) {
        this.duration += deltaMs;
    }
    getDurationFactor() {
        return this.duration / this.maxDuration;
    }
    isFinished() {
        return this.duration >= this.maxDuration;
    }
}
exports.FlameDto = FlameDto;


/***/ },

/***/ "./src/game/entities/powerShots/PowerShotWrapper.ts"
/*!**********************************************************!*\
  !*** ./src/game/entities/powerShots/PowerShotWrapper.ts ***!
  \**********************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PowerShotWrapper = void 0;
const ElectricPowerShot_1 = __webpack_require__(/*! ./ElectricPowerShot */ "./src/game/entities/powerShots/ElectricPowerShot.ts");
const FirePowerShot_1 = __webpack_require__(/*! ./FirePowerShot */ "./src/game/entities/powerShots/FirePowerShot.ts");
class PowerShotWrapper {
    constructor(gameConfigs, side) {
        this.powerShot = false;
        this.consecutiveGoals = 0;
        this.consecutiveGoalsToPowerShot = 2;
        this.powerShots = [];
        this.powerShots.push(new ElectricPowerShot_1.ElectricPowerShot(gameConfigs));
        this.powerShots.push(new FirePowerShot_1.FirePowerShot(gameConfigs));
        this.side = side;
    }
    update(deltaMs, player) {
        this.powerShots.forEach(powerShot => {
            powerShot.update(deltaMs, player);
        });
    }
    get powerShotEntities() {
        return this.powerShots;
    }
    updateScoredGoal(playerSide) {
        if (playerSide === this.side) {
            this.consecutiveGoals++;
            if (this.consecutiveGoals === this.consecutiveGoalsToPowerShot) {
                this.powerShot = true;
                this.consecutiveGoals = 0;
            }
        }
        else {
            this.consecutiveGoals = 0;
        }
    }
    getPowerShot() {
        return this.powerShot;
    }
    resetPowerShot() {
        if (this.powerShot) {
            this.powerShot = false;
            this.consecutiveGoals = 0;
        }
    }
}
exports.PowerShotWrapper = PowerShotWrapper;


/***/ },

/***/ "./src/game/entities/stunned/StunnedStars.ts"
/*!***************************************************!*\
  !*** ./src/game/entities/stunned/StunnedStars.ts ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StarDto = exports.StunnedStars = void 0;
const Point_1 = __webpack_require__(/*! ../../geometry/Point */ "./src/game/geometry/Point.ts");
class StunnedStars {
    constructor() {
        this.deltaBetweenStars = 200;
        this.angleStep = Math.PI / 800;
        this.stars = [];
        this.starDelta = 0;
    }
    update(delta, position) {
        this.starDelta += delta;
        if (this.starDelta >= this.deltaBetweenStars) {
            this.stars.push(new StarDto(new Point_1.Point(position.x, position.y), 0, Math.random() * 2 * Math.PI));
            this.starDelta = 0;
        }
        this.stars.forEach((star, _index) => {
            star.update(delta);
            star.angle += this.angleStep * delta;
            if (star.getFactor() >= 1) {
                this.stars.splice(this.stars.indexOf(star), 1);
            }
        });
    }
}
exports.StunnedStars = StunnedStars;
StunnedStars.duration = 2000;
class StarDto {
    constructor(position, angle, direction) {
        this.position = position;
        this.angle = angle;
        this.direction = direction;
        this.duration = 0;
    }
    update(delta) {
        this.duration += delta;
    }
    getFactor() {
        return this.duration / StunnedStars.duration;
    }
}
exports.StarDto = StarDto;


/***/ },

/***/ "./src/game/entities/stunned/StunnedWrapper.ts"
/*!*****************************************************!*\
  !*** ./src/game/entities/stunned/StunnedWrapper.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StunnedWrapper = void 0;
const PlayerStatus_1 = __webpack_require__(/*! ../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
const StunnedStars_1 = __webpack_require__(/*! ./StunnedStars */ "./src/game/entities/stunned/StunnedStars.ts");
class StunnedWrapper {
    constructor(player) {
        this.stunnedValue = 0;
        this.stunnedTime = 0;
        this.stunnedStars = new StunnedStars_1.StunnedStars();
        this.stunnedMaxValue = 2000;
        this.stunnedStep = 1000;
        this.stunnedDuration = 3000;
        this.player = player;
    }
    updateStunnedValue(otherPlayerSpeed) {
        if (this.player.playerStatus !== PlayerStatus_1.PlayerStatus.STUNNED) {
            const speed = this.player.movementPosition.getSpeed();
            if (speed > otherPlayerSpeed) {
                this.stunnedValue = Math.max(0, this.stunnedValue - this.stunnedStep);
            }
            else if (speed < otherPlayerSpeed) {
                this.stunnedValue += this.stunnedStep;
            }
            if (this.stunnedValue > this.stunnedMaxValue) {
                this.player.playerStatus = PlayerStatus_1.PlayerStatus.STUNNED;
                this.stunnedTime = 0;
            }
        }
    }
    forceStunned() {
        this.player.playerStatus = PlayerStatus_1.PlayerStatus.STUNNED;
        this.stunnedTime = 0;
    }
    decrementStunnedValue(deltaMs) {
        if (this.player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        }
        else if (this.player.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED) {
            this.stunnedTime += deltaMs;
            this.stunnedStars.update(deltaMs, this.player.movementPosition.position);
            if (this.stunnedTime > this.stunnedDuration) {
                this.player.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
                this.stunnedValue = 0;
                this.stunnedStars.stars = [];
            }
        }
    }
    reset() {
        this.stunnedValue = 0;
        this.stunnedStars.stars = [];
    }
}
exports.StunnedWrapper = StunnedWrapper;


/***/ },

/***/ "./src/game/enums/BallStatus.ts"
/*!**************************************!*\
  !*** ./src/game/enums/BallStatus.ts ***!
  \**************************************/
(__unused_webpack_module, exports) {

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameStatus = void 0;
var GameStatus;
(function (GameStatus) {
    GameStatus["MENU"] = "MENU";
    GameStatus["WAITING_BALL"] = "WAITING_BALL";
    GameStatus["PLAYING"] = "PLAYING";
    GameStatus["END_GAME"] = "END_GAME";
    GameStatus["SUBSTITION"] = "SUBSTITION";
})(GameStatus || (exports.GameStatus = GameStatus = {}));


/***/ },

/***/ "./src/game/enums/Keys.ts"
/*!********************************!*\
  !*** ./src/game/enums/Keys.ts ***!
  \********************************/
(__unused_webpack_module, exports) {

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerSideUtilities = exports.PlayerSide = void 0;
var PlayerSide;
(function (PlayerSide) {
    PlayerSide["LEFT"] = "LEFT";
    PlayerSide["RIGHT"] = "RIGHT";
})(PlayerSide || (exports.PlayerSide = PlayerSide = {}));
class PlayerSideUtilities {
    static getOppositeSide(side) {
        return side === PlayerSide.LEFT ? PlayerSide.RIGHT : PlayerSide.LEFT;
    }
}
exports.PlayerSideUtilities = PlayerSideUtilities;


/***/ },

/***/ "./src/game/enums/PlayerStatus.ts"
/*!****************************************!*\
  !*** ./src/game/enums/PlayerStatus.ts ***!
  \****************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerStatus = void 0;
var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus["NORMAL"] = "NORMAL";
    PlayerStatus["STUNNED"] = "STUNNED";
})(PlayerStatus || (exports.PlayerStatus = PlayerStatus = {}));


/***/ },

/***/ "./src/game/enums/PowerShotType.ts"
/*!*****************************************!*\
  !*** ./src/game/enums/PowerShotType.ts ***!
  \*****************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PowerShotUtilities = exports.PowerShotType = void 0;
var PowerShotType;
(function (PowerShotType) {
    PowerShotType["FIRE"] = "FIRE";
    PowerShotType["ELECTRIC"] = "ELECTRIC";
})(PowerShotType || (exports.PowerShotType = PowerShotType = {}));
class PowerShotUtilities {
    static getPowerShotType(colorIndex) {
        switch (colorIndex) {
            case 0:
                return PowerShotType.FIRE;
            case 1:
                return PowerShotType.ELECTRIC;
            default:
                return PowerShotType.FIRE;
        }
    }
    static getSpeedFactor(powerShotType) {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return 2;
            case PowerShotType.ELECTRIC:
                return 1.2;
            default:
                return 1;
        }
    }
    static shouldStopOnPlayerBounce(powerShotType) {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return false;
            case PowerShotType.ELECTRIC:
                return true;
            default:
                return true;
        }
    }
    static shouldMoveToGoal(powerShotType) {
        switch (powerShotType) {
            case PowerShotType.FIRE:
                return false;
            case PowerShotType.ELECTRIC:
                return true;
            default:
                return false;
        }
    }
}
exports.PowerShotUtilities = PowerShotUtilities;


/***/ },

/***/ "./src/game/geometry/BorderLimits.ts"
/*!*******************************************!*\
  !*** ./src/game/geometry/BorderLimits.ts ***!
  \*******************************************/
(__unused_webpack_module, exports) {

"use strict";

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

"use strict";

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

"use strict";

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
    clone() {
        return new MovementPoint(new Point_1.Point(this.position.x, this.position.y), new Point_1.Point(this.velocity.x, this.velocity.y), this.acceleration, this.size);
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

"use strict";

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
    static arePointEquals(point1, point2) {
        return point1.x === point2.x && point1.y === point2.y;
    }
}
exports.Point = Point;


/***/ },

/***/ "./src/game/geometry/PositionHistory.ts"
/*!**********************************************!*\
  !*** ./src/game/geometry/PositionHistory.ts ***!
  \**********************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HistoryPoint = exports.PositionHistory = void 0;
class PositionHistory {
    constructor(retentionTime) {
        this.retentionTime = retentionTime;
        this.positions = [];
    }
    addPosition(position) {
        this.positions.push(new HistoryPoint(position, 0));
    }
    update(deltaMs) {
        this.positions.forEach(p => (p.delta += deltaMs));
        this.positions = this.positions.filter(p => p.delta < this.retentionTime);
    }
    getFactor(index) {
        return this.positions[index].getFactor(this.retentionTime);
    }
}
exports.PositionHistory = PositionHistory;
class HistoryPoint {
    constructor(position, delta) {
        this.position = position;
        this.delta = delta;
    }
    getFactor(retentionTime) {
        return this.delta / retentionTime;
    }
}
exports.HistoryPoint = HistoryPoint;


/***/ },

/***/ "./src/game/managers/GameStatusManager.ts"
/*!************************************************!*\
  !*** ./src/game/managers/GameStatusManager.ts ***!
  \************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameStatusManager = void 0;
const EventBusUtilities_1 = __webpack_require__(/*! ../../utils/EventBusUtilities */ "./src/utils/EventBusUtilities.ts");
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class GameStatusManager {
    constructor(bus) {
        this._gameStatus = GameStatus_1.GameStatus.MENU;
        this.currentStatusTime = 0;
        this.scheduledEvents = [];
        this.time = 0;
        this.bus = bus;
    }
    changeStatus(gameStatus) {
        this._gameStatus = gameStatus;
        this.currentStatusTime = 0;
    }
    get gameStatus() {
        return this._gameStatus;
    }
    isStatusChangedRecently() {
        return this.currentStatusTime < 300;
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
        this.currentStatusTime += delta;
        for (const e of this.scheduledEvents) {
            if (this.time >= e.time) {
                this.changeStatus(e.gameStatus);
                this.bus.publish(EventBusUtilities_1.EventBusUtilities.statusChangedEvent(this.gameStatus));
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreManager = void 0;
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
class ScoreManager {
    constructor() {
        this.leftScore = 0;
        this.rightScore = 0;
        this.lastUpdateDuration = 0;
        this.lastSideUpdated = PlayerSide_1.PlayerSide.LEFT;
        this.maxScore = 10;
        this.substitutionGoals = 3;
    }
    increaseScore(playerSide) {
        if (playerSide === PlayerSide_1.PlayerSide.RIGHT) {
            this.rightScore++;
        }
        else {
            this.leftScore++;
        }
        this.lastUpdateDuration = 0;
        this.lastSideUpdated = playerSide;
    }
    update(delta) {
        this.lastUpdateDuration += delta;
    }
    reset() {
        this.leftScore = 0;
        this.rightScore = 0;
        this.lastUpdateDuration = 0;
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
    getLastUpdateDuration() {
        return this.lastUpdateDuration;
    }
    get isGameOver() {
        return this.leftScore === this.maxScore || this.rightScore === this.maxScore;
    }
    getWinningPlayerSide() {
        if (this.leftScore === this.maxScore) {
            return PlayerSide_1.PlayerSide.LEFT;
        }
        else if (this.rightScore === this.maxScore) {
            return PlayerSide_1.PlayerSide.RIGHT;
        }
        else {
            return null;
        }
    }
    isSubstitutionTime() {
        const totalScore = this.leftScore + this.rightScore;
        return totalScore > 0 && totalScore % this.substitutionGoals === 0;
    }
}
exports.ScoreManager = ScoreManager;


/***/ },

/***/ "./src/game/systems/GateSystem.ts"
/*!****************************************!*\
  !*** ./src/game/systems/GateSystem.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GateSystem = void 0;
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class GateSystem {
    update(gameWorld, deltaMs) {
        gameWorld.gates.update(deltaMs, gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION);
    }
}
exports.GateSystem = GateSystem;


/***/ },

/***/ "./src/game/systems/MainSystem.ts"
/*!****************************************!*\
  !*** ./src/game/systems/MainSystem.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MainSystem = void 0;
const KeyboardInputManager_1 = __webpack_require__(/*! ../../input/KeyboardInputManager */ "./src/input/KeyboardInputManager.ts");
const CheckerSystem_1 = __webpack_require__(/*! ./checkers/CheckerSystem */ "./src/game/systems/checkers/CheckerSystem.ts");
const CollisionSystem_1 = __webpack_require__(/*! ./collision/CollisionSystem */ "./src/game/systems/collision/CollisionSystem.ts");
const GateSystem_1 = __webpack_require__(/*! ./GateSystem */ "./src/game/systems/GateSystem.ts");
const MovementSystem_1 = __webpack_require__(/*! ./movement/MovementSystem */ "./src/game/systems/movement/MovementSystem.ts");
class MainSystem {
    constructor(gameConfigs) {
        this.systems = new Array();
        this.systems.push(new MovementSystem_1.MovementSystem(gameConfigs, new KeyboardInputManager_1.KeyboardInputManager()));
        this.systems.push(new CollisionSystem_1.CollisionSystem(gameConfigs));
        this.systems.push(new GateSystem_1.GateSystem());
        this.systems.push(new CheckerSystem_1.CheckerSystem());
    }
    update(gameWorld, deltaMs) {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }
}
exports.MainSystem = MainSystem;


/***/ },

/***/ "./src/game/systems/checkers/CheckerSystem.ts"
/*!****************************************************!*\
  !*** ./src/game/systems/checkers/CheckerSystem.ts ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CheckerSystem = void 0;
const SubstitutionCheckerStrategy_1 = __webpack_require__(/*! ./strategies/SubstitutionCheckerStrategy */ "./src/game/systems/checkers/strategies/SubstitutionCheckerStrategy.ts");
const WaitingBallCheckerStrategy_1 = __webpack_require__(/*! ./strategies/WaitingBallCheckerStrategy */ "./src/game/systems/checkers/strategies/WaitingBallCheckerStrategy.ts");
class CheckerSystem {
    constructor() {
        this.strategies = [];
        this.strategies.push(new SubstitutionCheckerStrategy_1.SubstitutionCheckerStrategy());
        this.strategies.push(new WaitingBallCheckerStrategy_1.WaitingBallCheckerStrategy());
    }
    update(gameWorld, _deltaMs) {
        this.strategies
            .filter(strategy => strategy.canBeApplied(gameWorld))
            .forEach(strategy => strategy.apply(gameWorld));
    }
}
exports.CheckerSystem = CheckerSystem;


/***/ },

/***/ "./src/game/systems/checkers/strategies/SubstitutionCheckerStrategy.ts"
/*!*****************************************************************************!*\
  !*** ./src/game/systems/checkers/strategies/SubstitutionCheckerStrategy.ts ***!
  \*****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubstitutionCheckerStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class SubstitutionCheckerStrategy {
    canBeApplied(gameWorld) {
        return gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION;
    }
    apply(gameWorld) {
        const areAllPlayersInInitialPosition = gameWorld.players.every(player => {
            return Point_1.Point.arePointEquals(player.movementPosition.position, player.initialPosition);
        });
        if (areAllPlayersInInitialPosition) {
            gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        }
    }
}
exports.SubstitutionCheckerStrategy = SubstitutionCheckerStrategy;


/***/ },

/***/ "./src/game/systems/checkers/strategies/WaitingBallCheckerStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/checkers/strategies/WaitingBallCheckerStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaitingBallCheckerStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class WaitingBallCheckerStrategy {
    canBeApplied(gameWorld) {
        return gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL;
    }
    apply(gameWorld) {
        const areAllPlayersInPosition = gameWorld.players
            .filter(player => !player.isSubstitute)
            .every(player => {
            return player.reachedDestinationPosition();
        });
        const isBallStopped = gameWorld.ball.movementPosition.getSpeed() === 0;
        if (areAllPlayersInPosition && isBallStopped) {
            gameWorld.gameStatusManager.scheduleStatusChange(1500, GameStatus_1.GameStatus.PLAYING);
        }
    }
}
exports.WaitingBallCheckerStrategy = WaitingBallCheckerStrategy;


/***/ },

/***/ "./src/game/systems/collision/CollisionSystem.ts"
/*!*******************************************************!*\
  !*** ./src/game/systems/collision/CollisionSystem.ts ***!
  \*******************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CollisionSystem = void 0;
const BallBorderCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallBorderCollisionStrategy */ "./src/game/systems/collision/strategies/BallBorderCollisionStrategy.ts");
const BallGoalCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallGoalCollisionStrategy */ "./src/game/systems/collision/strategies/BallGoalCollisionStrategy.ts");
const BallGoalStakesCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallGoalStakesCollisionStrategy */ "./src/game/systems/collision/strategies/BallGoalStakesCollisionStrategy.ts");
const BallPlayerCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BallPlayerCollisionStrategy */ "./src/game/systems/collision/strategies/BallPlayerCollisionStrategy.ts");
const BouncingPowerShotCollisionStrategy_1 = __webpack_require__(/*! ./strategies/BouncingPowerShotCollisionStrategy */ "./src/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy.ts");
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
        this.strategies.push(new BouncingPowerShotCollisionStrategy_1.BouncingPowerShotCollisionStrategy(gameConfigs));
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

"use strict";

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
    handleBorderCollision(movementPoint, borderLimits, invertSpeed, avoidBounceOnGoal = true, avoidBounceOnSubstitution = false) {
        const cfg = this.gameConfigs;
        const isInGoalYRange = !avoidBounceOnGoal &&
            movementPoint.position.y >= cfg.goalYOffset &&
            movementPoint.position.y <= cfg.goalYOffset + cfg.goalHeight;
        const isInSubstitutionYRange = avoidBounceOnSubstitution &&
            ((movementPoint.position.x >= cfg.playerSubstitutionX - cfg.gatesLength / 2 &&
                movementPoint.position.x <= cfg.playerSubstitutionX + cfg.gatesLength / 2) ||
                (movementPoint.position.x >= cfg.cpuSubstitutionX - cfg.gatesLength / 2 &&
                    movementPoint.position.x <= cfg.cpuSubstitutionX + cfg.gatesLength / 2));
        let hasCollided = false;
        if (!isInGoalYRange && movementPoint.position.x < borderLimits.left) {
            movementPoint.position.x = borderLimits.left;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.x = Math.abs(movementPoint.velocity.x);
            }
            else {
                movementPoint.velocity.x = Math.max(0, movementPoint.velocity.x);
            }
        }
        if (!isInGoalYRange && movementPoint.position.x > borderLimits.right) {
            movementPoint.position.x = borderLimits.right;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.x = -Math.abs(movementPoint.velocity.x);
            }
            else {
                movementPoint.velocity.x = Math.min(0, movementPoint.velocity.x);
            }
        }
        if (movementPoint.position.y < borderLimits.top) {
            movementPoint.position.y = borderLimits.top;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.y = Math.abs(movementPoint.velocity.y);
            }
            else {
                movementPoint.velocity.y = Math.max(0, movementPoint.velocity.y);
            }
        }
        if (!isInSubstitutionYRange && movementPoint.position.y > borderLimits.bottom) {
            movementPoint.position.y = borderLimits.bottom;
            hasCollided = true;
            if (invertSpeed) {
                movementPoint.velocity.y = -Math.abs(movementPoint.velocity.y);
            }
            else {
                movementPoint.velocity.y = Math.min(0, movementPoint.velocity.y);
            }
        }
        return hasCollided;
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

"use strict";

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
            gameWorld.increaseScore(PlayerSide_1.PlayerSideUtilities.getOppositeSide(playerSide));
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

"use strict";

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
        return ((gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION) &&
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

"use strict";

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

"use strict";

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
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            gameWorld.ball.ballPowerShot.shouldStopOnPlayerBounce());
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

/***/ "./src/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy.ts"
/*!*************************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/BouncingPowerShotCollisionStrategy.ts ***!
  \*************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BouncingPowerShotCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
const AbstractCollisionStrategy_1 = __webpack_require__(/*! ./AbstractCollisionStrategy */ "./src/game/systems/collision/strategies/AbstractCollisionStrategy.ts");
class BouncingPowerShotCollisionStrategy extends AbstractCollisionStrategy_1.AbstractCollisionStrategy {
    constructor(gameConfigs) {
        super(gameConfigs);
    }
    canBeApplied(gameWorld) {
        return (gameWorld.ball.ballStatus === BallStatus_1.BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            !gameWorld.ball.ballPowerShot.shouldStopOnPlayerBounce());
    }
    apply(gameWorld) {
        gameWorld.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
            if (MovementPoint_1.MovementPoint.areTouching(gameWorld.ball.movementPosition, player.movementPosition)) {
                const middlePoint = new Point_1.Point((gameWorld.ball.movementPosition.position.x +
                    player.movementPosition.position.x) /
                    2, (gameWorld.ball.movementPosition.position.y +
                    player.movementPosition.position.y) /
                    2);
                const angle = Point_1.Point.getAngleBetweenPoints(middlePoint, player.movementPosition.position);
                player.movementPosition.setSpeed(gameWorld.ball.movementPosition.getSpeed(), angle);
            }
        });
    }
}
exports.BouncingPowerShotCollisionStrategy = BouncingPowerShotCollisionStrategy;


/***/ },

/***/ "./src/game/systems/collision/strategies/PlayerBorderCollisionStrategy.ts"
/*!********************************************************************************!*\
  !*** ./src/game/systems/collision/strategies/PlayerBorderCollisionStrategy.ts ***!
  \********************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerBorderCollisionStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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
            const avoidBounceOnSubstitution = gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION;
            const hasCollided = this.handleBorderCollision(player.movementPosition, this.getFieldBorderLimits(player.movementPosition.size), false, true, avoidBounceOnSubstitution);
            if (hasCollided) {
                player.startBouncing();
            }
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerCollisionStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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
            if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING) {
                humanPlayer.stunnedWrapper.updateStunnedValue(cpuPlayer.movementPosition.getSpeed());
                cpuPlayer.stunnedWrapper.updateStunnedValue(humanPlayer.movementPosition.getSpeed());
            }
            const intersectionPoint = new Point_1.Point((humanPlayer.movementPosition.position.x + cpuPlayer.movementPosition.position.x) /
                2, (humanPlayer.movementPosition.position.y + cpuPlayer.movementPosition.position.y) /
                2);
            humanPlayer.startBouncing();
            cpuPlayer.startBouncing();
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovementSystem = void 0;
const AttachedWithKeyPressedBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/AttachedWithKeyPressedBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts");
const AttachedWithoutKeyPressedBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/AttachedWithoutKeyPressedBallMovementStrategy.ts");
const MoveToGoalPowerShotMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/MoveToGoalPowerShotMovementStrategy */ "./src/game/systems/movement/ballStrategies/MoveToGoalPowerShotMovementStrategy.ts");
const PlayingFreeBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/PlayingFreeBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts");
const WaitingBallBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/WaitingBallBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/WaitingBallBallMovementStrategy.ts");
const InputPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/InputPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/InputPlayerMovementStrategy.ts");
const MenuMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/MenuMovementStrategy */ "./src/game/systems/movement/playersStrategies/MenuMovementStrategy.ts");
const StunnedPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/StunnedPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/StunnedPlayerMovementStrategy.ts");
const SubstitutePlayersMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/SubstitutePlayersMovementStrategy */ "./src/game/systems/movement/playersStrategies/SubstitutePlayersMovementStrategy.ts");
const WaitingBallMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/WaitingBallMovementStrategy */ "./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts");
const WinningPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/WinningPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/WinningPlayerMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs, keyboardInputManager) {
        this.playerStrategies = [];
        this.ballStrategies = [];
        this.playerStrategies.push(new MenuMovementStrategy_1.MenuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallMovementStrategy_1.WaitingBallMovementStrategy());
        this.playerStrategies.push(new InputPlayerMovementStrategy_1.InputPlayerMovementStrategy(keyboardInputManager));
        //this.playerStrategies.push(new CpuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new StunnedPlayerMovementStrategy_1.StunnedPlayerMovementStrategy());
        this.playerStrategies.push(new WinningPlayerMovementStrategy_1.WinningPlayerMovementStrategy(gameConfigs));
        this.playerStrategies.push(new SubstitutePlayersMovementStrategy_1.SubstitutePlayersMovementStrategy(gameConfigs));
        this.ballStrategies.push(new WaitingBallBallMovementStrategy_1.WaitingBallBallMovementStrategy());
        this.ballStrategies.push(new PlayingFreeBallMovementStrategy_1.PlayingFreeBallMovementStrategy());
        this.ballStrategies.push(new AttachedWithoutKeyPressedBallMovementStrategy_1.AttachedWithoutKeyPressedBallMovementStrategy(keyboardInputManager));
        this.ballStrategies.push(new AttachedWithKeyPressedBallMovementStrategy_1.AttachedWithKeyPressedBallMovementStrategy(keyboardInputManager));
        this.ballStrategies.push(new MoveToGoalPowerShotMovementStrategy_1.MoveToGoalPowerShotMovementStrategy(gameConfigs));
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
            player.stunnedWrapper.decrementStunnedValue(deltaMs);
            player.updatePowerShot(deltaMs);
            player.bounceWrapper.update(deltaMs);
            player.move(deltaMs);
        });
    }
    updateBall(gameWorld, deltaMs) {
        this.ballStrategies
            .filter(strategy => strategy.canBeApplied(gameWorld.ball, gameWorld))
            .forEach(strategy => strategy.apply(gameWorld.ball, gameWorld, deltaMs));
        gameWorld.ball.updateTrajectory(deltaMs);
    }
}
exports.MovementSystem = MovementSystem;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts"
/*!************************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/AttachedWithKeyPressedBallMovementStrategy.ts ***!
  \************************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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
                const step = (speed / player.normalMaxSpeed) * 0.01 * deltaMs;
                ball.angleWithPlayer += angleDifference > 0 ? step : -step;
            }
            else {
                ball.angleWithPlayer = targetAngle;
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

/***/ "./src/game/systems/movement/ballStrategies/MoveToGoalPowerShotMovementStrategy.ts"
/*!*****************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/MoveToGoalPowerShotMovementStrategy.ts ***!
  \*****************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MoveToGoalPowerShotMovementStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const PowerShotType_1 = __webpack_require__(/*! ../../../enums/PowerShotType */ "./src/game/enums/PowerShotType.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class MoveToGoalPowerShotMovementStrategy {
    constructor(gameConfigs) {
        this.ballRotateOffset = 250;
        this.gameConfigs = gameConfigs;
        this.minGoalDistance = gameConfigs.fieldHeight / 50;
    }
    canBeApplied(ball, gameWorld) {
        return (ball.ballStatus === BallStatus_1.BallStatus.FREE &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            ball.ballPowerShot.shouldMoveToGoal());
    }
    apply(ball, _gameWorld, deltaMs) {
        const distance = this.getDirectionDistance(ball, ball.movementPosition.getSpeedAngle());
        if (distance > this.minGoalDistance) {
            const distance1 = this.getDirectionDistance(ball, ball.movementPosition.getSpeedAngle() + Math.PI / this.ballRotateOffset);
            const distance2 = this.getDirectionDistance(ball, ball.movementPosition.getSpeedAngle() - Math.PI / this.ballRotateOffset);
            ball.movementPosition.setSpeed(ball.maxSpeed *
                PowerShotType_1.PowerShotUtilities.getSpeedFactor(ball.ballPowerShot.getPowerShotType()), distance1 < distance2
                ? ball.movementPosition.getSpeedAngle() +
                    (Math.PI / this.ballRotateOffset) * deltaMs
                : ball.movementPosition.getSpeedAngle() -
                    (Math.PI / this.ballRotateOffset) * deltaMs);
        }
    }
    getDirectionDistance(ball, ballSpeedAngle) {
        const destinationX = this.gameConfigs.fieldXOffset +
            (ball.ballPowerShot.getPowerShotDestinationSide() === PlayerSide_1.PlayerSide.LEFT
                ? 0
                : this.gameConfigs.fieldWidth);
        const destinationY = this.gameConfigs.fieldHeight / 2;
        let dist = Point_1.Point.getDistance(ball.movementPosition.position, new Point_1.Point(destinationX, destinationY));
        const newX = ball.movementPosition.position.x + Math.cos(ballSpeedAngle) * dist;
        const newY = ball.movementPosition.position.y + Math.sin(ballSpeedAngle) * dist;
        return Point_1.Point.getDistance(new Point_1.Point(newX, newY), new Point_1.Point(destinationX, destinationY));
    }
}
exports.MoveToGoalPowerShotMovementStrategy = MoveToGoalPowerShotMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts"
/*!*************************************************************************************!*\
  !*** ./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts ***!
  \*************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaitingBallBallMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class WaitingBallBallMovementStrategy {
    canBeApplied(_ball, gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION);
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InputPlayerMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const Keys_1 = __webpack_require__(/*! ../../../enums/Keys */ "./src/game/enums/Keys.ts");
const PlayerStatus_1 = __webpack_require__(/*! ../../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
class InputPlayerMovementStrategy {
    constructor(keyboardInputManager) {
        this.keyboardInputManager = keyboardInputManager;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            !player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL);
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
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
            let x = this.gameConfigs.fieldXOffset +
                ((Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth) / 2;
            if (player.side === PlayerSide_1.PlayerSide.RIGHT) {
                x += this.gameConfigs.fieldWidth / 2;
            }
            const y = (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(x, y), new Point_1.Point(0, 0), 0, 0);
            player.currentMaxSpeed =
                (player.normalMaxSpeed / 5) * Math.random() + player.normalMaxSpeed / 7;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}
exports.MenuMovementStrategy = MenuMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/StunnedPlayerMovementStrategy.ts"
/*!**************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/StunnedPlayerMovementStrategy.ts ***!
  \**************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StunnedPlayerMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerStatus_1 = __webpack_require__(/*! ../../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
class StunnedPlayerMovementStrategy {
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            (this.isPlayerStunnedDuringPlay(player, gameWorld) ||
                this.hasPlayerLosedGame(player, gameWorld)));
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME) {
            player.stunnedWrapper.forceStunned();
        }
        if (player.movementPosition.getSpeed() > player.currentMaxSpeed / 5) {
            player.movementPosition.decrementSpeed(deltaMs);
        }
        else {
            const speed = player.currentMaxSpeed / 15;
            let angle = player.movementPosition.getSpeedAngle();
            angle = angle + (Math.PI / 30) * deltaMs * 0.05;
            player.movementPosition.setSpeed(speed, angle);
        }
    }
    isPlayerStunnedDuringPlay(player, gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED);
    }
    hasPlayerLosedGame(player, gameWorld) {
        const winningPlayerSide = gameWorld.score.getWinningPlayerSide();
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME &&
            winningPlayerSide !== null &&
            winningPlayerSide !== player.side);
    }
}
exports.StunnedPlayerMovementStrategy = StunnedPlayerMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/SubstitutePlayersMovementStrategy.ts"
/*!******************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/SubstitutePlayersMovementStrategy.ts ***!
  \******************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubstitutePlayersMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../../../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class SubstitutePlayersMovementStrategy {
    constructor(gameConfigs) {
        this.playerDestinationPointMap = new Map();
        this.gameConfigs = gameConfigs;
        this.subPositionsMap = new Map();
        this.subPositionsMap.set(PlayerSide_1.PlayerSide.LEFT, this.getSubstitutionDestinations(PlayerSide_1.PlayerSide.LEFT));
        this.subPositionsMap.set(PlayerSide_1.PlayerSide.RIGHT, this.getSubstitutionDestinations(PlayerSide_1.PlayerSide.RIGHT));
    }
    canBeApplied(player, gameWorld) {
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION && !player.isSubstitute);
    }
    apply(player, gameWorld, deltaMs) {
        if (gameWorld.gameStatusManager.isStatusChangedRecently()) {
            this.playerDestinationPointMap.clear();
        }
        const destinationList = this.subPositionsMap.get(player.side);
        if (destinationList === undefined || destinationList.length === 0) {
            return;
        }
        let destinationPoint = this.playerDestinationPointMap.get(player);
        if (destinationPoint === undefined) {
            destinationPoint = destinationList[0];
            this.playerDestinationPointMap.set(player, destinationPoint);
        }
        player.currentMaxSpeed = (player.normalMaxSpeed * 2) / 3;
        player.destinationPosition = new MovementPoint_1.MovementPoint(destinationPoint.point, new Point_1.Point(0, 0), 0, 0);
        player.adjustSpeedToDestinationPoint(deltaMs);
        if (player.reachedDestinationPosition()) {
            destinationPoint.action(player, gameWorld);
            const index = destinationList.findIndex(destinationPoint => {
                return Point_1.Point.arePointEquals(destinationPoint.point, player.destinationPosition.position);
            });
            if (index < 0) {
            }
            else if (index < destinationList.length - 1) {
                this.playerDestinationPointMap.set(player, destinationList[index + 1]);
            }
            else if (index >= destinationList.length - 1) {
                this.playerDestinationPointMap.set(player, new PointWithAction(player.initialPosition, () => { }));
            }
        }
    }
    getSubstitutionDestinations(playerSide) {
        const x = this.gameConfigs.fieldXOffset +
            (playerSide === PlayerSide_1.PlayerSide.LEFT
                ? this.gameConfigs.substitutionOffsetX
                : this.gameConfigs.fieldWidth - this.gameConfigs.substitutionOffsetX);
        return [
            new PointWithAction(new Point_1.Point(x, this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder / 2), () => { }),
            new PointWithAction(new Point_1.Point(x, this.gameConfigs.substituteStartPositionYOffset), (player, gameWorld) => {
                gameWorld.switchPlayerColor(player.side);
            }),
            new PointWithAction(new Point_1.Point(x, this.gameConfigs.fieldHeight - this.gameConfigs.playerSizeWithBorder), () => { }),
        ];
    }
}
exports.SubstitutePlayersMovementStrategy = SubstitutePlayersMovementStrategy;
class PointWithAction {
    constructor(point, action) {
        this.point = point;
        this.action = action;
    }
}


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts"
/*!************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts ***!
  \************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
    }
}
exports.WaitingBallMovementStrategy = WaitingBallMovementStrategy;


/***/ },

/***/ "./src/game/systems/movement/playersStrategies/WinningPlayerMovementStrategy.ts"
/*!**************************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/WinningPlayerMovementStrategy.ts ***!
  \**************************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WinningPlayerMovementStrategy = void 0;
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class WinningPlayerMovementStrategy {
    constructor(gameConfigs) {
        this.gameConfigs = gameConfigs;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME &&
            gameWorld.score.getWinningPlayerSide() === player.side);
    }
    apply(player, _gameWorld, deltaMs) {
        if (player.reachedDestinationPosition()) {
            const x = this.gameConfigs.fieldXOffset +
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth;
            const y = (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(x, y), new Point_1.Point(0, 0), 0, 0);
            player.currentMaxSpeed =
                player.normalMaxSpeed * 2 * Math.random() + player.normalMaxSpeed;
        }
        player.adjustSpeedToDestinationPoint(deltaMs);
    }
}
exports.WinningPlayerMovementStrategy = WinningPlayerMovementStrategy;


/***/ },

/***/ "./src/game/world/GameWorld.ts"
/*!*************************************!*\
  !*** ./src/game/world/GameWorld.ts ***!
  \*************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameWorld = void 0;
const ts_bus_1 = __webpack_require__(/*! ts-bus */ "./node_modules/ts-bus/index.js");
const EventBusUtilities_1 = __webpack_require__(/*! ../../utils/EventBusUtilities */ "./src/utils/EventBusUtilities.ts");
const Ball_1 = __webpack_require__(/*! ../entities/Ball */ "./src/game/entities/Ball.ts");
const Explosion_1 = __webpack_require__(/*! ../entities/Explosion */ "./src/game/entities/Explosion.ts");
const Fireworks_1 = __webpack_require__(/*! ../entities/Fireworks */ "./src/game/entities/Fireworks.ts");
const Gate_1 = __webpack_require__(/*! ../entities/Gate */ "./src/game/entities/Gate.ts");
const GoalPosts_1 = __webpack_require__(/*! ../entities/GoalPosts */ "./src/game/entities/GoalPosts.ts");
const MenuButton_1 = __webpack_require__(/*! ../entities/MenuButton */ "./src/game/entities/MenuButton.ts");
const Player_1 = __webpack_require__(/*! ../entities/Player */ "./src/game/entities/Player.ts");
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PowerShotType_1 = __webpack_require__(/*! ../enums/PowerShotType */ "./src/game/enums/PowerShotType.ts");
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
        this.fireworks = new Fireworks_1.Fireworks(gameConfigs);
        this.explosion = new Explosion_1.Explosion(gameConfigs);
        this.gates = new Gate_1.Gate();
        const bus = new ts_bus_1.EventBus();
        this.score = new ScoreManager_1.ScoreManager();
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton_1.MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager_1.GameStatusManager(bus);
        bus.subscribe(EventBusUtilities_1.EventBusUtilities.statusChangedEvent, event => {
            if (event.payload === GameStatus_1.GameStatus.MENU) {
                this.resetEndGame();
            }
        });
    }
    increaseScore(playerSide) {
        this.score.increaseScore(playerSide);
        if (this.score.isSubstitutionTime()) {
            this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.SUBSTITION);
        }
        else {
            this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        }
        this.players
            .filter(player => !player.isSubstitute)
            .forEach(player => {
            player.resetOnGoal();
            player.powerShotWrapper.updateScoredGoal(playerSide);
        });
        if (this.ball.ballPowerShot.isPowerShot) {
            this.explosion.addExplosion(this.ball.movementPosition.position, this.ball.ballPowerShot.getPowerShotType() ?? PowerShotType_1.PowerShotType.FIRE);
        }
        this.ball.resetOnGoal();
        if (this.score.isGameOver) {
            this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.END_GAME);
            this.fireworks.initFireworks();
            this.gameStatusManager.scheduleStatusChange(Fireworks_1.Fireworks.animationTime, GameStatus_1.GameStatus.MENU);
            this.players.forEach(player => {
                player.powerShotWrapper.resetPowerShot();
            });
        }
    }
    switchPlayerColor(playerSide) {
        this.players
            .filter(player => {
            return player.side === playerSide;
        })
            .forEach(player => player.switchColorIndex());
    }
    resetEndGame() {
        this.players.forEach(player => player.resetOnGoal());
        this.ball.resetOnGoal();
        this.score.reset();
    }
}
exports.GameWorld = GameWorld;


/***/ },

/***/ "./src/input/KeyboardInputManager.ts"
/*!*******************************************!*\
  !*** ./src/input/KeyboardInputManager.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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

"use strict";

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
            this.reset();
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MainRender = void 0;
const BallRender_1 = __webpack_require__(/*! ./impl/BallRender */ "./src/rendering/impl/BallRender.ts");
const BallTrajectoryRender_1 = __webpack_require__(/*! ./impl/BallTrajectoryRender */ "./src/rendering/impl/BallTrajectoryRender.ts");
const ExplosionRender_1 = __webpack_require__(/*! ./impl/ExplosionRender */ "./src/rendering/impl/ExplosionRender.ts");
const FieldRender_1 = __webpack_require__(/*! ./impl/FieldRender */ "./src/rendering/impl/FieldRender.ts");
const FireworksRender_1 = __webpack_require__(/*! ./impl/FireworksRender */ "./src/rendering/impl/FireworksRender.ts");
const GatesRender_1 = __webpack_require__(/*! ./impl/GatesRender */ "./src/rendering/impl/GatesRender.ts");
const MenuRender_1 = __webpack_require__(/*! ./impl/MenuRender */ "./src/rendering/impl/MenuRender.ts");
const PlayerPowerShotRender_1 = __webpack_require__(/*! ./impl/PlayerPowerShotRender */ "./src/rendering/impl/PlayerPowerShotRender.ts");
const PlayerRender_1 = __webpack_require__(/*! ./impl/PlayerRender */ "./src/rendering/impl/PlayerRender.ts");
const ScoreRender_1 = __webpack_require__(/*! ./impl/ScoreRender */ "./src/rendering/impl/ScoreRender.ts");
class MainRender {
    constructor(gameConfigs, domHandler, assetLoader) {
        this.renders = new Array();
        this.domHandler = domHandler;
        this.renders.push(new FieldRender_1.FieldRender(domHandler.backgroundContext, gameConfigs, assetLoader));
        this.renders.push(new BallTrajectoryRender_1.BallTrajectoryRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new ScoreRender_1.ScoreRender(domHandler.scoreContext, assetLoader));
        this.renders.push(new GatesRender_1.GatesRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new PlayerRender_1.PlayerRender(domHandler.gameContext, gameConfigs, assetLoader));
        this.renders.push(new BallRender_1.BallRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new ExplosionRender_1.ExplosionRender(domHandler.gameContext));
        this.renders.push(new MenuRender_1.MenuRender(domHandler.menuContext, assetLoader));
        this.renders.push(new PlayerPowerShotRender_1.PlayerPowerShotRender(domHandler.gameContext, assetLoader, gameConfigs));
        this.renders.push(new FireworksRender_1.FireworksRender(domHandler.gameContext));
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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallRender = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../game/enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../game/enums/GameStatus */ "./src/game/enums/GameStatus.ts");
class BallRender {
    constructor(gameContext, gameConfigs) {
        this.maxResizeFactor = 2;
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        const ball = gameWorld.ball;
        this.gameContext.save();
        if (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING ||
            ((gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL ||
                gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME ||
                gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITION) &&
                ball.movementPosition.getSpeed() > 0)) {
            this.gameContext.translate(ball.movementPosition.position.x, ball.movementPosition.position.y);
            this.gameContext.rotate(ball.movementPosition.getSpeedAngle());
            let resizeFactor = 1;
            if (ball.ballStatus !== BallStatus_1.BallStatus.ATTACHED) {
                resizeFactor =
                    (ball.movementPosition.getSpeed() / ball.maxSpeed) *
                        (this.maxResizeFactor - 1) +
                        1;
            }
            this.gameContext.scale(resizeFactor, 1);
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

/***/ "./src/rendering/impl/BallTrajectoryRender.ts"
/*!****************************************************!*\
  !*** ./src/rendering/impl/BallTrajectoryRender.ts ***!
  \****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BallTrajectoryRender = void 0;
const Point_1 = __webpack_require__(/*! ../../game/geometry/Point */ "./src/game/geometry/Point.ts");
class BallTrajectoryRender {
    constructor(gameContext, gameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
        this.trajectoryMaxDistance = gameConfigs.fieldHeight / 3;
    }
    render(gameWorld) {
        const ball = gameWorld.ball;
        this.gameContext.save();
        this.gameContext.fillStyle = "#111111";
        this.gameContext.strokeStyle = "#111111";
        ball.positionHistory.positions.forEach((position, index) => {
            if (index < ball.positionHistory.positions.length - 1) {
                const nextPosition = ball.positionHistory.positions[index + 1];
                if (Point_1.Point.getDistance(position.position, nextPosition.position) <
                    this.trajectoryMaxDistance) {
                    this.gameContext.globalAlpha = 1 - ball.positionHistory.getFactor(index);
                    this.gameContext.lineWidth = this.gameConfigs.ballSizeWithBorder;
                    this.gameContext.beginPath();
                    this.gameContext.moveTo(position.position.x, position.position.y);
                    this.gameContext.lineTo(nextPosition.position.x, nextPosition.position.y);
                    this.gameContext.stroke();
                    this.gameContext.closePath();
                }
            }
        });
        this.gameContext.restore();
    }
}
exports.BallTrajectoryRender = BallTrajectoryRender;


/***/ },

/***/ "./src/rendering/impl/ExplosionRender.ts"
/*!***********************************************!*\
  !*** ./src/rendering/impl/ExplosionRender.ts ***!
  \***********************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExplosionRender = void 0;
class ExplosionRender {
    constructor(gameContext) {
        this.gameContext = gameContext;
    }
    render(gameWorld) {
        const explosion = gameWorld.explosion;
        explosion.components.forEach(component => {
            const x = explosion.position.x +
                Math.cos(component.angle) * component.getFactor() * explosion.maxDistance;
            const y = explosion.position.y +
                Math.sin(component.angle) * component.getFactor() * explosion.maxDistance;
            const size = (1 - component.getFactor()) * explosion.maxSize;
            this.gameContext.save();
            this.gameContext.beginPath();
            this.gameContext.arc(x, y, size, 0, 2 * Math.PI, false);
            this.gameContext.fillStyle = component.color;
            this.gameContext.fill();
            this.gameContext.closePath();
            this.gameContext.restore();
        });
    }
}
exports.ExplosionRender = ExplosionRender;


/***/ },

/***/ "./src/rendering/impl/FieldRender.ts"
/*!*******************************************!*\
  !*** ./src/rendering/impl/FieldRender.ts ***!
  \*******************************************/
(__unused_webpack_module, exports) {

"use strict";

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

/***/ "./src/rendering/impl/FireworksRender.ts"
/*!***********************************************!*\
  !*** ./src/rendering/impl/FireworksRender.ts ***!
  \***********************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FireworksRender = void 0;
class FireworksRender {
    constructor(gameContext) {
        this.gameContext = gameContext;
    }
    render(gameWorld) {
        gameWorld.fireworks.fireworks.forEach(firework => {
            if (firework.isFiring()) {
                this.renderFirework(firework, gameWorld.fireworks.lineWidth);
            }
        });
    }
    renderFirework(firework, lineWidth) {
        firework.components.forEach(component => {
            const lenght = firework.getLenght();
            const timeFactor = firework.getTimeFactor();
            const x1 = firework.position.x +
                Math.cos(component["angle"]) *
                    (timeFactor * component["distance"] - component["distance"] * lenght);
            const y1 = firework.position.y +
                Math.sin(component["angle"]) *
                    (timeFactor * component["distance"] - component["distance"] * lenght);
            const x2 = firework.position.x +
                Math.cos(component["angle"]) *
                    (timeFactor * component["distance"] + component["distance"] * lenght);
            const y2 = firework.position.y +
                Math.sin(component["angle"]) *
                    (timeFactor * component["distance"] + component["distance"] * lenght);
            this.gameContext.save();
            this.gameContext.beginPath();
            this.gameContext.lineWidth = lineWidth;
            this.gameContext.strokeStyle = component["color"];
            this.gameContext.moveTo(Math.round(x1), Math.round(y1));
            this.gameContext.lineTo(Math.round(x2), Math.round(y2));
            this.gameContext.stroke();
            this.gameContext.closePath();
            this.gameContext.restore();
        });
    }
}
exports.FireworksRender = FireworksRender;


/***/ },

/***/ "./src/rendering/impl/GatesRender.ts"
/*!*******************************************!*\
  !*** ./src/rendering/impl/GatesRender.ts ***!
  \*******************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GatesRender = void 0;
class GatesRender {
    constructor(gameContext, gameConfigs) {
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
    }
    render(gameWorld) {
        const angle = gameWorld.gates.currentAngle;
        this.renderSingleGate(angle, this.gameConfigs.playerSubstitutionX -
            this.gameConfigs.gatesLength / 2 +
            this.gameConfigs.fieldBorderSize / 2);
        this.renderSingleGate(Math.PI - angle, this.gameConfigs.cpuSubstitutionX +
            this.gameConfigs.gatesLength / 2 -
            this.gameConfigs.fieldBorderSize / 2);
    }
    renderSingleGate(angle, x) {
        this.gameContext.save();
        this.gameContext.fillStyle = "#FF0000";
        this.gameContext.lineWidth = 1;
        this.gameContext.translate(x, this.gameConfigs.fieldHeight + this.gameConfigs.fieldBorderSize / 2);
        this.gameContext.rotate(angle);
        this.gameContext.rect(-this.gameConfigs.fieldBorderSize / 2, -this.gameConfigs.fieldBorderSize / 2, this.gameConfigs.gatesLength, this.gameConfigs.fieldBorderSize);
        this.gameContext.fill();
        this.gameContext.stroke();
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

"use strict";

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

/***/ "./src/rendering/impl/PlayerPowerShotRender.ts"
/*!*****************************************************!*\
  !*** ./src/rendering/impl/PlayerPowerShotRender.ts ***!
  \*****************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerPowerShotRender = void 0;
const ElectricPowerShot_1 = __webpack_require__(/*! ../../game/entities/powerShots/ElectricPowerShot */ "./src/game/entities/powerShots/ElectricPowerShot.ts");
const FirePowerShot_1 = __webpack_require__(/*! ../../game/entities/powerShots/FirePowerShot */ "./src/game/entities/powerShots/FirePowerShot.ts");
class PlayerPowerShotRender {
    constructor(gameContext, assetLoader, gameConfigs) {
        this.cellsPerRow = 4;
        this.cellsPerColumn = 4;
        this.lightningBoltNumber = 3;
        this.gameConfigs = gameConfigs;
        this.gameContext = gameContext;
        this.flameImage = assetLoader.getImage("RedParticle.png");
        this.cellWidth = this.flameImage.width / this.cellsPerRow;
        this.cellHeight = this.flameImage.height / this.cellsPerColumn;
    }
    render(gameWorld) {
        gameWorld.players.forEach(player => {
            const powerShotEntities = player.powerShotWrapper.powerShotEntities;
            powerShotEntities.forEach(powerShotEntity => {
                if (powerShotEntity.shouldRender(player)) {
                    if (powerShotEntity instanceof FirePowerShot_1.FirePowerShot) {
                        this.renderFirePowerShot(powerShotEntity);
                    }
                    else if (powerShotEntity instanceof ElectricPowerShot_1.ElectricPowerShot) {
                        this.renderElectricPowerShot(player, powerShotEntity);
                    }
                }
            });
        });
    }
    renderFirePowerShot(firePowerShot) {
        firePowerShot.flames.forEach(flame => {
            const size = flame.getDurationFactor() * (firePowerShot.maxSize - firePowerShot.minSize) +
                firePowerShot.minSize;
            const alpha = 1 - flame.getDurationFactor();
            const rowIndex = Math.floor(flame.index / this.cellsPerRow);
            const columnIndex = flame.index % this.cellsPerRow;
            this.gameContext.save();
            this.gameContext.globalAlpha = alpha;
            this.gameContext.drawImage(this.flameImage, this.cellWidth * rowIndex, this.cellHeight * columnIndex, this.cellWidth, this.cellHeight, Math.round(flame.position.x - size / 2), Math.round(flame.position.y - size / 2), Math.round(size), Math.round(size));
            this.gameContext.restore();
        });
    }
    renderElectricPowerShot(player, electricPowerShot) {
        const position = player.movementPosition.position;
        this.gameContext.save();
        const gradient = this.gameContext.createRadialGradient(position.x, position.y, this.gameConfigs.playerSizeWithBorder / 5, position.x, position.y, this.gameConfigs.playerSizeWithBorder);
        gradient.addColorStop(0, "#FFFFFF");
        gradient.addColorStop(1, "transparent");
        this.gameContext.beginPath();
        this.gameContext.arc(position.x, position.y, this.gameConfigs.playerSizeWithBorder, 0, 2 * Math.PI, false);
        this.gameContext.closePath();
        this.gameContext.fillStyle = gradient;
        this.gameContext.fill();
        this.gameContext.restore();
        this.gameContext.save();
        this.gameContext.translate(position.x, position.y);
        this.gameContext.rotate(electricPowerShot.angleOffset);
        for (let i = 0; i < this.lightningBoltNumber; i++) {
            this.gameContext.rotate(Math.PI / this.lightningBoltNumber);
            this.gameContext.globalAlpha = 0.5;
            for (let j = 0; j < electricPowerShot.lightningBoltSize - 1; j++) {
                const point = electricPowerShot.lightningBoltPointArray[j];
                const nextPoint = electricPowerShot.lightningBoltPointArray[j + 1];
                this.gameContext.beginPath();
                this.gameContext.fillStyle = "#000000";
                this.gameContext.strokeStyle = "#000000";
                this.gameContext.lineWidth = electricPowerShot.bigLineWidth;
                this.gameContext.moveTo(point.x, point.y);
                this.gameContext.lineTo(nextPoint.x, nextPoint.y);
                this.gameContext.stroke();
                this.gameContext.closePath();
                if (electricPowerShot.whiteLineVisible) {
                    this.gameContext.globalAlpha = 1;
                    this.gameContext.beginPath();
                    this.gameContext.fillStyle = "#FFFFFF";
                    this.gameContext.strokeStyle = "#FFFFFF";
                    this.gameContext.lineWidth = electricPowerShot.lineWidth;
                    this.gameContext.moveTo(point.x, point.y);
                    this.gameContext.lineTo(nextPoint.x, nextPoint.y);
                    this.gameContext.stroke();
                    this.gameContext.closePath();
                }
            }
        }
        this.gameContext.restore();
    }
}
exports.PlayerPowerShotRender = PlayerPowerShotRender;


/***/ },

/***/ "./src/rendering/impl/PlayerRender.ts"
/*!********************************************!*\
  !*** ./src/rendering/impl/PlayerRender.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerRender = void 0;
const PlayerStatus_1 = __webpack_require__(/*! ../../game/enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
class PlayerRender {
    constructor(gameContext, gameConfigs, assetLoader) {
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
        this.starImage = assetLoader.getImage("star.png");
        this.starMaxSize = this.gameConfigs.playerSizeWithoutBorder;
        this.startMaxDistance = this.starMaxSize * 5;
    }
    render(gameWorld) {
        gameWorld.players.forEach(player => {
            this.gameContext.save();
            const colorKey = `${player.side}-${player.colorIndex}`;
            const isStunned = player.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED;
            let color = isStunned ? this.stunnedColor : this.colorMap.get(colorKey);
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
            const scale = player.bounceWrapper.getBouncingAmplitude();
            this.gameContext.scale(1 - scale, 1 + scale);
            this.gameContext.beginPath();
            this.gameContext.arc(0, 0, player.movementPosition.size, 0, 2 * Math.PI, false);
            this.gameContext.closePath();
            this.gameContext.fill();
            this.gameContext.stroke();
            this.gameContext.restore();
            if (isStunned) {
                this.renderStunnedStars(player);
            }
        });
    }
    renderStunnedStars(player) {
        player.stunnedWrapper.stunnedStars.stars.forEach(star => {
            this.gameContext.save();
            const factor = star.getFactor();
            const x = star.position.x + Math.cos(star.direction) * (factor * this.startMaxDistance);
            const y = star.position.y + Math.sin(star.direction) * (factor * this.startMaxDistance);
            this.gameContext.translate(x, y);
            this.gameContext.rotate(star.angle);
            this.gameContext.globalAlpha = 1 - factor;
            this.gameContext.drawImage(this.starImage, -this.starMaxSize / 2, -this.starMaxSize / 2, this.starMaxSize, this.starMaxSize);
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

"use strict";

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
        this.scoreFrames = [0, 0, 0, 0];
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
            const targetFrame = number * this.frameForNumber;
            let frameToDraw = targetFrame;
            if (this.scoreFrames[index] !== targetFrame) {
                let step = Math.floor(gameWorld.score.getLastUpdateDuration() / this.frameTime);
                if (this.scoreFrames[index] > targetFrame) {
                    step *= 2;
                    frameToDraw = Math.max(targetFrame, this.scoreFrames[index] - step);
                }
                else {
                    frameToDraw = Math.min(targetFrame, this.scoreFrames[index] + step);
                }
                if (frameToDraw === targetFrame) {
                    this.scoreFrames[index] = targetFrame;
                }
            }
            this.scoreContext.drawImage(this.digitsImages, 0, this.innerImageDimensions.height * frameToDraw, this.innerImageDimensions.width, this.innerImageDimensions.height, this.positionArray[index].x, this.positionArray[index].y, this.scoreDimensions.width, this.scoreDimensions.height);
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

"use strict";

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

"use strict";

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

/***/ "./src/utils/EventBusUtilities.ts"
/*!****************************************!*\
  !*** ./src/utils/EventBusUtilities.ts ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventBusUtilities = void 0;
const ts_bus_1 = __webpack_require__(/*! ts-bus */ "./node_modules/ts-bus/index.js");
class EventBusUtilities {
}
exports.EventBusUtilities = EventBusUtilities;
EventBusUtilities.statusChangedEvent = (0, ts_bus_1.createEventDefinition)()("statusChanged");


/***/ },

/***/ "./src/utils/GameConfigs.ts"
/*!**********************************!*\
  !*** ./src/utils/GameConfigs.ts ***!
  \**********************************/
(__unused_webpack_module, exports) {

"use strict";

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
        this.playerSizeWithoutBorder = Math.floor(this.fieldHeight / 28);
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
        this.gatesLength = this.playerSizeWithBorder * 3.5;
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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QzVCO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsNkNBQTZDO0FBQzdDLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBO0FBQ0Esc0JBQXNCLG9CQUFvQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUNuQjs7Ozs7OztVQ25DQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7OztBQzVCYTtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxzQkFBc0IsbUJBQU8sQ0FBQyx5REFBc0I7QUFDcEQsbUJBQW1CLG1CQUFPLENBQUMsK0NBQWlCO0FBQzVDLHFCQUFxQixtQkFBTyxDQUFDLCtDQUFpQjtBQUM5QyxzQkFBc0IsbUJBQU8sQ0FBQyx1REFBcUI7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsSUFBSSxZQUFZO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vbm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjIvbGliL2V2ZW50ZW1pdHRlcjIuanMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vbm9kZV9tb2R1bGVzL3RzLWJ1cy9FdmVudEJ1cy5qcyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9ub2RlX21vZHVsZXMvdHMtYnVzL2luZGV4LmpzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9hc3NldHMvQXNzZXRMb2FkZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2NvcmUvR2FtZUxvb3AudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvQmFsbC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9FeHBsb3Npb24udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvRmlyZXdvcmtzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0dhdGUudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR29hbFBvc3RzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0hvdmVyYWJsZUVudGl0eS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9NZW51QnV0dG9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL1BsYXllci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9ib3VuY2UvQm91bmNlV3JhcHBlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0JhbGxQb3dlclNob3QudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9FbGVjdHJpY1Bvd2VyU2hvdC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0ZpcmVQb3dlclNob3QudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9Qb3dlclNob3RXcmFwcGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3N0dW5uZWQvU3R1bm5lZFN0YXJzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3N0dW5uZWQvU3R1bm5lZFdyYXBwZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvQmFsbFN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9HYW1lU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0tleXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUGxheWVyU2lkZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9QbGF5ZXJTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUG93ZXJTaG90VHlwZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Cb3JkZXJMaW1pdHMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvRGltZW5zaW9ucy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L1BvaW50LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L1Bvc2l0aW9uSGlzdG9yeS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9tYW5hZ2Vycy9HYW1lU3RhdHVzTWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9tYW5hZ2Vycy9TY29yZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9HYXRlU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvTWFpblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NoZWNrZXJzL0NoZWNrZXJTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jaGVja2Vycy9zdHJhdGVnaWVzL1N1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NoZWNrZXJzL3N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vQ29sbGlzaW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL1BsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9Nb3ZlbWVudFN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL01vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL1dhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL1N0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvd29ybGQvR2FtZVdvcmxkLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvTW91c2VJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9CYWxsUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9CYWxsVHJhamVjdG9yeVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvRXhwbG9zaW9uUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9GaWVsZFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvRmlyZXdvcmtzUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9HYXRlc1JlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvUGxheWVyUG93ZXJTaG90UmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9QbGF5ZXJSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL1Njb3JlUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9VSUludGVyYWN0aW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9FdmVudEJ1c1V0aWxpdGllcy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvR2FtZUNvbmZpZ3MudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxyXG4gKiBFdmVudEVtaXR0ZXIyXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWoxbngvRXZlbnRFbWl0dGVyMlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgaGlqMW54XHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuICovXHJcbjshZnVuY3Rpb24odW5kZWZpbmVkKSB7XHJcblxyXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBfaXNBcnJheShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xyXG4gIH07XHJcbiAgdmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcclxuXHJcbiAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgaWYgKHRoaXMuX2NvbmYpIHtcclxuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb25maWd1cmUoY29uZikge1xyXG4gICAgaWYgKGNvbmYpIHtcclxuICAgICAgdGhpcy5fY29uZiA9IGNvbmY7XHJcblxyXG4gICAgICBjb25mLmRlbGltaXRlciAmJiAodGhpcy5kZWxpbWl0ZXIgPSBjb25mLmRlbGltaXRlcik7XHJcbiAgICAgIHRoaXMuX21heExpc3RlbmVycyA9IGNvbmYubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQgPyBjb25mLm1heExpc3RlbmVycyA6IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XHJcblxyXG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XHJcbiAgICAgIGNvbmYubmV3TGlzdGVuZXIgJiYgKHRoaXMuX25ld0xpc3RlbmVyID0gY29uZi5uZXdMaXN0ZW5lcik7XHJcbiAgICAgIGNvbmYucmVtb3ZlTGlzdGVuZXIgJiYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyID0gY29uZi5yZW1vdmVMaXN0ZW5lcik7XHJcbiAgICAgIGNvbmYudmVyYm9zZU1lbW9yeUxlYWsgJiYgKHRoaXMudmVyYm9zZU1lbW9yeUxlYWsgPSBjb25mLnZlcmJvc2VNZW1vcnlMZWFrKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lclRyZWUgPSB7fTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID0gZGVmYXVsdE1heExpc3RlbmVycztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhayhjb3VudCwgZXZlbnROYW1lKSB7XHJcbiAgICB2YXIgZXJyb3JNc2cgPSAnKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXHJcbiAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICcgKyBjb3VudCArICcgbGlzdGVuZXJzIGFkZGVkLiAnICtcclxuICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJztcclxuXHJcbiAgICBpZih0aGlzLnZlcmJvc2VNZW1vcnlMZWFrKXtcclxuICAgICAgZXJyb3JNc2cgKz0gJyBFdmVudCBuYW1lOiAnICsgZXZlbnROYW1lICsgJy4nO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLmVtaXRXYXJuaW5nKXtcclxuICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoZXJyb3JNc2cpO1xyXG4gICAgICBlLm5hbWUgPSAnTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nJztcclxuICAgICAgZS5lbWl0dGVyID0gdGhpcztcclxuICAgICAgZS5jb3VudCA9IGNvdW50O1xyXG4gICAgICBwcm9jZXNzLmVtaXRXYXJuaW5nKGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvck1zZyk7XHJcblxyXG4gICAgICBpZiAoY29uc29sZS50cmFjZSl7XHJcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoY29uZikge1xyXG4gICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICB0aGlzLl9uZXdMaXN0ZW5lciA9IGZhbHNlO1xyXG4gICAgdGhpcy5fcmVtb3ZlTGlzdGVuZXIgPSBmYWxzZTtcclxuICAgIHRoaXMudmVyYm9zZU1lbW9yeUxlYWsgPSBmYWxzZTtcclxuICAgIGNvbmZpZ3VyZS5jYWxsKHRoaXMsIGNvbmYpO1xyXG4gIH1cclxuICBFdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjsgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZm9yIGV4cG9ydGluZyBFdmVudEVtaXR0ZXIgcHJvcGVydHlcclxuXHJcbiAgLy9cclxuICAvLyBBdHRlbnRpb24sIGZ1bmN0aW9uIHJldHVybiB0eXBlIG5vdyBpcyBhcnJheSwgYWx3YXlzICFcclxuICAvLyBJdCBoYXMgemVybyBlbGVtZW50cyBpZiBubyBhbnkgbWF0Y2hlcyBmb3VuZCBhbmQgb25lIG9yIG1vcmVcclxuICAvLyBlbGVtZW50cyAobGVhZnMpIGlmIHRoZXJlIGFyZSBtYXRjaGVzXHJcbiAgLy9cclxuICBmdW5jdGlvbiBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIGkpIHtcclxuICAgIGlmICghdHJlZSkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgICB2YXIgbGlzdGVuZXJzPVtdLCBsZWFmLCBsZW4sIGJyYW5jaCwgeFRyZWUsIHh4VHJlZSwgaXNvbGF0ZWRCcmFuY2gsIGVuZFJlYWNoZWQsXHJcbiAgICAgICAgdHlwZUxlbmd0aCA9IHR5cGUubGVuZ3RoLCBjdXJyZW50VHlwZSA9IHR5cGVbaV0sIG5leHRUeXBlID0gdHlwZVtpKzFdO1xyXG4gICAgaWYgKGkgPT09IHR5cGVMZW5ndGggJiYgdHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50KHMpIGxpc3QgYW5kIHRoZSB0cmVlIGhhcyBsaXN0ZW5lcnNcclxuICAgICAgLy8gaW52b2tlIHRob3NlIGxpc3RlbmVycy5cclxuICAgICAgLy9cclxuICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVycyk7XHJcbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGxlYWYgPSAwLCBsZW4gPSB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoOyBsZWFmIDwgbGVuOyBsZWFmKyspIHtcclxuICAgICAgICAgIGhhbmRsZXJzICYmIGhhbmRsZXJzLnB1c2godHJlZS5fbGlzdGVuZXJzW2xlYWZdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICgoY3VycmVudFR5cGUgPT09ICcqJyB8fCBjdXJyZW50VHlwZSA9PT0gJyoqJykgfHwgdHJlZVtjdXJyZW50VHlwZV0pIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgdGhlIGV2ZW50IGVtaXR0ZWQgaXMgJyonIGF0IHRoaXMgcGFydFxyXG4gICAgICAvLyBvciB0aGVyZSBpcyBhIGNvbmNyZXRlIG1hdGNoIGF0IHRoaXMgcGF0Y2hcclxuICAgICAgLy9cclxuICAgICAgaWYgKGN1cnJlbnRUeXBlID09PSAnKicpIHtcclxuICAgICAgICBmb3IgKGJyYW5jaCBpbiB0cmVlKSB7XHJcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gICAgICB9IGVsc2UgaWYoY3VycmVudFR5cGUgPT09ICcqKicpIHtcclxuICAgICAgICBlbmRSZWFjaGVkID0gKGkrMSA9PT0gdHlwZUxlbmd0aCB8fCAoaSsyID09PSB0eXBlTGVuZ3RoICYmIG5leHRUeXBlID09PSAnKicpKTtcclxuICAgICAgICBpZihlbmRSZWFjaGVkICYmIHRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgLy8gVGhlIG5leHQgZWxlbWVudCBoYXMgYSBfbGlzdGVuZXJzLCBhZGQgaXQgdG8gdGhlIGhhbmRsZXJzLlxyXG4gICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIHR5cGVMZW5ndGgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcclxuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcclxuICAgICAgICAgICAgaWYoYnJhbmNoID09PSAnKicgfHwgYnJhbmNoID09PSAnKionKSB7XHJcbiAgICAgICAgICAgICAgaWYodHJlZVticmFuY2hdLl9saXN0ZW5lcnMgJiYgIWVuZFJlYWNoZWQpIHtcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIHR5cGVMZW5ndGgpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMikpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIE5vIG1hdGNoIG9uIHRoaXMgb25lLCBzaGlmdCBpbnRvIHRoZSB0cmVlIGJ1dCBub3QgaW4gdGhlIHR5cGUgYXJyYXkuXHJcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2N1cnJlbnRUeXBlXSwgaSsxKSk7XHJcbiAgICB9XHJcblxyXG4gICAgeFRyZWUgPSB0cmVlWycqJ107XHJcbiAgICBpZiAoeFRyZWUpIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHRyZWUgd2lsbCBhbGxvdyBhbnkgbWF0Y2ggZm9yIHRoaXMgcGFydCxcclxuICAgICAgLy8gdGhlbiByZWN1cnNpdmVseSBleHBsb3JlIGFsbCBicmFuY2hlcyBvZiB0aGUgdHJlZVxyXG4gICAgICAvL1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHhUcmVlLCBpKzEpO1xyXG4gICAgfVxyXG5cclxuICAgIHh4VHJlZSA9IHRyZWVbJyoqJ107XHJcbiAgICBpZih4eFRyZWUpIHtcclxuICAgICAgaWYoaSA8IHR5cGVMZW5ndGgpIHtcclxuICAgICAgICBpZih4eFRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGxpc3RlbmVyIG9uIGEgJyoqJywgaXQgd2lsbCBjYXRjaCBhbGwsIHNvIGFkZCBpdHMgaGFuZGxlci5cclxuICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEJ1aWxkIGFycmF5cyBvZiBtYXRjaGluZyBuZXh0IGJyYW5jaGVzIGFuZCBvdGhlcnMuXHJcbiAgICAgICAgZm9yKGJyYW5jaCBpbiB4eFRyZWUpIHtcclxuICAgICAgICAgIGlmKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHh4VHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcclxuICAgICAgICAgICAgICAvLyBXZSBrbm93IHRoZSBuZXh0IGVsZW1lbnQgd2lsbCBtYXRjaCwgc28ganVtcCB0d2ljZS5cclxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVticmFuY2hdLCBpKzIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBjdXJyZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgbm9kZSBtYXRjaGVzLCBtb3ZlIGludG8gdGhlIHRyZWUuXHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaCA9IHt9O1xyXG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoW2JyYW5jaF0gPSB4eFRyZWVbYnJhbmNoXTtcclxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHsgJyoqJzogaXNvbGF0ZWRCcmFuY2ggfSwgaSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgYW5kIHN0aWxsIG9uIGEgJyoqJ1xyXG4gICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgfSBlbHNlIGlmKHh4VHJlZVsnKiddICYmIHh4VHJlZVsnKiddLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVsnKiddLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBncm93TGlzdGVuZXJUcmVlKHR5cGUsIGxpc3RlbmVyKSB7XHJcblxyXG4gICAgdHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBMb29rcyBmb3IgdHdvIGNvbnNlY3V0aXZlICcqKicsIGlmIHNvLCBkb24ndCBhZGQgdGhlIGV2ZW50IGF0IGFsbC5cclxuICAgIC8vXHJcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0eXBlLmxlbmd0aDsgaSsxIDwgbGVuOyBpKyspIHtcclxuICAgICAgaWYodHlwZVtpXSA9PT0gJyoqJyAmJiB0eXBlW2krMV0gPT09ICcqKicpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHJlZSA9IHRoaXMubGlzdGVuZXJUcmVlO1xyXG4gICAgdmFyIG5hbWUgPSB0eXBlLnNoaWZ0KCk7XHJcblxyXG4gICAgd2hpbGUgKG5hbWUgIT09IHVuZGVmaW5lZCkge1xyXG5cclxuICAgICAgaWYgKCF0cmVlW25hbWVdKSB7XHJcbiAgICAgICAgdHJlZVtuYW1lXSA9IHt9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0cmVlID0gdHJlZVtuYW1lXTtcclxuXHJcbiAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICBpZiAoIXRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gbGlzdGVuZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gW3RyZWUuX2xpc3RlbmVyc107XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG5cclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgIXRyZWUuX2xpc3RlbmVycy53YXJuZWQgJiZcclxuICAgICAgICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID4gMCAmJlxyXG4gICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoID4gdGhpcy5fbWF4TGlzdGVuZXJzXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhay5jYWxsKHRoaXMsIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgsIG5hbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXHJcbiAgLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXHJcbiAgLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXHJcbiAgLy9cclxuICAvLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3NcclxuICAvLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5kZWxpbWl0ZXIgPSAnLic7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xyXG4gICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xyXG4gICAgICBpZiAoIXRoaXMuX2NvbmYpIHRoaXMuX2NvbmYgPSB7fTtcclxuICAgICAgdGhpcy5fY29uZi5tYXhMaXN0ZW5lcnMgPSBuO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnQgPSAnJztcclxuXHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uY2UoZXZlbnQsIGZuLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kT25jZUxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25jZShldmVudCwgZm4sIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX29uY2UgPSBmdW5jdGlvbihldmVudCwgZm4sIHByZXBlbmQpIHtcclxuICAgIHRoaXMuX21hbnkoZXZlbnQsIDEsIGZuLCBwcmVwZW5kKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWFueShldmVudCwgdHRsLCBmbiwgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWFueShldmVudCwgdHRsLCBmbiwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYW55ID0gZnVuY3Rpb24oZXZlbnQsIHR0bCwgZm4sIHByZXBlbmQpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XHJcbiAgICAgIGlmICgtLXR0bCA9PT0gMCkge1xyXG4gICAgICAgIHNlbGYub2ZmKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXIuX29yaWdpbiA9IGZuO1xyXG5cclxuICAgIHRoaXMuX29uKGV2ZW50LCBsaXN0ZW5lciwgcHJlcGVuZCk7XHJcblxyXG4gICAgcmV0dXJuIHNlbGY7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5fbmV3TGlzdGVuZXIpIHtcclxuICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgYWwgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgdmFyIGFyZ3MsbCxpLGo7XHJcbiAgICB2YXIgaGFuZGxlcjtcclxuXHJcbiAgICBpZiAodGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGgpIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2FsbC5zbGljZSgpO1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCk7XHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGFsOyBqKyspIGFyZ3Nbal0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBoYW5kbGVyID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgLy8gbmVlZCB0byBtYWtlIGNvcHkgb2YgaGFuZGxlcnMgYmVjYXVzZSBsaXN0IGNhbiBjaGFuZ2UgaW4gdGhlIG1pZGRsZVxyXG4gICAgICAgIC8vIG9mIGVtaXQgY2FsbFxyXG4gICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLmxlbmd0aCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5fYWxsICYmIHR5cGUgPT09ICdlcnJvcicpIHtcclxuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICEhdGhpcy5fYWxsO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdEFzeW5jID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5fbmV3TGlzdGVuZXIpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtmYWxzZV0pOyB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByb21pc2VzPSBbXTtcclxuXHJcbiAgICB2YXIgYWwgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgdmFyIGFyZ3MsbCxpLGo7XHJcbiAgICB2YXIgaGFuZGxlcjtcclxuXHJcbiAgICBpZiAodGhpcy5fYWxsKSB7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5fYWxsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uYXBwbHkodGhpcywgYXJncykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXIsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICBjYXNlIDE6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcykpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDI6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgMzpcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChoYW5kbGVyICYmIGhhbmRsZXIubGVuZ3RoKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKCk7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2FsbCAmJiB0eXBlID09PSAnZXJyb3InKSB7XHJcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChhcmd1bWVudHNbMV0pOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb24odHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb24odHlwZSwgbGlzdGVuZXIsIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25BbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uQW55KGZuLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kQW55ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbkFueShmbiwgdHJ1ZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX29uQW55ID0gZnVuY3Rpb24oZm4sIHByZXBlbmQpe1xyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX2FsbCkge1xyXG4gICAgICB0aGlzLl9hbGwgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxyXG4gICAgaWYocHJlcGVuZCl7XHJcbiAgICAgIHRoaXMuX2FsbC51bnNoaWZ0KGZuKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLl9hbGwucHVzaChmbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyLCBwcmVwZW5kKSB7XHJcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5fb25BbnkodHlwZSwgbGlzdGVuZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignb24gb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxyXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cclxuICAgIGlmICh0aGlzLl9uZXdMaXN0ZW5lcilcclxuICAgICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgZ3Jvd0xpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcclxuICAgICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgLy8gQ2hhbmdlIHRvIGFycmF5LlxyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhZGRcclxuICAgICAgaWYocHJlcGVuZCl7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnVuc2hpZnQobGlzdGVuZXIpO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXHJcbiAgICAgIGlmIChcclxuICAgICAgICAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCAmJlxyXG4gICAgICAgIHRoaXMuX21heExpc3RlbmVycyA+IDAgJiZcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gdGhpcy5fbWF4TGlzdGVuZXJzXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhay5jYWxsKHRoaXMsIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgsIHR5cGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaGFuZGxlcnMsbGVhZnM9W107XHJcblxyXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxyXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICBsZWFmcy5wdXNoKHtfbGlzdGVuZXJzOmhhbmRsZXJzfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XHJcbiAgICAgIHZhciBsZWFmID0gbGVhZnNbaUxlYWZdO1xyXG4gICAgICBoYW5kbGVycyA9IGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XHJcblxyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IC0xO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gaGFuZGxlcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmIChoYW5kbGVyc1tpXSA9PT0gbGlzdGVuZXIgfHxcclxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLmxpc3RlbmVyICYmIGhhbmRsZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcclxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLl9vcmlnaW4gJiYgaGFuZGxlcnNbaV0uX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocG9zaXRpb24gPCAwKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICAgIGxlYWYuX2xpc3RlbmVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5zcGxpY2UocG9zaXRpb24sIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcilcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIHR5cGUsIGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaGFuZGxlcnMgPT09IGxpc3RlbmVyIHx8XHJcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcclxuICAgICAgICAoaGFuZGxlcnMuX29yaWdpbiAmJiBoYW5kbGVycy5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcclxuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcilcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3Qocm9vdCkge1xyXG4gICAgICBpZiAocm9vdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocm9vdCk7XHJcbiAgICAgIGZvciAodmFyIGkgaW4ga2V5cykge1xyXG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgIHZhciBvYmogPSByb290W2tleV07XHJcbiAgICAgICAgaWYgKChvYmogaW5zdGFuY2VvZiBGdW5jdGlvbikgfHwgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIpIHx8IChvYmogPT09IG51bGwpKVxyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdChyb290W2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGRlbGV0ZSByb290W2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHRoaXMubGlzdGVuZXJUcmVlKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZkFueSA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICB2YXIgaSA9IDAsIGwgPSAwLCBmbnM7XHJcbiAgICBpZiAoZm4gJiYgdGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcclxuICAgICAgZm9yKGkgPSAwLCBsID0gZm5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmKGZuID09PSBmbnNbaV0pIHtcclxuICAgICAgICAgIGZucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyQW55XCIsIGZuKTtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm5zID0gdGhpcy5fYWxsO1xyXG4gICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpIHtcclxuICAgICAgICBmb3IoaSA9IDAsIGwgPSBmbnMubGVuZ3RoOyBpIDwgbDsgaSsrKVxyXG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJBbnlcIiwgZm5zW2ldKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLl9hbGwgPSBbXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZjtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZiAodHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICF0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgdmFyIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuXHJcbiAgICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xyXG4gICAgICAgIHZhciBsZWFmID0gbGVhZnNbaUxlYWZdO1xyXG4gICAgICAgIGxlYWYuX2xpc3RlbmVycyA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50cykge1xyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgaGFuZGxlcnMgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXJzLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgICByZXR1cm4gaGFuZGxlcnM7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XHJcbiAgICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9ldmVudHMpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzKHR5cGUpLmxlbmd0aDtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyc0FueSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmKHRoaXMuX2FsbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fYWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cclxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcclxuICAgIH0pO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAvLyBDb21tb25KU1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgLy8gQnJvd3NlciBnbG9iYWwuXHJcbiAgICB3aW5kb3cuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcclxuICB9XHJcbn0oKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gVXNpbmcgRXZlbnRFbWl0dGVyMiBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHVzZSB3aWxkY2FyZHMgdG8gc3Vic2NyaWJlIHRvIGFsbCBldmVudHNcbnZhciBldmVudGVtaXR0ZXIyXzEgPSByZXF1aXJlKFwiZXZlbnRlbWl0dGVyMlwiKTtcbmZ1bmN0aW9uIHNob3dXYXJuaW5nKG1zZykge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzRXZlbnREZXNjcmlwdG9yKGRlc2NyaXB0b3IpIHtcbiAgICByZXR1cm4gISFkZXNjcmlwdG9yICYmIGRlc2NyaXB0b3IuZXZlbnRUeXBlO1xufVxuZnVuY3Rpb24gaXNQcmVkaWNhdGVGbihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICFpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSAmJiB0eXBlb2YgZGVzY3JpcHRvciA9PT0gXCJmdW5jdGlvblwiO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREZWZpbml0aW9uKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgZnVuY3Rpb24gZXZlbnRDcmVhdG9yKHBheWxvYWQpIHtcbiAgICAgICAgICAgIC8vIEFsbG93IHJ1bnRpbWUgcGF5bG9hZCBjaGVja2luZyBmb3IgcGxhaW4gSmF2YVNjcmlwdCB1c2FnZVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgcGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZXN0Rm4gPSB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiID8gb3B0aW9ucyA6IG9wdGlvbnMudGVzdDtcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0Rm4gJiYgIXRlc3RGbihwYXlsb2FkKSkge1xuICAgICAgICAgICAgICAgICAgICBzaG93V2FybmluZyhKU09OLnN0cmluZ2lmeShwYXlsb2FkKSArIFwiIGRvZXMgbm90IG1hdGNoIGV4cGVjdGVkIHBheWxvYWQuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50Q3JlYXRvci5ldmVudFR5cGUgPSB0eXBlO1xuICAgICAgICBldmVudENyZWF0b3IudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0eXBlOyB9OyAvLyBhbGxvdyBTdHJpbmcgY29lcmNpb24gdG8gZGVsaXZlciB0aGUgZXZlbnRUeXBlXG4gICAgICAgIHJldHVybiBldmVudENyZWF0b3I7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlRXZlbnREZWZpbml0aW9uID0gY3JlYXRlRXZlbnREZWZpbml0aW9uO1xuZnVuY3Rpb24gZGVmaW5lRXZlbnQodHlwZSkge1xuICAgIHNob3dXYXJuaW5nKFwiZGVmaW5lRXZlbnQgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBmdXR1cmUuIFBsZWFzZSB1c2UgY3JlYXRlRXZlbnREZWZpbml0aW9uIGluc3RlYWQuXCIpO1xuICAgIHZhciBldmVudENyZWF0b3IgPSBmdW5jdGlvbiAocGF5bG9hZCkgeyByZXR1cm4gKHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgcGF5bG9hZDogcGF5bG9hZFxuICAgIH0pOyB9O1xuICAgIGV2ZW50Q3JlYXRvci5ldmVudFR5cGUgPSB0eXBlO1xuICAgIHJldHVybiBldmVudENyZWF0b3I7XG59XG5leHBvcnRzLmRlZmluZUV2ZW50ID0gZGVmaW5lRXZlbnQ7XG5mdW5jdGlvbiBnZXRFdmVudFR5cGUoZGVzY3JpcHRvcikge1xuICAgIGlmIChpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSlcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3IuZXZlbnRUeXBlO1xuICAgIHJldHVybiBkZXNjcmlwdG9yO1xufVxuZnVuY3Rpb24gZmlsdGVyKHByZWRpY2F0ZSwgaGFuZGxlcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShldmVudCkpXG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcihldmVudCk7XG4gICAgfTtcbn1cbnZhciBFdmVudEJ1cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudEJ1cygpIHtcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gbmV3IGV2ZW50ZW1pdHRlcjJfMS5FdmVudEVtaXR0ZXIyKHsgd2lsZGNhcmQ6IHRydWUgfSk7XG4gICAgfVxuICAgIEV2ZW50QnVzLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24gKGV2ZW50LCBtZXRhKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KGV2ZW50LnR5cGUsICFtZXRhID8gZXZlbnQgOiBfX2Fzc2lnbih7fSwgZXZlbnQsIHsgbWV0YTogX19hc3NpZ24oe30sIGV2ZW50Lm1ldGEsIG1ldGEpIH0pKTtcbiAgICB9O1xuICAgIEV2ZW50QnVzLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIC8vIHN0b3JlIGVtaXR0ZXIgb24gY2xvc3VyZVxuICAgICAgICB2YXIgZW1pdHRlciA9IHRoaXMuZW1pdHRlcjtcbiAgICAgICAgdmFyIHN1YnNjcmliZVRvU3ViZGVmID0gZnVuY3Rpb24gKHN1YmRlZikge1xuICAgICAgICAgICAgaWYgKGlzUHJlZGljYXRlRm4oc3ViZGVmKSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEhhbmRsZXJfMSA9IGZpbHRlcihzdWJkZWYsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIub24oXCIqKlwiLCBmaWx0ZXJlZEhhbmRsZXJfMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVtaXR0ZXIub2ZmKFwiKipcIiwgZmlsdGVyZWRIYW5kbGVyXzEpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHR5cGUgPSBnZXRFdmVudFR5cGUoc3ViZGVmKTtcbiAgICAgICAgICAgIGVtaXR0ZXIub24odHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gZW1pdHRlci5vZmYodHlwZSwgaGFuZGxlcik7IH07XG4gICAgICAgIH07XG4gICAgICAgIHZhciBzdWJzID0gQXJyYXkuaXNBcnJheShzdWJzY3JpcHRpb24pID8gc3Vic2NyaXB0aW9uIDogW3N1YnNjcmlwdGlvbl07XG4gICAgICAgIHZhciB1bnN1YnNjcmliZXJzID0gc3Vicy5tYXAoc3Vic2NyaWJlVG9TdWJkZWYpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gdW5zdWJzY3JpYmVycy5mb3JFYWNoKGZ1bmN0aW9uICh1KSB7IHJldHVybiB1KCk7IH0pOyB9O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50QnVzO1xufSgpKTtcbmV4cG9ydHMuRXZlbnRCdXMgPSBFdmVudEJ1cztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50QnVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEV2ZW50QnVzXzEgPSByZXF1aXJlKFwiLi9FdmVudEJ1c1wiKTtcbmV4cG9ydHMuRXZlbnRCdXMgPSBFdmVudEJ1c18xLkV2ZW50QnVzO1xuZXhwb3J0cy5kZWZpbmVFdmVudCA9IEV2ZW50QnVzXzEuZGVmaW5lRXZlbnQ7XG5leHBvcnRzLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbiA9IEV2ZW50QnVzXzEuY3JlYXRlRXZlbnREZWZpbml0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmltYWdlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5JTUFHRV9OQU1FUy5tYXAoZmlsZU5hbWUgPT4gdGhpcy5sb2FkSW1hZ2UoZmlsZU5hbWUsIGAke3RoaXMuSU1BR0VfRk9MREVSfSR7ZmlsZU5hbWV9YCkpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aW1hZ2VOYW1lfSBpbWFnZSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1haW5TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvTWFpblN5c3RlbVwiKTtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgTW91c2VJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlclwiKTtcbmNvbnN0IE1haW5SZW5kZXJfMSA9IHJlcXVpcmUoXCIuLi9yZW5kZXJpbmcvTWFpblJlbmRlclwiKTtcbmNvbnN0IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi91aS9VSUludGVyYWN0aW9uU3lzdGVtXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnByZXZUaW1lID0gMDtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyID0gbmV3IE1haW5SZW5kZXJfMS5NYWluUmVuZGVyKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkID0gbmV3IEdhbWVXb3JsZF8xLkdhbWVXb3JsZChnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0gPSBuZXcgVUlJbnRlcmFjdGlvblN5c3RlbV8xLlVJSW50ZXJhY3Rpb25TeXN0ZW0obmV3IE1vdXNlSW5wdXRNYW5hZ2VyXzEuTW91c2VJbnB1dE1hbmFnZXIoZG9tSGFuZGxlci5tZW51Q2FudmFzKSk7XG4gICAgICAgIHRoaXMubWFpblN5c3RlbSA9IG5ldyBNYWluU3lzdGVtXzEuTWFpblN5c3RlbShnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIG1haW4oKSB7XG4gICAgICAgIGNvbnN0IHRpY2sgPSAodGltZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldlRpbWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSW5wdXRzKGRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHJldlRpbWUgPSB0aW1lO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci51cGRhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLm1haW5TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmZpcmV3b3Jrcy51cGRhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5leHBsb3Npb24udXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuc2NvcmUudXBkYXRlKGRlbHRhKTtcbiAgICB9XG4gICAgdXBkYXRlSW5wdXRzKGRlbHRhKSB7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQubWVudUJ1dHRvbiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5maXJld29ya3MucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0uaW5wdXQucmVzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVsdGEpO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMubWFpblJlbmRlci5yZW5kZXIodGhpcy5nYW1lV29ybGQpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUxvb3AgPSBHYW1lTG9vcDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBQb3dlclNob3RUeXBlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUG93ZXJTaG90VHlwZVwiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IFBvc2l0aW9uSGlzdG9yeV8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1Bvc2l0aW9uSGlzdG9yeVwiKTtcbmNvbnN0IEJhbGxQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuL3Bvd2VyU2hvdHMvQmFsbFBvd2VyU2hvdFwiKTtcbmNsYXNzIEJhbGwge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFuZ2xlV2l0aFBsYXllciA9IDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkgPSBuZXcgUG9zaXRpb25IaXN0b3J5XzEuUG9zaXRpb25IaXN0b3J5KDUwMDApO1xuICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QgPSBuZXcgQmFsbFBvd2VyU2hvdF8xLkJhbGxQb3dlclNob3QoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLmJhbGxTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5tYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNDAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5tYXhTcGVlZCAvIDIwMDA7XG4gICAgfVxuICAgIHNldEZvclN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzU2V0Rm9yU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKyB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhTcGVlZCAtIHRoaXMubWF4U3BlZWQgLyAzLjMzKSArIHRoaXMubWF4U3BlZWQgLyAzLjMzO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLlBJIC8gMiArICgoTWF0aC5yYW5kb20oKSAqIE1hdGguUEkpIC8gNC41IC0gTWF0aC5QSSAvIDkpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoMCwgMCk7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMuYmFsbFBvd2VyU2hvdC5pc1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkuYWRkUG9zaXRpb24obmV3IFBvaW50XzEuUG9pbnQodGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgICAgIGlmICh0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA8IHRoaXMubWF4U3BlZWQgLyAyKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QucmVzZXRQb3dlclNob3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVUcmFqZWN0b3J5KGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkudXBkYXRlKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhdHRhY2hUb1BsYXllcihwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IHBsYXllcjtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQ7XG4gICAgICAgIHRoaXMuYW5nbGVXaXRoUGxheWVyID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdC5yZXNldFBvd2VyU2hvdCgpO1xuICAgIH1cbiAgICBkZXRhY2hGcm9tUGxheWVyKCkge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICBsZXQgc3BlZWRGYWN0b3IgPSAxO1xuICAgICAgICBpZiAodGhpcy5hdHRhY2hlZFBsYXllcj8ucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSkge1xuICAgICAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LmVuYWJsZVBvd2VyU2hvdCh0aGlzLmF0dGFjaGVkUGxheWVyKTtcbiAgICAgICAgICAgIHNwZWVkRmFjdG9yID0gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5nZXRTcGVlZEZhY3Rvcih0aGlzLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90VHlwZSgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyPy5wb3dlclNob3RXcmFwcGVyLnJlc2V0UG93ZXJTaG90KCk7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQodGhpcy5tYXhTcGVlZCAqIHNwZWVkRmFjdG9yLCB0aGlzLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgfVxuICAgIHJlc2V0T25Hb2FsKCkge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LnJlc2V0UG93ZXJTaG90KCk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsID0gQmFsbDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FeHBsb3Npb25Db21wb25lbnQgPSBleHBvcnRzLkV4cGxvc2lvbiA9IHZvaWQgMDtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEV4cGxvc2lvbiB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhDb21wb25lbnRzID0gNDA7XG4gICAgICAgIHRoaXMubWluQ29tcG9uZW50cyA9IDIwO1xuICAgICAgICB0aGlzLm1heFRpbWUgPSAxMDAwO1xuICAgICAgICB0aGlzLmNvbG9yT2Zmc2V0ID0gODA7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMubWF4U2l6ZSA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMjY7XG4gICAgICAgIHRoaXMubWF4RGlzdGFuY2UgPSB0aGlzLm1heFNpemUgKiAzO1xuICAgIH1cbiAgICBhZGRFeHBsb3Npb24ocG9zaXRpb24sIHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICBjb25zdCBudW1iZXJPZkNvbXBvbmVudHMgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhDb21wb25lbnRzIC0gdGhpcy5taW5Db21wb25lbnRzKSArIHRoaXMubWluQ29tcG9uZW50cyk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mQ29tcG9uZW50czsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IE1hdGgucmFuZG9tKCkgKiB0aGlzLm1heFRpbWU7XG4gICAgICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIGNvbnN0IGcgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgIGxldCByLCBiO1xuICAgICAgICAgICAgaWYgKHBvd2VyU2hvdFR5cGUgPT09IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RUeXBlLkZJUkUpIHtcbiAgICAgICAgICAgICAgICByID0gMjU1IC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICAgICAgYiA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgciA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgICAgIGIgPSAyNTUgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gXCIjXCIgK1xuICAgICAgICAgICAgICAgIHIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSArXG4gICAgICAgICAgICAgICAgZy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpICtcbiAgICAgICAgICAgICAgICBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChuZXcgRXhwbG9zaW9uQ29tcG9uZW50KGR1cmF0aW9uLCBhbmdsZSwgY29sb3IpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIGNvbXBvbmVudC51cGRhdGUoZGVsdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gdGhpcy5jb21wb25lbnRzLmZpbHRlcihjb21wb25lbnQgPT4gIWNvbXBvbmVudC5pc0ZpbmlzaGVkKCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuRXhwbG9zaW9uID0gRXhwbG9zaW9uO1xuY2xhc3MgRXhwbG9zaW9uQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihkdXJhdGlvbiwgYW5nbGUsIGNvbG9yKSB7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuZGVsdGEgPSAwO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5kZWx0YSArPSBkZWx0YTtcbiAgICB9XG4gICAgaXNGaW5pc2hlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsdGEgPj0gdGhpcy5kdXJhdGlvbjtcbiAgICB9XG4gICAgZ2V0RmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWx0YSAvIHRoaXMuZHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5FeHBsb3Npb25Db21wb25lbnQgPSBFeHBsb3Npb25Db21wb25lbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmlyZXdvcmtDb21wb25lbnREdG8gPSBleHBvcnRzLkZpcmV3b3JrRHRvID0gZXhwb3J0cy5GaXJld29ya3MgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRmlyZXdvcmtzIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNvbG9yT2Zmc2V0ID0gMTAwO1xuICAgICAgICB0aGlzLm1heENvbXBvbmVudHMgPSAyMDtcbiAgICAgICAgdGhpcy5taW5Db21wb25lbnRzID0gMjA7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSAxMDA7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZGaXJld29ya3MgPSBNYXRoLnJvdW5kKEZpcmV3b3Jrcy5hbmltYXRpb25UaW1lIC8gdGhpcy5pbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gW107XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5tYXhEaXN0YW5jZSA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogNztcbiAgICAgICAgdGhpcy5taW5EaXN0YW5jZSA9IHRoaXMubWF4RGlzdGFuY2UgLyA1O1xuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IE1hdGguY2VpbChnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAvIDEyKTtcbiAgICB9XG4gICAgaW5pdEZpcmV3b3JrcygpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bWJlck9mRmlyZXdvcmtzOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZCA9IHRoaXMuZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpO1xuICAgICAgICAgICAgY29uc3QgZ3JlZW4gPSB0aGlzLmdldFJhbmRvbUNvbG9yVmFsdWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGJsdWUgPSB0aGlzLmdldFJhbmRvbUNvbG9yVmFsdWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHNfbnVtYmVyID0gTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heENvbXBvbmVudHMgLSB0aGlzLm1pbkNvbXBvbmVudHMpICsgdGhpcy5taW5Db21wb25lbnRzO1xuICAgICAgICAgICAgbGV0IGNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29tcG9uZW50c19udW1iZXI7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLmdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KHJlZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHRoaXMuZ2V0Q29sb3JWYWx1ZVdpdGhPZmZzZXQoZ3JlZW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KGJsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gXCIjXCIgK1xuICAgICAgICAgICAgICAgICAgICByLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgICAgICBnLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgICAgICBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKG5ldyBGaXJld29ya0NvbXBvbmVudER0byhjb2xvciwgTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyLCBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhEaXN0YW5jZSAtIHRoaXMubWluRGlzdGFuY2UpICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5EaXN0YW5jZSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmlyZXdvcmtzLnB1c2gobmV3IEZpcmV3b3JrRHRvKG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgTWF0aC5yYW5kb20oKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAqIE1hdGgucmFuZG9tKCkpLCAtaSAqIHRoaXMuaW50ZXJ2YWwsIGNvbXBvbmVudHMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MuZm9yRWFjaChmaXJld29yayA9PiB7XG4gICAgICAgICAgICBmaXJld29yay5zdGFydFRpbWUgKz0gZGVsdGE7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MgPSBbXTtcbiAgICB9XG4gICAgZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NSk7XG4gICAgfVxuICAgIGdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KGNvbG9WYWx1ZSkge1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgoY29sb1ZhbHVlICtcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqICh0aGlzLmNvbG9yT2Zmc2V0IC8gMikgLSB0aGlzLmNvbG9yT2Zmc2V0IC8gMiksIDApLCAyNTUpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtzID0gRmlyZXdvcmtzO1xuRmlyZXdvcmtzLmFuaW1hdGlvblRpbWUgPSA1MDAwO1xuY2xhc3MgRmlyZXdvcmtEdG8ge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBzdGFydFRpbWUsIGNvbXBvbmVudHMgPSBbXSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gc3RhcnRUaW1lO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBjb21wb25lbnRzO1xuICAgICAgICB0aGlzLnNpbmdsZUR1cmF0aW9uID0gNzAwO1xuICAgICAgICB0aGlzLm1heExlbmd0aEZhY3RvciA9IDAuMztcbiAgICB9XG4gICAgaXNGaXJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0VGltZSA+PSAwICYmIHRoaXMuc3RhcnRUaW1lIDw9IHRoaXMuc2luZ2xlRHVyYXRpb247XG4gICAgfVxuICAgIGdldExlbmdodCgpIHtcbiAgICAgICAgY29uc3QgZmFjdG9yID0gdGhpcy5zdGFydFRpbWUgPj0gdGhpcy5zaW5nbGVEdXJhdGlvbiAvIDJcbiAgICAgICAgICAgID8gKHRoaXMuc2luZ2xlRHVyYXRpb24gLSB0aGlzLnN0YXJ0VGltZSkgLyAodGhpcy5zaW5nbGVEdXJhdGlvbiAvIDIpXG4gICAgICAgICAgICA6IHRoaXMuc3RhcnRUaW1lIC8gKHRoaXMuc2luZ2xlRHVyYXRpb24gLyAyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF4TGVuZ3RoRmFjdG9yICogZmFjdG9yO1xuICAgIH1cbiAgICBnZXRUaW1lRmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydFRpbWUgLyB0aGlzLnNpbmdsZUR1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtEdG8gPSBGaXJld29ya0R0bztcbmNsYXNzIEZpcmV3b3JrQ29tcG9uZW50RHRvIHtcbiAgICBjb25zdHJ1Y3Rvcihjb2xvciwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya0NvbXBvbmVudER0byA9IEZpcmV3b3JrQ29tcG9uZW50RHRvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGUgPSB2b2lkIDA7XG5jbGFzcyBHYXRlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IDA7XG4gICAgICAgIHRoaXMubWF4QW5nbGUgPSBNYXRoLlBJIC8gMjtcbiAgICAgICAgdGhpcy5vcGVuVGltZSA9IDMwMDtcbiAgICAgICAgdGhpcy5zdGVwID0gdGhpcy5tYXhBbmdsZSAvIHRoaXMub3BlblRpbWU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSwgaXNPcGVuKSB7XG4gICAgICAgIGlmIChpc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgKz0gdGhpcy5zdGVwICogZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlIC09IHRoaXMuc3RlcCAqIGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYW5nbGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih0aGlzLm1heEFuZ2xlLCB0aGlzLmFuZ2xlKSk7XG4gICAgfVxuICAgIGdldCBjdXJyZW50QW5nbGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZSA9IEdhdGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR29hbFBvc3RzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEdvYWxQb3N0cyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzO1xuICAgIH1cbn1cbmV4cG9ydHMuR29hbFBvc3RzID0gR29hbFBvc3RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IHZvaWQgMDtcbmNsYXNzIEhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmhvdmVyUHJvZ3Jlc3MgPSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gSG92ZXJhYmxlRW50aXR5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVCdXR0b24gPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBIb3ZlcmFibGVFbnRpdHlfMSA9IHJlcXVpcmUoXCIuL0hvdmVyYWJsZUVudGl0eVwiKTtcbmNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBIb3ZlcmFibGVFbnRpdHlfMS5Ib3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCByZWZXaWR0aCwgcmVmSGVpZ2h0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTtcbiAgICAgICAgdGhpcy5kaW1lbnNpb24gPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoaGVpZ2h0ICogKHJlZldpZHRoIC8gcmVmSGVpZ2h0KSwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIChnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5kaW1lbnNpb24ud2lkdGgpIC8gMiwgKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5kaW1lbnNpb24uaGVpZ2h0KSAvIDIpO1xuICAgIH1cbiAgICBjb250YWlucyhwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5wb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucG9zaXRpb24ueCArIHRoaXMuZGltZW5zaW9uLndpZHRoICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMucG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpO1xuICAgIH1cbiAgICBnZXRUcmFuc2l0aW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIDEwMDtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVCdXR0b24gPSBNZW51QnV0dG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQm91bmNlV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vYm91bmNlL0JvdW5jZVdyYXBwZXJcIik7XG5jb25zdCBQb3dlclNob3RXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9wb3dlclNob3RzL1Bvd2VyU2hvdFdyYXBwZXJcIik7XG5jb25zdCBTdHVubmVkV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vc3R1bm5lZC9TdHVubmVkV3JhcHBlclwiKTtcbmNsYXNzIFBsYXllciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGlzQ3B1LCBpc1N1YnN0aXR1dGUsIHNpZGUsIGNvbG9ySW5kZXgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2VXcmFwcGVyID0gbmV3IEJvdW5jZVdyYXBwZXJfMS5Cb3VuY2VXcmFwcGVyKCk7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgIHRoaXMuc3R1bm5lZFdyYXBwZXIgPSBuZXcgU3R1bm5lZFdyYXBwZXJfMS5TdHVubmVkV3JhcHBlcih0aGlzKTtcbiAgICAgICAgdGhpcy5ub3JtYWxNYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNzAwO1xuICAgICAgICBpZiAoaXNDcHUpIHtcbiAgICAgICAgICAgIHRoaXMubm9ybWFsTWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkICogMC44O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAzMDA7XG4gICAgICAgIHRoaXMuY2xvc2VUb1BvaW50RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplID0gZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMuaXNDcHUgPSBpc0NwdTtcbiAgICAgICAgdGhpcy5pc1N1YnN0aXR1dGUgPSBpc1N1YnN0aXR1dGU7XG4gICAgICAgIHRoaXMuc2lkZSA9IHNpZGU7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IGNvbG9ySW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucG93ZXJTaG90V3JhcHBlciA9IG5ldyBQb3dlclNob3RXcmFwcGVyXzEuUG93ZXJTaG90V3JhcHBlcihnYW1lQ29uZmlncywgc2lkZSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgdHJ1ZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMSk7XG4gICAgfVxuICAgIHJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UodGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKTtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICB9XG4gICAgYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ZWRQb3NpdGlvbiA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wcm9qZWN0VG9GaW5hbFBvc2l0aW9uKCk7XG4gICAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRhcmdldFBvc2l0aW9uKTtcbiAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocHJvamVjdGVkUG9zaXRpb24sIHRhcmdldFBvc2l0aW9uKSA8IHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFggPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFkgPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGxldCBzdGVlclggPSBkZXNpcmVkU3BlZWRYIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lng7XG4gICAgICAgICAgICBsZXQgc3RlZXJZID0gZGVzaXJlZFNwZWVkWSAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgICAgICBpZiAoc3RlZXJNYWduaXR1ZGUgPiBtYXhTdGVlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4U3RlZXIgLyBzdGVlck1hZ25pdHVkZTtcbiAgICAgICAgICAgICAgICBzdGVlclggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgc3RlZXJZICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKz0gc3RlZXJYO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZCh0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgfVxuICAgIHN3aXRjaENvbG9ySW5kZXgoKSB7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IHRoaXMuY29sb3JJbmRleCA9PT0gMCA/IDEgOiAwO1xuICAgIH1cbiAgICB1cGRhdGVQb3dlclNob3QoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFdyYXBwZXIudXBkYXRlKGRlbHRhTXMsIHRoaXMpO1xuICAgIH1cbiAgICByZXNldE9uR29hbCgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2VXcmFwcGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuc3R1bm5lZFdyYXBwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMO1xuICAgICAgICB0aGlzLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICB9XG4gICAgc3RhcnRCb3VuY2luZygpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVdyYXBwZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgbGV0IG9mZnNldFggPSAwO1xuICAgICAgICBpZiAodGhpcy5pc1N1YnN0aXR1dGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYXG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi54ID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgb2Zmc2V0WDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyID0gUGxheWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvdW5jZVdyYXBwZXIgPSB2b2lkIDA7XG5jbGFzcyBCb3VuY2VXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ib3VuY2luZ0R1cmF0aW9uID0gMjAwMDtcbiAgICAgICAgdGhpcy5ib3VuY2VNYXhBbXBsaXR1ZGUgPSAwLjU7XG4gICAgICAgIHRoaXMuYm91bmNlRXhwb25lbnRpYWxGYWN0b3IgPSAwLjAwMzQ2O1xuICAgICAgICB0aGlzLmJvdW5jZU51bWJlciA9IDU7XG4gICAgICAgIHRoaXMuYm91bmNpbmdUaW1lID0gdGhpcy5ib3VuY2luZ0R1cmF0aW9uO1xuICAgIH1cbiAgICBzdGFydEJvdW5jaW5nKCkge1xuICAgICAgICBpZiAodGhpcy5ib3VuY2luZ1RpbWUgPiB0aGlzLmJvdW5jaW5nRHVyYXRpb24gLyAyKSB7XG4gICAgICAgICAgICB0aGlzLmJvdW5jaW5nVGltZSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5ib3VuY2luZ1RpbWUgKz0gZGVsdGFNcztcbiAgICB9XG4gICAgZ2V0Qm91bmNpbmdBbXBsaXR1ZGUoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0JvdW5jaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAodGhpcy5ib3VuY2VNYXhBbXBsaXR1ZGUgKlxuICAgICAgICAgICAgTWF0aC5wb3coTWF0aC5FLCAtdGhpcy5ib3VuY2luZ1RpbWUgKiB0aGlzLmJvdW5jZUV4cG9uZW50aWFsRmFjdG9yKSAqXG4gICAgICAgICAgICBNYXRoLnNpbih0aGlzLmJvdW5jaW5nVGltZSAvICgyICogTWF0aC5QSSAqIHRoaXMuYm91bmNlTnVtYmVyKSkpO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2luZ1RpbWUgPSB0aGlzLmJvdW5jaW5nRHVyYXRpb247XG4gICAgfVxuICAgIGlzQm91bmNpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJvdW5jaW5nVGltZSA8PSB0aGlzLmJvdW5jaW5nRHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5Cb3VuY2VXcmFwcGVyID0gQm91bmNlV3JhcHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsUG93ZXJTaG90ID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBQb3dlclNob3RUeXBlXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUG93ZXJTaG90VHlwZVwiKTtcbmNsYXNzIEJhbGxQb3dlclNob3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFR5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGUgPSBudWxsO1xuICAgIH1cbiAgICBnZXQgaXNQb3dlclNob3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdDtcbiAgICB9XG4gICAgZ2V0UG93ZXJTaG90VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJTaG90VHlwZTtcbiAgICB9XG4gICAgZW5hYmxlUG93ZXJTaG90KHBsYXllcikge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IHRydWU7XG4gICAgICAgIHRoaXMucG93ZXJTaG90VHlwZSA9IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuZ2V0UG93ZXJTaG90VHlwZShwbGF5ZXIuY29sb3JJbmRleCk7XG4gICAgICAgIHRoaXMucG93ZXJTaG90RGVzdGlvbmF0aW9uU2lkZSA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlVXRpbGl0aWVzLmdldE9wcG9zaXRlU2lkZShwbGF5ZXIuc2lkZSk7XG4gICAgfVxuICAgIHJlc2V0UG93ZXJTaG90KCkge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFR5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGUgPSBudWxsO1xuICAgIH1cbiAgICBzaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UoKSB7XG4gICAgICAgIGlmICghdGhpcy5wb3dlclNob3QgfHwgdGhpcy5wb3dlclNob3RUeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5zaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UodGhpcy5wb3dlclNob3RUeXBlKTtcbiAgICB9XG4gICAgc2hvdWxkTW92ZVRvR29hbCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBvd2VyU2hvdCB8fCB0aGlzLnBvd2VyU2hvdFR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5zaG91bGRNb3ZlVG9Hb2FsKHRoaXMucG93ZXJTaG90VHlwZSk7XG4gICAgfVxuICAgIGdldFBvd2VyU2hvdERlc3RpbmF0aW9uU2lkZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJTaG90RGVzdGlvbmF0aW9uU2lkZTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxQb3dlclNob3QgPSBCYWxsUG93ZXJTaG90O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkVsZWN0cmljUG93ZXJTaG90ID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEVsZWN0cmljUG93ZXJTaG90IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmludGVydmFsID0gNTA7XG4gICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdFNpemUgPSAxMDtcbiAgICAgICAgdGhpcy5sYXN0Q2hhbmdlRGVsdGFUaW1lID0gdGhpcy5pbnRlcnZhbDtcbiAgICAgICAgdGhpcy5hbmdsZU9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdFBvaW50QXJyYXkgPSBbXTtcbiAgICAgICAgdGhpcy53aGl0ZUxpbmVWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLnJvdW5kKE1hdGguZmxvb3IoZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKiAyLjUpKTtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyA1KTtcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBNYXRoLmNlaWwodGhpcy5oZWlnaHQgLyA0KTtcbiAgICAgICAgdGhpcy5iaWdMaW5lV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMubGluZVdpZHRoICogMyk7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubGFzdENoYW5nZURlbHRhVGltZSArPSBkZWx0YU1zO1xuICAgICAgICB0aGlzLndoaXRlTGluZVZpc2libGUgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5sYXN0Q2hhbmdlRGVsdGFUaW1lID49IHRoaXMuaW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHRoaXMubGFzdENoYW5nZURlbHRhVGltZSA9IDA7XG4gICAgICAgICAgICB0aGlzLnJlZ2VuZXJhdGVMaWdodG5pbmdCb2x0UG9pbnRzKCk7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlT2Zmc2V0ICs9IChNYXRoLlBJIC8gNDUpICogdGhpcy5pbnRlcnZhbCAqIDAuMDU7XG4gICAgICAgICAgICB0aGlzLndoaXRlTGluZVZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG91bGRSZW5kZXIocGxheWVyKSB7XG4gICAgICAgIHJldHVybiAocGxheWVyLmNvbG9ySW5kZXggPT09IDEgJiZcbiAgICAgICAgICAgIHBsYXllci5wb3dlclNob3RXcmFwcGVyLmdldFBvd2VyU2hvdCgpICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKTtcbiAgICB9XG4gICAgcmVnZW5lcmF0ZUxpZ2h0bmluZ0JvbHRQb2ludHMoKSB7XG4gICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdFBvaW50QXJyYXkgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxpZ2h0bmluZ0JvbHRTaXplOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdFBvaW50QXJyYXkucHVzaChuZXcgUG9pbnRfMS5Qb2ludCgodGhpcy53aWR0aCAvIHRoaXMubGlnaHRuaW5nQm9sdFNpemUpICogaSAtIHRoaXMud2lkdGggLyAyLCBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmhlaWdodCkgLSB0aGlzLmhlaWdodCAvIDIpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuRWxlY3RyaWNQb3dlclNob3QgPSBFbGVjdHJpY1Bvd2VyU2hvdDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GbGFtZUR0byA9IGV4cG9ydHMuRmlyZVBvd2VyU2hvdCA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBGaXJlUG93ZXJTaG90IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLm1heEluZGV4ID0gMTY7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSAxO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZERlbHRhVGltZSA9IHRoaXMuaW50ZXJ2YWw7XG4gICAgICAgIHRoaXMuZmxhbWVzID0gW107XG4gICAgICAgIHRoaXMubWF4U2l6ZSA9IE1hdGgucm91bmQoZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyAyKTtcbiAgICAgICAgdGhpcy5taW5TaXplID0gdGhpcy5tYXhTaXplIC8gNTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMsIHBsYXllcikge1xuICAgICAgICB0aGlzLmZsYW1lcy5mb3JFYWNoKGZsYW1lID0+IHtcbiAgICAgICAgICAgIGZsYW1lLnVwZGF0ZShkZWx0YU1zKTtcbiAgICAgICAgICAgIGlmIChmbGFtZS5pc0ZpbmlzaGVkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZsYW1lcy5zcGxpY2UodGhpcy5mbGFtZXMuaW5kZXhPZihmbGFtZSksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgKz0gZGVsdGFNcztcbiAgICAgICAgaWYgKHRoaXMubGFzdEFkZGVkRGVsdGFUaW1lID49IHRoaXMuaW50ZXJ2YWwgJiZcbiAgICAgICAgICAgIHBsYXllci5wb3dlclNob3RXcmFwcGVyLmdldFBvd2VyU2hvdCgpICYmXG4gICAgICAgICAgICBwbGF5ZXIuY29sb3JJbmRleCA9PT0gMCAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCkge1xuICAgICAgICAgICAgdGhpcy5mbGFtZXMucHVzaChuZXcgRmxhbWVEdG8obmV3IFBvaW50XzEuUG9pbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSksIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMubWF4SW5kZXgpKSk7XG4gICAgICAgICAgICB0aGlzLmxhc3RBZGRlZERlbHRhVGltZSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdWxkUmVuZGVyKF9wbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJlUG93ZXJTaG90ID0gRmlyZVBvd2VyU2hvdDtcbmNsYXNzIEZsYW1lRHRvIHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgaW5kZXgpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSAwO1xuICAgICAgICB0aGlzLm1heER1cmF0aW9uID0gMTAwMDtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiArPSBkZWx0YU1zO1xuICAgIH1cbiAgICBnZXREdXJhdGlvbkZhY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHVyYXRpb24gLyB0aGlzLm1heER1cmF0aW9uO1xuICAgIH1cbiAgICBpc0ZpbmlzaGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kdXJhdGlvbiA+PSB0aGlzLm1heER1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuRmxhbWVEdG8gPSBGbGFtZUR0bztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb3dlclNob3RXcmFwcGVyID0gdm9pZCAwO1xuY29uc3QgRWxlY3RyaWNQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuL0VsZWN0cmljUG93ZXJTaG90XCIpO1xuY29uc3QgRmlyZVBvd2VyU2hvdF8xID0gcmVxdWlyZShcIi4vRmlyZVBvd2VyU2hvdFwiKTtcbmNsYXNzIFBvd2VyU2hvdFdyYXBwZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBzaWRlKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscyA9IDA7XG4gICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2Fsc1RvUG93ZXJTaG90ID0gMjtcbiAgICAgICAgdGhpcy5wb3dlclNob3RzID0gW107XG4gICAgICAgIHRoaXMucG93ZXJTaG90cy5wdXNoKG5ldyBFbGVjdHJpY1Bvd2VyU2hvdF8xLkVsZWN0cmljUG93ZXJTaG90KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucG93ZXJTaG90cy5wdXNoKG5ldyBGaXJlUG93ZXJTaG90XzEuRmlyZVBvd2VyU2hvdChnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnNpZGUgPSBzaWRlO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcywgcGxheWVyKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90cy5mb3JFYWNoKHBvd2VyU2hvdCA9PiB7XG4gICAgICAgICAgICBwb3dlclNob3QudXBkYXRlKGRlbHRhTXMsIHBsYXllcik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQgcG93ZXJTaG90RW50aXRpZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdHM7XG4gICAgfVxuICAgIHVwZGF0ZVNjb3JlZEdvYWwocGxheWVyU2lkZSkge1xuICAgICAgICBpZiAocGxheWVyU2lkZSA9PT0gdGhpcy5zaWRlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMrKztcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnNlY3V0aXZlR29hbHMgPT09IHRoaXMuY29uc2VjdXRpdmVHb2Fsc1RvUG93ZXJTaG90KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb3dlclNob3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFBvd2VyU2hvdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJTaG90O1xuICAgIH1cbiAgICByZXNldFBvd2VyU2hvdCgpIHtcbiAgICAgICAgaWYgKHRoaXMucG93ZXJTaG90KSB7XG4gICAgICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuUG93ZXJTaG90V3JhcHBlciA9IFBvd2VyU2hvdFdyYXBwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3RhckR0byA9IGV4cG9ydHMuU3R1bm5lZFN0YXJzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFN0dW5uZWRTdGFycyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGVsdGFCZXR3ZWVuU3RhcnMgPSAyMDA7XG4gICAgICAgIHRoaXMuYW5nbGVTdGVwID0gTWF0aC5QSSAvIDgwMDtcbiAgICAgICAgdGhpcy5zdGFycyA9IFtdO1xuICAgICAgICB0aGlzLnN0YXJEZWx0YSA9IDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSwgcG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5zdGFyRGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIGlmICh0aGlzLnN0YXJEZWx0YSA+PSB0aGlzLmRlbHRhQmV0d2VlblN0YXJzKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJzLnB1c2gobmV3IFN0YXJEdG8obmV3IFBvaW50XzEuUG9pbnQocG9zaXRpb24ueCwgcG9zaXRpb24ueSksIDAsIE1hdGgucmFuZG9tKCkgKiAyICogTWF0aC5QSSkpO1xuICAgICAgICAgICAgdGhpcy5zdGFyRGVsdGEgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhcnMuZm9yRWFjaCgoc3RhciwgX2luZGV4KSA9PiB7XG4gICAgICAgICAgICBzdGFyLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgICAgICBzdGFyLmFuZ2xlICs9IHRoaXMuYW5nbGVTdGVwICogZGVsdGE7XG4gICAgICAgICAgICBpZiAoc3Rhci5nZXRGYWN0b3IoKSA+PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFycy5zcGxpY2UodGhpcy5zdGFycy5pbmRleE9mKHN0YXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TdHVubmVkU3RhcnMgPSBTdHVubmVkU3RhcnM7XG5TdHVubmVkU3RhcnMuZHVyYXRpb24gPSAyMDAwO1xuY2xhc3MgU3RhckR0byB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGFuZ2xlLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMDtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gKz0gZGVsdGE7XG4gICAgfVxuICAgIGdldEZhY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHVyYXRpb24gLyBTdHVubmVkU3RhcnMuZHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5TdGFyRHRvID0gU3RhckR0bztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdHVubmVkV3JhcHBlciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IFN0dW5uZWRTdGFyc18xID0gcmVxdWlyZShcIi4vU3R1bm5lZFN0YXJzXCIpO1xuY2xhc3MgU3R1bm5lZFdyYXBwZXIge1xuICAgIGNvbnN0cnVjdG9yKHBsYXllcikge1xuICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFycyA9IG5ldyBTdHVubmVkU3RhcnNfMS5TdHVubmVkU3RhcnMoKTtcbiAgICAgICAgdGhpcy5zdHVubmVkTWF4VmFsdWUgPSAyMDAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGVwID0gMTAwMDtcbiAgICAgICAgdGhpcy5zdHVubmVkRHVyYXRpb24gPSAzMDAwO1xuICAgICAgICB0aGlzLnBsYXllciA9IHBsYXllcjtcbiAgICB9XG4gICAgdXBkYXRlU3R1bm5lZFZhbHVlKG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyLnBsYXllclN0YXR1cyAhPT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwZWVkID0gdGhpcy5wbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICAgICAgaWYgKHNwZWVkID4gb3RoZXJQbGF5ZXJTcGVlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlID0gTWF0aC5tYXgoMCwgdGhpcy5zdHVubmVkVmFsdWUgLSB0aGlzLnN0dW5uZWRTdGVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNwZWVkIDwgb3RoZXJQbGF5ZXJTcGVlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlICs9IHRoaXMuc3R1bm5lZFN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5zdHVubmVkVmFsdWUgPiB0aGlzLnN0dW5uZWRNYXhWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFRpbWUgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvcmNlU3R1bm5lZCgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQ7XG4gICAgICAgIHRoaXMuc3R1bm5lZFRpbWUgPSAwO1xuICAgIH1cbiAgICBkZWNyZW1lbnRTdHVubmVkVmFsdWUoZGVsdGFNcykge1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gZGVsdGFNcyAvIDIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQpIHtcbiAgICAgICAgICAgIHRoaXMuc3R1bm5lZFRpbWUgKz0gZGVsdGFNcztcbiAgICAgICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnVwZGF0ZShkZWx0YU1zLCB0aGlzLnBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0dW5uZWRUaW1lID4gdGhpcy5zdHVubmVkRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRTdGFycy5zdGFycyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnN0YXJzID0gW107XG4gICAgfVxufVxuZXhwb3J0cy5TdHVubmVkV3JhcHBlciA9IFN0dW5uZWRXcmFwcGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxTdGF0dXMgPSB2b2lkIDA7XG52YXIgQmFsbFN0YXR1cztcbihmdW5jdGlvbiAoQmFsbFN0YXR1cykge1xuICAgIEJhbGxTdGF0dXNbXCJGUkVFXCJdID0gXCJGUkVFXCI7XG4gICAgQmFsbFN0YXR1c1tcIkFUVEFDSEVEXCJdID0gXCJBVFRBQ0hFRFwiO1xuICAgIEJhbGxTdGF0dXNbXCJHT0FMX1NDT1JFRFwiXSA9IFwiR09BTF9TQ09SRURcIjtcbn0pKEJhbGxTdGF0dXMgfHwgKGV4cG9ydHMuQmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXMgPSB2b2lkIDA7XG52YXIgR2FtZVN0YXR1cztcbihmdW5jdGlvbiAoR2FtZVN0YXR1cykge1xuICAgIEdhbWVTdGF0dXNbXCJNRU5VXCJdID0gXCJNRU5VXCI7XG4gICAgR2FtZVN0YXR1c1tcIldBSVRJTkdfQkFMTFwiXSA9IFwiV0FJVElOR19CQUxMXCI7XG4gICAgR2FtZVN0YXR1c1tcIlBMQVlJTkdcIl0gPSBcIlBMQVlJTkdcIjtcbiAgICBHYW1lU3RhdHVzW1wiRU5EX0dBTUVcIl0gPSBcIkVORF9HQU1FXCI7XG4gICAgR2FtZVN0YXR1c1tcIlNVQlNUSVRJT05cIl0gPSBcIlNVQlNUSVRJT05cIjtcbn0pKEdhbWVTdGF0dXMgfHwgKGV4cG9ydHMuR2FtZVN0YXR1cyA9IEdhbWVTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLktleXNVdGlsaXRpZXMgPSBleHBvcnRzLktleXNEaXJlY3Rpb24gPSBleHBvcnRzLktleXMgPSB2b2lkIDA7XG52YXIgS2V5cztcbihmdW5jdGlvbiAoS2V5cykge1xuICAgIEtleXNbXCJBUlJPV19ET1dOXCJdID0gXCJBcnJvd0Rvd25cIjtcbiAgICBLZXlzW1wiQVJST1dfVVBcIl0gPSBcIkFycm93VXBcIjtcbiAgICBLZXlzW1wiQVJST1dfTEVGVFwiXSA9IFwiQXJyb3dMZWZ0XCI7XG4gICAgS2V5c1tcIkFSUk9XX1JJR0hUXCJdID0gXCJBcnJvd1JpZ2h0XCI7XG4gICAgS2V5c1tcIlNQQUNFXCJdID0gXCIgXCI7XG59KShLZXlzIHx8IChleHBvcnRzLktleXMgPSBLZXlzID0ge30pKTtcbnZhciBLZXlzRGlyZWN0aW9uO1xuKGZ1bmN0aW9uIChLZXlzRGlyZWN0aW9uKSB7XG4gICAgS2V5c0RpcmVjdGlvbltcIkhPUklaT05UQUxcIl0gPSBcIkhPUklaT05UQUxcIjtcbiAgICBLZXlzRGlyZWN0aW9uW1wiVkVSVElDQUxcIl0gPSBcIlZFUlRJQ0FMXCI7XG59KShLZXlzRGlyZWN0aW9uIHx8IChleHBvcnRzLktleXNEaXJlY3Rpb24gPSBLZXlzRGlyZWN0aW9uID0ge30pKTtcbmNsYXNzIEtleXNVdGlsaXRpZXMge1xuICAgIHN0YXRpYyBnZXRLZXlEaXJlY3Rpb24oa2V5KSB7XG4gICAgICAgIGlmIChrZXkgPT09IEtleXMuQVJST1dfTEVGVCB8fCBrZXkgPT09IEtleXMuQVJST1dfUklHSFQpIHtcbiAgICAgICAgICAgIHJldHVybiBLZXlzRGlyZWN0aW9uLkhPUklaT05UQUw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGtleSA9PT0gS2V5cy5BUlJPV19VUCB8fCBrZXkgPT09IEtleXMuQVJST1dfRE9XTikge1xuICAgICAgICAgICAgcmV0dXJuIEtleXNEaXJlY3Rpb24uVkVSVElDQUw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0cy5LZXlzVXRpbGl0aWVzID0gS2V5c1V0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTaWRlVXRpbGl0aWVzID0gZXhwb3J0cy5QbGF5ZXJTaWRlID0gdm9pZCAwO1xudmFyIFBsYXllclNpZGU7XG4oZnVuY3Rpb24gKFBsYXllclNpZGUpIHtcbiAgICBQbGF5ZXJTaWRlW1wiTEVGVFwiXSA9IFwiTEVGVFwiO1xuICAgIFBsYXllclNpZGVbXCJSSUdIVFwiXSA9IFwiUklHSFRcIjtcbn0pKFBsYXllclNpZGUgfHwgKGV4cG9ydHMuUGxheWVyU2lkZSA9IFBsYXllclNpZGUgPSB7fSkpO1xuY2xhc3MgUGxheWVyU2lkZVV0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldE9wcG9zaXRlU2lkZShzaWRlKSB7XG4gICAgICAgIHJldHVybiBzaWRlID09PSBQbGF5ZXJTaWRlLkxFRlQgPyBQbGF5ZXJTaWRlLlJJR0hUIDogUGxheWVyU2lkZS5MRUZUO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyU2lkZVV0aWxpdGllcyA9IFBsYXllclNpZGVVdGlsaXRpZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyU3RhdHVzID0gdm9pZCAwO1xudmFyIFBsYXllclN0YXR1cztcbihmdW5jdGlvbiAoUGxheWVyU3RhdHVzKSB7XG4gICAgUGxheWVyU3RhdHVzW1wiTk9STUFMXCJdID0gXCJOT1JNQUxcIjtcbiAgICBQbGF5ZXJTdGF0dXNbXCJTVFVOTkVEXCJdID0gXCJTVFVOTkVEXCI7XG59KShQbGF5ZXJTdGF0dXMgfHwgKGV4cG9ydHMuUGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb3dlclNob3RVdGlsaXRpZXMgPSBleHBvcnRzLlBvd2VyU2hvdFR5cGUgPSB2b2lkIDA7XG52YXIgUG93ZXJTaG90VHlwZTtcbihmdW5jdGlvbiAoUG93ZXJTaG90VHlwZSkge1xuICAgIFBvd2VyU2hvdFR5cGVbXCJGSVJFXCJdID0gXCJGSVJFXCI7XG4gICAgUG93ZXJTaG90VHlwZVtcIkVMRUNUUklDXCJdID0gXCJFTEVDVFJJQ1wiO1xufSkoUG93ZXJTaG90VHlwZSB8fCAoZXhwb3J0cy5Qb3dlclNob3RUeXBlID0gUG93ZXJTaG90VHlwZSA9IHt9KSk7XG5jbGFzcyBQb3dlclNob3RVdGlsaXRpZXMge1xuICAgIHN0YXRpYyBnZXRQb3dlclNob3RUeXBlKGNvbG9ySW5kZXgpIHtcbiAgICAgICAgc3dpdGNoIChjb2xvckluZGV4KSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGUuRklSRTtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZS5FTEVDVFJJQztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGUuRklSRTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZ2V0U3BlZWRGYWN0b3IocG93ZXJTaG90VHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5GSVJFOlxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkVMRUNUUklDOlxuICAgICAgICAgICAgICAgIHJldHVybiAxLjI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBzaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UocG93ZXJTaG90VHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5GSVJFOlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5FTEVDVFJJQzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIHNob3VsZE1vdmVUb0dvYWwocG93ZXJTaG90VHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5GSVJFOlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5FTEVDVFJJQzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Qb3dlclNob3RVdGlsaXRpZXMgPSBQb3dlclNob3RVdGlsaXRpZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gdm9pZCAwO1xuY2xhc3MgQm9yZGVyTGltaXRzIHtcbiAgICBjb25zdHJ1Y3RvcihsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pIHtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcbiAgICAgICAgdGhpcy5yaWdodCA9IHJpZ2h0O1xuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcbiAgICAgICAgdGhpcy5ib3R0b20gPSBib3R0b207XG4gICAgfVxuICAgIGlzUG9pbnRJbnNpZGUocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludC54ID49IHRoaXMubGVmdCAmJlxuICAgICAgICAgICAgcG9pbnQueCA8PSB0aGlzLnJpZ2h0ICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMudG9wICYmXG4gICAgICAgICAgICBwb2ludC55IDw9IHRoaXMuYm90dG9tKTtcbiAgICB9XG59XG5leHBvcnRzLkJvcmRlckxpbWl0cyA9IEJvcmRlckxpbWl0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5EaW1lbnNpb25zID0gdm9pZCAwO1xuY2xhc3MgRGltZW5zaW9ucyB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH1cbn1cbmV4cG9ydHMuRGltZW5zaW9ucyA9IERpbWVuc2lvbnM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRQb2ludCA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi9Qb2ludFwiKTtcbmNsYXNzIE1vdmVtZW50UG9pbnQge1xuICAgIHN0YXRpYyBhcmVUb3VjaGluZyhwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShwb2ludDEucG9zaXRpb24sIHBvaW50Mi5wb3NpdGlvbikgPCBwb2ludDEuc2l6ZSArIHBvaW50Mi5zaXplO1xuICAgIH1cbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgdmVsb2NpdHksIGFjY2VsZXJhdGlvbiwgc2l6ZSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgdGhpcy5hY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb247XG4gICAgICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgfVxuICAgIHVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbi54ICs9IHRoaXMudmVsb2NpdHkueCAqIGRlbHRhTXM7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueSArPSB0aGlzLnZlbG9jaXR5LnkgKiBkZWx0YU1zO1xuICAgIH1cbiAgICBwcm9qZWN0VG9GaW5hbFBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5jYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHRoaXMucG9zaXRpb24ueCwgdGhpcy52ZWxvY2l0eS54KSwgdGhpcy5jYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHRoaXMucG9zaXRpb24ueSwgdGhpcy52ZWxvY2l0eS55KSk7XG4gICAgfVxuICAgIGdldFNwZWVkKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMudmVsb2NpdHkueCwgMikgKyBNYXRoLnBvdyh0aGlzLnZlbG9jaXR5LnksIDIpKTtcbiAgICB9XG4gICAgZ2V0U3BlZWRBbmdsZSgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy52ZWxvY2l0eS55LCB0aGlzLnZlbG9jaXR5LngpO1xuICAgIH1cbiAgICBhZGp1c3RUb01heFNwZWVkKG1heFNwZWVkKSB7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gTWF0aC5taW4odGhpcy5nZXRTcGVlZCgpLCBtYXhTcGVlZCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gdGhpcy5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueCA9IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnkgPSBNYXRoLnNpbihhbmdsZSkgKiBzcGVlZDtcbiAgICB9XG4gICAgc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKSB7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueCA9IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnkgPSBNYXRoLnNpbihhbmdsZSkgKiBzcGVlZDtcbiAgICB9XG4gICAgZGVjcmVtZW50U3BlZWQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTcGVlZCA9IE1hdGgubWF4KGN1cnJlbnRTcGVlZCAtIHRoaXMuYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS54ICo9IHJhdGlvO1xuICAgICAgICAgICAgdGhpcy52ZWxvY2l0eS55ICo9IHJhdGlvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNsb25lKCkge1xuICAgICAgICByZXR1cm4gbmV3IE1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQodGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLnZlbG9jaXR5LngsIHRoaXMudmVsb2NpdHkueSksIHRoaXMuYWNjZWxlcmF0aW9uLCB0aGlzLnNpemUpO1xuICAgIH1cbiAgICBjYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHBvc2l0aW9uLCBzcGVlZCkge1xuICAgICAgICB3aGlsZSAoTWF0aC5hYnMoc3BlZWQpID4gMCkge1xuICAgICAgICAgICAgcG9zaXRpb24gKz0gc3BlZWQ7XG4gICAgICAgICAgICBzcGVlZCA9IE1hdGguc2lnbihzcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhzcGVlZCkgLSB0aGlzLmFjY2VsZXJhdGlvbiwgMCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3BlZWQpIDw9IHRoaXMuYWNjZWxlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3BlZWQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSBNb3ZlbWVudFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5Qb2ludHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocG9pbnQyLnkgLSBwb2ludDEueSwgcG9pbnQyLnggLSBwb2ludDEueCk7XG4gICAgfVxuICAgIHN0YXRpYyBhcmVQb2ludEVxdWFscyhwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gcG9pbnQxLnggPT09IHBvaW50Mi54ICYmIHBvaW50MS55ID09PSBwb2ludDIueTtcbiAgICB9XG59XG5leHBvcnRzLlBvaW50ID0gUG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSGlzdG9yeVBvaW50ID0gZXhwb3J0cy5Qb3NpdGlvbkhpc3RvcnkgPSB2b2lkIDA7XG5jbGFzcyBQb3NpdGlvbkhpc3Rvcnkge1xuICAgIGNvbnN0cnVjdG9yKHJldGVudGlvblRpbWUpIHtcbiAgICAgICAgdGhpcy5yZXRlbnRpb25UaW1lID0gcmV0ZW50aW9uVGltZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgYWRkUG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgSGlzdG9yeVBvaW50KHBvc2l0aW9uLCAwKSk7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLmZvckVhY2gocCA9PiAocC5kZWx0YSArPSBkZWx0YU1zKSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gdGhpcy5wb3NpdGlvbnMuZmlsdGVyKHAgPT4gcC5kZWx0YSA8IHRoaXMucmV0ZW50aW9uVGltZSk7XG4gICAgfVxuICAgIGdldEZhY3RvcihpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbnNbaW5kZXhdLmdldEZhY3Rvcih0aGlzLnJldGVudGlvblRpbWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuUG9zaXRpb25IaXN0b3J5ID0gUG9zaXRpb25IaXN0b3J5O1xuY2xhc3MgSGlzdG9yeVBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgZGVsdGEpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLmRlbHRhID0gZGVsdGE7XG4gICAgfVxuICAgIGdldEZhY3RvcihyZXRlbnRpb25UaW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbHRhIC8gcmV0ZW50aW9uVGltZTtcbiAgICB9XG59XG5leHBvcnRzLkhpc3RvcnlQb2ludCA9IEhpc3RvcnlQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEV2ZW50QnVzVXRpbGl0aWVzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEdhbWVTdGF0dXNNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihidXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgICAgIHRoaXMuY3VycmVudFN0YXR1c1RpbWUgPSAwO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmJ1cyA9IGJ1cztcbiAgICB9XG4gICAgY2hhbmdlU3RhdHVzKGdhbWVTdGF0dXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IGdhbWVTdGF0dXM7XG4gICAgICAgIHRoaXMuY3VycmVudFN0YXR1c1RpbWUgPSAwO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RhdHVzVGltZSA8IDMwMDtcbiAgICB9XG4gICAgc2NoZWR1bGVTdGF0dXNDaGFuZ2UoZGVsYXksIGdhbWVTdGF0dXMpIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdFdmVudCA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbmQoZSA9PiBlLmdhbWVTdGF0dXMgPT09IGdhbWVTdGF0dXMpO1xuICAgICAgICBpZiAoIWV4aXN0aW5nRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIHRpbWU6IHRoaXMudGltZSArIGRlbGF5LFxuICAgICAgICAgICAgICAgIGdhbWVTdGF0dXM6IGdhbWVTdGF0dXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy50aW1lICs9IGRlbHRhO1xuICAgICAgICB0aGlzLmN1cnJlbnRTdGF0dXNUaW1lICs9IGRlbHRhO1xuICAgICAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy5zY2hlZHVsZWRFdmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWUgPj0gZS50aW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VTdGF0dXMoZS5nYW1lU3RhdHVzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1cy5wdWJsaXNoKEV2ZW50QnVzVXRpbGl0aWVzXzEuRXZlbnRCdXNVdGlsaXRpZXMuc3RhdHVzQ2hhbmdlZEV2ZW50KHRoaXMuZ2FtZVN0YXR1cykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzID0gdGhpcy5zY2hlZHVsZWRFdmVudHMuZmlsdGVyKGUgPT4gdGhpcy50aW1lIDwgZS50aW1lKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gR2FtZVN0YXR1c01hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jbGFzcyBTY29yZU1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxlZnRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMucmlnaHRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZUR1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5sYXN0U2lkZVVwZGF0ZWQgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICB0aGlzLm1heFNjb3JlID0gMTA7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uR29hbHMgPSAzO1xuICAgIH1cbiAgICBpbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0U2NvcmUrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVmdFNjb3JlKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlRHVyYXRpb24gPSAwO1xuICAgICAgICB0aGlzLmxhc3RTaWRlVXBkYXRlZCA9IHBsYXllclNpZGU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGVEdXJhdGlvbiArPSBkZWx0YTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMubGVmdFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5yaWdodFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlRHVyYXRpb24gPSAwO1xuICAgIH1cbiAgICBnZXRTY29yZUFzQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IFN0cmluZyh0aGlzLmxlZnRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpICsgU3RyaW5nKHRoaXMucmlnaHRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICByZXR1cm4gb3V0cHV0U3RyaW5nLnNwbGl0KFwiXCIpLm1hcChOdW1iZXIpO1xuICAgIH1cbiAgICBzaG91bGRBbmltYXRlSW5kZXgoaW5kZXgpIHtcbiAgICAgICAgaWYgKHRoaXMubGFzdFNpZGVVcGRhdGVkID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAyO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldExhc3RVcGRhdGVEdXJhdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGFzdFVwZGF0ZUR1cmF0aW9uO1xuICAgIH1cbiAgICBnZXQgaXNHYW1lT3ZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdFNjb3JlID09PSB0aGlzLm1heFNjb3JlIHx8IHRoaXMucmlnaHRTY29yZSA9PT0gdGhpcy5tYXhTY29yZTtcbiAgICB9XG4gICAgZ2V0V2lubmluZ1BsYXllclNpZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmxlZnRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5yaWdodFNjb3JlID09PSB0aGlzLm1heFNjb3JlKSB7XG4gICAgICAgICAgICByZXR1cm4gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc1N1YnN0aXR1dGlvblRpbWUoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsU2NvcmUgPSB0aGlzLmxlZnRTY29yZSArIHRoaXMucmlnaHRTY29yZTtcbiAgICAgICAgcmV0dXJuIHRvdGFsU2NvcmUgPiAwICYmIHRvdGFsU2NvcmUgJSB0aGlzLnN1YnN0aXR1dGlvbkdvYWxzID09PSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVNYW5hZ2VyID0gU2NvcmVNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEdhdGVTeXN0ZW0ge1xuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgZ2FtZVdvcmxkLmdhdGVzLnVwZGF0ZShkZWx0YU1zLCBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTik7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlU3lzdGVtID0gR2F0ZVN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlclwiKTtcbmNvbnN0IENoZWNrZXJTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NoZWNrZXJzL0NoZWNrZXJTeXN0ZW1cIik7XG5jb25zdCBDb2xsaXNpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW1cIik7XG5jb25zdCBHYXRlU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9HYXRlU3lzdGVtXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL21vdmVtZW50L01vdmVtZW50U3lzdGVtXCIpO1xuY2xhc3MgTWFpblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IEdhdGVTeXN0ZW1fMS5HYXRlU3lzdGVtKCkpO1xuICAgICAgICB0aGlzLnN5c3RlbXMucHVzaChuZXcgQ2hlY2tlclN5c3RlbV8xLkNoZWNrZXJTeXN0ZW0oKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLmZvckVhY2goc3lzdGVtID0+IHN5c3RlbS51cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluU3lzdGVtID0gTWFpblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1N1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1dhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XCIpO1xuY2xhc3MgQ2hlY2tlclN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3lfMS5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSgpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgX2RlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkKSk7XG4gICAgfVxufVxuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gQ2hlY2tlclN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYXJlQWxsUGxheWVyc0luSW5pdGlhbFBvc2l0aW9uID0gZ2FtZVdvcmxkLnBsYXllcnMuZXZlcnkocGxheWVyID0+IHtcbiAgICAgICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmFyZVBvaW50RXF1YWxzKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBwbGF5ZXIuaW5pdGlhbFBvc2l0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChhcmVBbGxQbGF5ZXJzSW5Jbml0aWFsUG9zaXRpb24pIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5ID0gU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBXYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTDtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGFyZUFsbFBsYXllcnNJblBvc2l0aW9uID0gZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmV2ZXJ5KHBsYXllciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpc0JhbGxTdG9wcGVkID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID09PSAwO1xuICAgICAgICBpZiAoYXJlQWxsUGxheWVyc0luUG9zaXRpb24gJiYgaXNCYWxsU3RvcHBlZCkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKDE1MDAsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSA9IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9QbGF5ZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIENvbGxpc2lvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5XzEuQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llc1xuICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gQ29sbGlzaW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEJvcmRlckxpbWl0c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L0JvcmRlckxpbWl0c1wiKTtcbmNsYXNzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgZ2V0RmllbGRCb3JkZXJMaW1pdHMoc2l6ZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoIC0gc2l6ZSwgY2ZnLmZpZWxkQm9yZGVyU2l6ZSArIHNpemUsIGNmZy5maWVsZEhlaWdodCAtIGNmZy5maWVsZEJvcmRlclNpemUgLSBzaXplKTtcbiAgICB9XG4gICAgaGFuZGxlQm9yZGVyQ29sbGlzaW9uKG1vdmVtZW50UG9pbnQsIGJvcmRlckxpbWl0cywgaW52ZXJ0U3BlZWQsIGF2b2lkQm91bmNlT25Hb2FsID0gdHJ1ZSwgYXZvaWRCb3VuY2VPblN1YnN0aXR1dGlvbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IGlzSW5Hb2FsWVJhbmdlID0gIWF2b2lkQm91bmNlT25Hb2FsICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPj0gY2ZnLmdvYWxZT2Zmc2V0ICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPD0gY2ZnLmdvYWxZT2Zmc2V0ICsgY2ZnLmdvYWxIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGlzSW5TdWJzdGl0dXRpb25ZUmFuZ2UgPSBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uICYmXG4gICAgICAgICAgICAoKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+PSBjZmcucGxheWVyU3Vic3RpdHV0aW9uWCAtIGNmZy5nYXRlc0xlbmd0aCAvIDIgJiZcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPD0gY2ZnLnBsYXllclN1YnN0aXR1dGlvblggKyBjZmcuZ2F0ZXNMZW5ndGggLyAyKSB8fFxuICAgICAgICAgICAgICAgIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPj0gY2ZnLmNwdVN1YnN0aXR1dGlvblggLSBjZmcuZ2F0ZXNMZW5ndGggLyAyICYmXG4gICAgICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8PSBjZmcuY3B1U3Vic3RpdHV0aW9uWCArIGNmZy5nYXRlc0xlbmd0aCAvIDIpKTtcbiAgICAgICAgbGV0IGhhc0NvbGxpZGVkID0gZmFsc2U7XG4gICAgICAgIGlmICghaXNJbkdvYWxZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54IDwgYm9yZGVyTGltaXRzLmxlZnQpIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA9IGJvcmRlckxpbWl0cy5sZWZ0O1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGgubWF4KDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0luR29hbFlSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPiBib3JkZXJMaW1pdHMucmlnaHQpIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA9IGJvcmRlckxpbWl0cy5yaWdodDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5taW4oMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi55IDwgYm9yZGVyTGltaXRzLnRvcCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLnRvcDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLm1heCgwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJblN1YnN0aXR1dGlvbllSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPiBib3JkZXJMaW1pdHMuYm90dG9tKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMuYm90dG9tO1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLm1pbigwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNDb2xsaWRlZDtcbiAgICB9XG4gICAgZ2V0R29hbEJvcmRlckxpbWl0cyhzaXplLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IHRvcCA9IGNmZy5nb2FsWU9mZnNldCArIHNpemU7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IGNmZy5nb2FsWU9mZnNldCArIGNmZy5nb2FsSGVpZ2h0IC0gc2l6ZTtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKHNpemUsIGNmZy5maWVsZFhPZmZzZXQgLSBzaXplLCB0b3AsIGJvdHRvbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoICsgc2l6ZSwgY2ZnLndpZHRoIC0gc2l6ZSwgdG9wLCBib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSA9IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICB0aGlzLmhhbmRsZUJvcmRlckNvbGxpc2lvbihiYWxsTW92ZW1lbnQsIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUpLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpO1xuICAgIH1cbiAgICBjaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIGNvbnN0IGdvYWxCb3JkZXIgPSB0aGlzLmdldEdvYWxCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUsIHBsYXllclNpZGUpO1xuICAgICAgICBpZiAoZ29hbEJvcmRlci5pc1BvaW50SW5zaWRlKGJhbGxNb3ZlbWVudC5wb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5pbmNyZWFzZVNjb3JlKFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlVXRpbGl0aWVzLmdldE9wcG9zaXRlU2lkZShwbGF5ZXJTaWRlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICBsZXQgc2lkZSA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgICAgIGlmIChiYWxsTW92ZW1lbnQucG9zaXRpb24ueCA+XG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDIpIHtcbiAgICAgICAgICAgIHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBnb2FsQm9yZGVyID0gdGhpcy5nZXRHb2FsQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplLCBzaWRlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24oYmFsbE1vdmVtZW50LCBnb2FsQm9yZGVyLCB0cnVlLCB0cnVlKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgcG9zaXRpb24pIDxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNpemUgKyBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuZ2xlID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgcG9zaXRpb24pIC0gTWF0aC5QSTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSwgYW5nbGUpO1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnggKyBNYXRoLmNvcyhhbmdsZSkgKiBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cztcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi55ICsgTWF0aC5zaW4oYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFBvd2VyU2hvdC5zaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UoKSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmF0dGFjaFRvUGxheWVyKHBsYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgICFnYW1lV29ybGQuYmFsbC5iYWxsUG93ZXJTaG90LnNob3VsZFN0b3BPblBsYXllckJvdW5jZSgpKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBpZiAoTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQuYXJlVG91Y2hpbmcoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbiwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWlkZGxlUG9pbnQgPSBuZXcgUG9pbnRfMS5Qb2ludCgoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkgL1xuICAgICAgICAgICAgICAgICAgICAyLCAoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgICAgICAyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKG1pZGRsZVBvaW50LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpLCBhbmdsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneSA9IEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF2b2lkQm91bmNlT25TdWJzdGl0dXRpb24gPSBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTjtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbGxpZGVkID0gdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24ocGxheWVyLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSksIGZhbHNlLCB0cnVlLCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChoYXNDb2xsaWRlZCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zdGFydEJvdW5jaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoX2dhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGh1bWFuUGxheWVyID0gZ2FtZVdvcmxkLnBsYXllcnMuZmluZChwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgIXBsYXllci5pc0NwdSk7XG4gICAgICAgIGNvbnN0IGNwdVBsYXllciA9IGdhbWVXb3JsZC5wbGF5ZXJzLmZpbmQocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIHBsYXllci5pc0NwdSk7XG4gICAgICAgIGlmIChodW1hblBsYXllciA9PT0gdW5kZWZpbmVkIHx8IGNwdVBsYXllciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24sIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKSB7XG4gICAgICAgICAgICAgICAgaHVtYW5QbGF5ZXIuc3R1bm5lZFdyYXBwZXIudXBkYXRlU3R1bm5lZFZhbHVlKGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpO1xuICAgICAgICAgICAgICAgIGNwdVBsYXllci5zdHVubmVkV3JhcHBlci51cGRhdGVTdHVubmVkVmFsdWUoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAyLCAoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgIDIpO1xuICAgICAgICAgICAgaHVtYW5QbGF5ZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICAgICAgY3B1UGxheWVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpc2lvblNwZWVkID0gKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpIC9cbiAgICAgICAgICAgICAgICAyO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGh1bWFuUGxheWVyLCBjcHVQbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoY3B1UGxheWVyLCBodW1hblBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhpbnRlcnNlY3Rpb25Qb2ludCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgYmFsbC5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBib3VuY2VQbGF5ZXJzKHBsYXllcjEsIHBsYXllcjIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgaW50ZXJzZWN0aW9uUG9pbnQpIC1cbiAgICAgICAgICAgIE1hdGguUEk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChjb2xsaXNpb25TcGVlZCwgYW5nbGUpO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBpbnRlcnNlY3Rpb25Qb2ludC54ICsgTWF0aC5jb3MoYW5nbGUpICogcGxheWVyMi5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnkgKyBNYXRoLnNpbihhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL01vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL1dhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBNZW51TW92ZW1lbnRTdHJhdGVneV8xLk1lbnVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgLy90aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgQ3B1TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFdpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneV8xLlN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5XzEuTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICAgICAgdGhpcy51cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgfVxuICAgIHVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICAgICAgcGxheWVyLnN0dW5uZWRXcmFwcGVyLmRlY3JlbWVudFN0dW5uZWRWYWx1ZShkZWx0YU1zKTtcbiAgICAgICAgICAgIHBsYXllci51cGRhdGVQb3dlclNob3QoZGVsdGFNcyk7XG4gICAgICAgICAgICBwbGF5ZXIuYm91bmNlV3JhcHBlci51cGRhdGUoZGVsdGFNcyk7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkLmJhbGwsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICBnYW1lV29ybGQuYmFsbC51cGRhdGVUcmFqZWN0b3J5KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSBNb3ZlbWVudFN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBiYWxsLmF0dGFjaGVkUGxheWVyO1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIgIT09IG51bGwgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5kZXRhY2hGcm9tUGxheWVyKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuYW5nbGVUb2xsZXJhbmNlID0gTWF0aC5QSSAvIDMwO1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgIXRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgaWYgKHBsYXllciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRqdXN0QmFsbFBvc2l0aW9uQXJvdW5kUGxheWVyKGJhbGwsIHBsYXllciwgZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRTaXplID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSArIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICsgTWF0aC5QSTtcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlRGlmZmVyZW5jZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGFyZ2V0QW5nbGUgLSBiYWxsLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYW5nbGVEaWZmZXJlbmNlKSA+IHRoaXMuYW5nbGVUb2xsZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IChzcGVlZCAvIHBsYXllci5ub3JtYWxNYXhTcGVlZCkgKiAwLjAxICogZGVsdGFNcztcbiAgICAgICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciArPSBhbmdsZURpZmZlcmVuY2UgPiAwID8gc3RlcCA6IC1zdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgPSB0YXJnZXRBbmdsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyID0gdGhpcy5ub3JtYWxpemVBbmdsZShiYWxsLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9ybWFsaXplQW5nbGUoYW5nbGUpIHtcbiAgICAgICAgd2hpbGUgKGFuZ2xlID4gTWF0aC5QSSkge1xuICAgICAgICAgICAgYW5nbGUgLT0gMiAqIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGFuZ2xlIDwgLU1hdGguUEkpIHtcbiAgICAgICAgICAgIGFuZ2xlICs9IDIgKiBNYXRoLlBJO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbmdsZTtcbiAgICB9XG59XG5leHBvcnRzLkF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmJhbGxSb3RhdGVPZmZzZXQgPSAyNTA7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5taW5Hb2FsRGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDUwO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgYmFsbC5iYWxsUG93ZXJTaG90LnNob3VsZE1vdmVUb0dvYWwoKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSB0aGlzLmdldERpcmVjdGlvbkRpc3RhbmNlKGJhbGwsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkpO1xuICAgICAgICBpZiAoZGlzdGFuY2UgPiB0aGlzLm1pbkdvYWxEaXN0YW5jZSkge1xuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2UxID0gdGhpcy5nZXREaXJlY3Rpb25EaXN0YW5jZShiYWxsLCBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICsgTWF0aC5QSSAvIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCk7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZTIgPSB0aGlzLmdldERpcmVjdGlvbkRpc3RhbmNlKGJhbGwsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgLSBNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KTtcbiAgICAgICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChiYWxsLm1heFNwZWVkICpcbiAgICAgICAgICAgICAgICBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLmdldFNwZWVkRmFjdG9yKGJhbGwuYmFsbFBvd2VyU2hvdC5nZXRQb3dlclNob3RUeXBlKCkpLCBkaXN0YW5jZTEgPCBkaXN0YW5jZTJcbiAgICAgICAgICAgICAgICA/IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgK1xuICAgICAgICAgICAgICAgICAgICAoTWF0aC5QSSAvIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCkgKiBkZWx0YU1zXG4gICAgICAgICAgICAgICAgOiBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpIC1cbiAgICAgICAgICAgICAgICAgICAgKE1hdGguUEkgLyB0aGlzLmJhbGxSb3RhdGVPZmZzZXQpICogZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbFNwZWVkQW5nbGUpIHtcbiAgICAgICAgY29uc3QgZGVzdGluYXRpb25YID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgKGJhbGwuYmFsbFBvd2VyU2hvdC5nZXRQb3dlclNob3REZXN0aW5hdGlvblNpZGUoKSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgICAgIDogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoKTtcbiAgICAgICAgY29uc3QgZGVzdGluYXRpb25ZID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDI7XG4gICAgICAgIGxldCBkaXN0ID0gUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIG5ldyBQb2ludF8xLlBvaW50KGRlc3RpbmF0aW9uWCwgZGVzdGluYXRpb25ZKSk7XG4gICAgICAgIGNvbnN0IG5ld1ggPSBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIE1hdGguY29zKGJhbGxTcGVlZEFuZ2xlKSAqIGRpc3Q7XG4gICAgICAgIGNvbnN0IG5ld1kgPSBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArIE1hdGguc2luKGJhbGxTcGVlZEFuZ2xlKSAqIGRpc3Q7XG4gICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKG5ldyBQb2ludF8xLlBvaW50KG5ld1gsIG5ld1kpLCBuZXcgUG9pbnRfMS5Qb2ludChkZXN0aW5hdGlvblgsIGRlc3RpbmF0aW9uWSkpO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kgPSBNb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBiYWxsLnNldEZvclN0YXJ0R2FtZSgpO1xuICAgICAgICBiYWxsLm1vdmUoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQoX2JhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT04pO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApIHtcbiAgICAgICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGJhbGwucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY2xhc3MgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICAhcGxheWVyLmlzQ3B1ICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBob3Jpem9udGFsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLkhPUklaT05UQUwpO1xuICAgICAgICBjb25zdCB2ZXJ0aWNhbEtleSA9IHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuZ2V0RGlyZWN0aW9uUHJlc3NlZChLZXlzXzEuS2V5c0RpcmVjdGlvbi5WRVJUSUNBTCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LngsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgaG9yaXpvbnRhbEtleSwgS2V5c18xLktleXMuQVJST1dfTEVGVCwgS2V5c18xLktleXMuQVJST1dfUklHSFQpO1xuICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55ID0gdGhpcy5hcHBseUF4aXNNb3ZlbWVudChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24sIGRlbHRhTXMsIHZlcnRpY2FsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19VUCwgS2V5c18xLktleXMuQVJST1dfRE9XTik7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFkanVzdFRvTWF4U3BlZWQocGxheWVyLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIGFwcGx5QXhpc01vdmVtZW50KGN1cnJlbnRTcGVlZCwgYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBrZXksIG5lZ2F0aXZlS2V5LCBwb3NpdGl2ZUtleSkge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgIGlmIChrZXkgPT09IG5lZ2F0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCAtIGRlbHRhO1xuICAgICAgICBpZiAoa2V5ID09PSBwb3NpdGl2ZUtleSlcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3BlZWQgKyBkZWx0YTtcbiAgICAgICAgcmV0dXJuIE1hdGguc2lnbihjdXJyZW50U3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoY3VycmVudFNwZWVkKSAtIGRlbHRhLCAwKTtcbiAgICB9XG59XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNZW51TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBsZXQgeCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAoKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoKSAvIDI7XG4gICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgeCArPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgeSA9IChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQ7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCh4LCB5KSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9XG4gICAgICAgICAgICAgICAgKHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDUpICogTWF0aC5yYW5kb20oKSArIHBsYXllci5ub3JtYWxNYXhTcGVlZCAvIDc7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWVudU1vdmVtZW50U3RyYXRlZ3kgPSBNZW51TW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY2xhc3MgU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICAodGhpcy5pc1BsYXllclN0dW5uZWREdXJpbmdQbGF5KHBsYXllciwgZ2FtZVdvcmxkKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuaGFzUGxheWVyTG9zZWRHYW1lKHBsYXllciwgZ2FtZVdvcmxkKSkpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FKSB7XG4gICAgICAgICAgICBwbGF5ZXIuc3R1bm5lZFdyYXBwZXIuZm9yY2VTdHVubmVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPiBwbGF5ZXIuY3VycmVudE1heFNwZWVkIC8gNSkge1xuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5jdXJyZW50TWF4U3BlZWQgLyAxNTtcbiAgICAgICAgICAgIGxldCBhbmdsZSA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKTtcbiAgICAgICAgICAgIGFuZ2xlID0gYW5nbGUgKyAoTWF0aC5QSSAvIDMwKSAqIGRlbHRhTXMgKiAwLjA1O1xuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc1BsYXllclN0dW5uZWREdXJpbmdQbGF5KHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEKTtcbiAgICB9XG4gICAgaGFzUGxheWVyTG9zZWRHYW1lKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IHdpbm5pbmdQbGF5ZXJTaWRlID0gZ2FtZVdvcmxkLnNjb3JlLmdldFdpbm5pbmdQbGF5ZXJTaWRlKCk7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FICYmXG4gICAgICAgICAgICB3aW5uaW5nUGxheWVyU2lkZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgd2lubmluZ1BsYXllclNpZGUgIT09IHBsYXllci5zaWRlKTtcbiAgICB9XG59XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJEZXN0aW5hdGlvblBvaW50TWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnN1YlBvc2l0aW9uc01hcC5zZXQoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgdGhpcy5nZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCkpO1xuICAgICAgICB0aGlzLnN1YlBvc2l0aW9uc01hcC5zZXQoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIHRoaXMuZ2V0U3Vic3RpdHV0aW9uRGVzdGluYXRpb25zKFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OICYmICFwbGF5ZXIuaXNTdWJzdGl0dXRlKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5pc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZXN0aW5hdGlvbkxpc3QgPSB0aGlzLnN1YlBvc2l0aW9uc01hcC5nZXQocGxheWVyLnNpZGUpO1xuICAgICAgICBpZiAoZGVzdGluYXRpb25MaXN0ID09PSB1bmRlZmluZWQgfHwgZGVzdGluYXRpb25MaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkZXN0aW5hdGlvblBvaW50ID0gdGhpcy5wbGF5ZXJEZXN0aW5hdGlvblBvaW50TWFwLmdldChwbGF5ZXIpO1xuICAgICAgICBpZiAoZGVzdGluYXRpb25Qb2ludCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblBvaW50ID0gZGVzdGluYXRpb25MaXN0WzBdO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJEZXN0aW5hdGlvblBvaW50TWFwLnNldChwbGF5ZXIsIGRlc3RpbmF0aW9uUG9pbnQpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPSAocGxheWVyLm5vcm1hbE1heFNwZWVkICogMikgLyAzO1xuICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChkZXN0aW5hdGlvblBvaW50LnBvaW50LCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblBvaW50LmFjdGlvbihwbGF5ZXIsIGdhbWVXb3JsZCk7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGRlc3RpbmF0aW9uTGlzdC5maW5kSW5kZXgoZGVzdGluYXRpb25Qb2ludCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuYXJlUG9pbnRFcXVhbHMoZGVzdGluYXRpb25Qb2ludC5wb2ludCwgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbmRleCA8IGRlc3RpbmF0aW9uTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJEZXN0aW5hdGlvblBvaW50TWFwLnNldChwbGF5ZXIsIGRlc3RpbmF0aW9uTGlzdFtpbmRleCArIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4ID49IGRlc3RpbmF0aW9uTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJEZXN0aW5hdGlvblBvaW50TWFwLnNldChwbGF5ZXIsIG5ldyBQb2ludFdpdGhBY3Rpb24ocGxheWVyLmluaXRpYWxQb3NpdGlvbiwgKCkgPT4geyB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0U3Vic3RpdHV0aW9uRGVzdGluYXRpb25zKHBsYXllclNpZGUpIHtcbiAgICAgICAgY29uc3QgeCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgIChwbGF5ZXJTaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgPyB0aGlzLmdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFhcbiAgICAgICAgICAgICAgICA6IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIHRoaXMuZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBuZXcgUG9pbnRXaXRoQWN0aW9uKG5ldyBQb2ludF8xLlBvaW50KHgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLSB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyIC8gMiksICgpID0+IHsgfSksXG4gICAgICAgICAgICBuZXcgUG9pbnRXaXRoQWN0aW9uKG5ldyBQb2ludF8xLlBvaW50KHgsIHRoaXMuZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0KSwgKHBsYXllciwgZ2FtZVdvcmxkKSA9PiB7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLnN3aXRjaFBsYXllckNvbG9yKHBsYXllci5zaWRlKTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbmV3IFBvaW50V2l0aEFjdGlvbihuZXcgUG9pbnRfMS5Qb2ludCh4LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlciksICgpID0+IHsgfSksXG4gICAgICAgIF07XG4gICAgfVxufVxuZXhwb3J0cy5TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3kgPSBTdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3k7XG5jbGFzcyBQb2ludFdpdGhBY3Rpb24ge1xuICAgIGNvbnN0cnVjdG9yKHBvaW50LCBhY3Rpb24pIHtcbiAgICAgICAgdGhpcy5wb2ludCA9IHBvaW50O1xuICAgICAgICB0aGlzLmFjdGlvbiA9IGFjdGlvbjtcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5pc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpKSB7XG4gICAgICAgICAgICBwbGF5ZXIucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLnNjb3JlLmdldFdpbm5pbmdQbGF5ZXJTaWRlKCkgPT09IHBsYXllci5zaWRlKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGg7XG4gICAgICAgICAgICBjb25zdCB5ID0gKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodDtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHgsIHkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICBwbGF5ZXIubm9ybWFsTWF4U3BlZWQgKiAyICogTWF0aC5yYW5kb20oKSArIHBsYXllci5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IFdpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVXb3JsZCA9IHZvaWQgMDtcbmNvbnN0IHRzX2J1c18xID0gcmVxdWlyZShcInRzLWJ1c1wiKTtcbmNvbnN0IEV2ZW50QnVzVXRpbGl0aWVzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXNcIik7XG5jb25zdCBCYWxsXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvQmFsbFwiKTtcbmNvbnN0IEV4cGxvc2lvbl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0V4cGxvc2lvblwiKTtcbmNvbnN0IEZpcmV3b3Jrc18xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0ZpcmV3b3Jrc1wiKTtcbmNvbnN0IEdhdGVfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9HYXRlXCIpO1xuY29uc3QgR29hbFBvc3RzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvR29hbFBvc3RzXCIpO1xuY29uc3QgTWVudUJ1dHRvbl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL01lbnVCdXR0b25cIik7XG5jb25zdCBQbGF5ZXJfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9QbGF5ZXJcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY29uc3QgR2FtZVN0YXR1c01hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9tYW5hZ2Vycy9HYW1lU3RhdHVzTWFuYWdlclwiKTtcbmNvbnN0IFNjb3JlTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL21hbmFnZXJzL1Njb3JlTWFuYWdlclwiKTtcbmNsYXNzIEdhbWVXb3JsZCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICB0aGlzLmdvYWxQb3N0cyA9IG5ldyBHb2FsUG9zdHNfMS5Hb2FsUG9zdHMoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlSHVtYW5QbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGwgPSBuZXcgQmFsbF8xLkJhbGwoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLmZpcmV3b3JrcyA9IG5ldyBGaXJld29ya3NfMS5GaXJld29ya3MoZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLmV4cGxvc2lvbiA9IG5ldyBFeHBsb3Npb25fMS5FeHBsb3Npb24oZ2FtZUNvbmZpZ3MpO1xuICAgICAgICB0aGlzLmdhdGVzID0gbmV3IEdhdGVfMS5HYXRlKCk7XG4gICAgICAgIGNvbnN0IGJ1cyA9IG5ldyB0c19idXNfMS5FdmVudEJ1cygpO1xuICAgICAgICB0aGlzLnNjb3JlID0gbmV3IFNjb3JlTWFuYWdlcl8xLlNjb3JlTWFuYWdlcigpO1xuICAgICAgICBjb25zdCBwbGF5SW1nID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICAgICAgdGhpcy5tZW51QnV0dG9uID0gbmV3IE1lbnVCdXR0b25fMS5NZW51QnV0dG9uKGdhbWVDb25maWdzLCBwbGF5SW1nLndpZHRoLCBwbGF5SW1nLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIgPSBuZXcgR2FtZVN0YXR1c01hbmFnZXJfMS5HYW1lU3RhdHVzTWFuYWdlcihidXMpO1xuICAgICAgICBidXMuc3Vic2NyaWJlKEV2ZW50QnVzVXRpbGl0aWVzXzEuRXZlbnRCdXNVdGlsaXRpZXMuc3RhdHVzQ2hhbmdlZEV2ZW50LCBldmVudCA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQucGF5bG9hZCA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRFbmRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpIHtcbiAgICAgICAgdGhpcy5zY29yZS5pbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpO1xuICAgICAgICBpZiAodGhpcy5zY29yZS5pc1N1YnN0aXR1dGlvblRpbWUoKSkge1xuICAgICAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgcGxheWVyLnJlc2V0T25Hb2FsKCk7XG4gICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci51cGRhdGVTY29yZWRHb2FsKHBsYXllclNpZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuYmFsbC5iYWxsUG93ZXJTaG90LmlzUG93ZXJTaG90KSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxvc2lvbi5hZGRFeHBsb3Npb24odGhpcy5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuYmFsbC5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdFR5cGUoKSA/PyBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VHlwZS5GSVJFKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhbGwucmVzZXRPbkdvYWwoKTtcbiAgICAgICAgaWYgKHRoaXMuc2NvcmUuaXNHYW1lT3Zlcikge1xuICAgICAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUpO1xuICAgICAgICAgICAgdGhpcy5maXJld29ya3MuaW5pdEZpcmV3b3JrcygpO1xuICAgICAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlci5zY2hlZHVsZVN0YXR1c0NoYW5nZShGaXJld29ya3NfMS5GaXJld29ya3MuYW5pbWF0aW9uVGltZSwgR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSk7XG4gICAgICAgICAgICB0aGlzLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgICAgIHBsYXllci5wb3dlclNob3RXcmFwcGVyLnJlc2V0UG93ZXJTaG90KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzd2l0Y2hQbGF5ZXJDb2xvcihwbGF5ZXJTaWRlKSB7XG4gICAgICAgIHRoaXMucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHBsYXllci5zaWRlID09PSBwbGF5ZXJTaWRlO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHBsYXllci5zd2l0Y2hDb2xvckluZGV4KCkpO1xuICAgIH1cbiAgICByZXNldEVuZEdhbWUoKSB7XG4gICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiBwbGF5ZXIucmVzZXRPbkdvYWwoKSk7XG4gICAgICAgIHRoaXMuYmFsbC5yZXNldE9uR29hbCgpO1xuICAgICAgICB0aGlzLnNjb3JlLnJlc2V0KCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lV29ybGQgPSBHYW1lV29ybGQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuS2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBLZXlzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgS2V5Ym9hcmRJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnByZXNzZWRLZXlzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLm9uS2V5RG93biA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkS2V5cy5hZGQoZXZlbnQua2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbktleVVwID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmRlbGV0ZShldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5RG93bik7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLm9uS2V5VXApO1xuICAgIH1cbiAgICBpc0tleVByZXNzZWQoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByZXNzZWRLZXlzLmhhcyhrZXkpO1xuICAgIH1cbiAgICBnZXREaXJlY3Rpb25QcmVzc2VkKGRpcmVjdGlvbikge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLnByZXNzZWRLZXlzKSB7XG4gICAgICAgICAgICBpZiAoS2V5c18xLktleXNVdGlsaXRpZXMuZ2V0S2V5RGlyZWN0aW9uKGtleSkgPT09IGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IEtleWJvYXJkSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTW91c2VJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbk1vdXNlTW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQsIGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljayk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IE1vdXNlSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5SZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBCYWxsUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0JhbGxSZW5kZXJcIik7XG5jb25zdCBCYWxsVHJhamVjdG9yeVJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9CYWxsVHJhamVjdG9yeVJlbmRlclwiKTtcbmNvbnN0IEV4cGxvc2lvblJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9FeHBsb3Npb25SZW5kZXJcIik7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9GaWVsZFJlbmRlclwiKTtcbmNvbnN0IEZpcmV3b3Jrc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9GaXJld29ya3NSZW5kZXJcIik7XG5jb25zdCBHYXRlc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9HYXRlc1JlbmRlclwiKTtcbmNvbnN0IE1lbnVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvTWVudVJlbmRlclwiKTtcbmNvbnN0IFBsYXllclBvd2VyU2hvdFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9QbGF5ZXJQb3dlclNob3RSZW5kZXJcIik7XG5jb25zdCBQbGF5ZXJSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvUGxheWVyUmVuZGVyXCIpO1xuY29uc3QgU2NvcmVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvU2NvcmVSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlciA9IGRvbUhhbmRsZXI7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGRvbUhhbmRsZXIuYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgQmFsbFRyYWplY3RvcnlSZW5kZXJfMS5CYWxsVHJhamVjdG9yeVJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgU2NvcmVSZW5kZXJfMS5TY29yZVJlbmRlcihkb21IYW5kbGVyLnNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEdhdGVzUmVuZGVyXzEuR2F0ZXNSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IFBsYXllclJlbmRlcl8xLlBsYXllclJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEJhbGxSZW5kZXJfMS5CYWxsUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBFeHBsb3Npb25SZW5kZXJfMS5FeHBsb3Npb25SZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCkpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgTWVudVJlbmRlcl8xLk1lbnVSZW5kZXIoZG9tSGFuZGxlci5tZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IFBsYXllclBvd2VyU2hvdFJlbmRlcl8xLlBsYXllclBvd2VyU2hvdFJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBhc3NldExvYWRlciwgZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEZpcmV3b3Jrc1JlbmRlcl8xLkZpcmV3b3Jrc1JlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0KSk7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLnJlbmRlcnMuZm9yRWFjaChyZW5kZXIgPT4gcmVuZGVyLnJlbmRlcihnYW1lV29ybGQpKTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlci5nYW1lQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMud2lkdGgsIHRoaXMuZG9tSGFuZGxlci5nYW1lQ2FudmFzLmhlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluUmVuZGVyID0gTWFpblJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBCYWxsUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhSZXNpemVGYWN0b3IgPSAyO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsID0gZ2FtZVdvcmxkLmJhbGw7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgfHxcbiAgICAgICAgICAgICgoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCB8fFxuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSB8fFxuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKSAmJlxuICAgICAgICAgICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54LCBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpKTtcbiAgICAgICAgICAgIGxldCByZXNpemVGYWN0b3IgPSAxO1xuICAgICAgICAgICAgaWYgKGJhbGwuYmFsbFN0YXR1cyAhPT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQpIHtcbiAgICAgICAgICAgICAgICByZXNpemVGYWN0b3IgPVxuICAgICAgICAgICAgICAgICAgICAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgLyBiYWxsLm1heFNwZWVkKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5tYXhSZXNpemVGYWN0b3IgLSAxKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zY2FsZShyZXNpemVGYWN0b3IsIDEpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYzMzMzXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzMzMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxSZW5kZXIgPSBCYWxsUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxUcmFqZWN0b3J5UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgQmFsbFRyYWplY3RvcnlSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy50cmFqZWN0b3J5TWF4RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDM7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbCA9IGdhbWVXb3JsZC5iYWxsO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiMxMTExMTFcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzExMTExMVwiO1xuICAgICAgICBiYWxsLnBvc2l0aW9uSGlzdG9yeS5wb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPCBiYWxsLnBvc2l0aW9uSGlzdG9yeS5wb3NpdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQb3NpdGlvbiA9IGJhbGwucG9zaXRpb25IaXN0b3J5LnBvc2l0aW9uc1tpbmRleCArIDFdO1xuICAgICAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHBvc2l0aW9uLnBvc2l0aW9uLCBuZXh0UG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFqZWN0b3J5TWF4RGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5nbG9iYWxBbHBoYSA9IDEgLSBiYWxsLnBvc2l0aW9uSGlzdG9yeS5nZXRGYWN0b3IoaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRoQm9yZGVyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb3NpdGlvbi5wb3NpdGlvbi54LCBwb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8obmV4dFBvc2l0aW9uLnBvc2l0aW9uLngsIG5leHRQb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxUcmFqZWN0b3J5UmVuZGVyID0gQmFsbFRyYWplY3RvcnlSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRXhwbG9zaW9uUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRXhwbG9zaW9uUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgZXhwbG9zaW9uID0gZ2FtZVdvcmxkLmV4cGxvc2lvbjtcbiAgICAgICAgZXhwbG9zaW9uLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgeCA9IGV4cGxvc2lvbi5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnQuYW5nbGUpICogY29tcG9uZW50LmdldEZhY3RvcigpICogZXhwbG9zaW9uLm1heERpc3RhbmNlO1xuICAgICAgICAgICAgY29uc3QgeSA9IGV4cGxvc2lvbi5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnQuYW5nbGUpICogY29tcG9uZW50LmdldEZhY3RvcigpICogZXhwbG9zaW9uLm1heERpc3RhbmNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9ICgxIC0gY29tcG9uZW50LmdldEZhY3RvcigpKSAqIGV4cGxvc2lvbi5tYXhTaXplO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoeCwgeSwgc2l6ZSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gY29tcG9uZW50LmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRXhwbG9zaW9uUmVuZGVyID0gRXhwbG9zaW9uUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmllbGRSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJmaWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMuZ29hbEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJnb2FsX2ZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy50cmFja0ZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInRyYWNrLmpwZ1wiKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IGJhY2tncm91bmRDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxyZWFkeVJlbmRlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJBdGhsZXRpY1RyYWNrKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgIHRoaXMucmVuZGVyQm9yZGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IHRydWU7XG4gICAgfVxuICAgIHJlbmRlckJhY2tncm91bmQoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCAwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICogMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgIH1cbiAgICByZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQUFBQUFBXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJBdGhsZXRpY1RyYWNrKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnRyYWNrRmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja0hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpcmV3b3Jrc1JlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpcmV3b3Jrc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5maXJld29ya3MuZmlyZXdvcmtzLmZvckVhY2goZmlyZXdvcmsgPT4ge1xuICAgICAgICAgICAgaWYgKGZpcmV3b3JrLmlzRmlyaW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpcmV3b3JrKGZpcmV3b3JrLCBnYW1lV29ybGQuZmlyZXdvcmtzLmxpbmVXaWR0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJGaXJld29yayhmaXJld29yaywgbGluZVdpZHRoKSB7XG4gICAgICAgIGZpcmV3b3JrLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGVuZ2h0ID0gZmlyZXdvcmsuZ2V0TGVuZ2h0KCk7XG4gICAgICAgICAgICBjb25zdCB0aW1lRmFjdG9yID0gZmlyZXdvcmsuZ2V0VGltZUZhY3RvcigpO1xuICAgICAgICAgICAgY29uc3QgeDEgPSBmaXJld29yay5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdIC0gY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeTEgPSBmaXJld29yay5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdIC0gY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeDIgPSBmaXJld29yay5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdICsgY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeTIgPSBmaXJld29yay5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdICsgY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gY29tcG9uZW50W1wiY29sb3JcIl07XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhNYXRoLnJvdW5kKHgxKSwgTWF0aC5yb3VuZCh5MSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8oTWF0aC5yb3VuZCh4MiksIE1hdGgucm91bmQoeTIpKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtzUmVuZGVyID0gRmlyZXdvcmtzUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgR2F0ZXNSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IGdhbWVXb3JsZC5nYXRlcy5jdXJyZW50QW5nbGU7XG4gICAgICAgIHRoaXMucmVuZGVyU2luZ2xlR2F0ZShhbmdsZSwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgICAgIHRoaXMucmVuZGVyU2luZ2xlR2F0ZShNYXRoLlBJIC0gYW5nbGUsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIpO1xuICAgIH1cbiAgICByZW5kZXJTaW5nbGVHYXRlKGFuZ2xlLCB4KSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gR2F0ZXNSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBNZW51UmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihtZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5ob3ZlckZhY3RvciA9IDEuMztcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dCA9IG1lbnVDb250ZXh0O1xuICAgICAgICB0aGlzLnBsYXlJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwicGxheS5wbmdcIik7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSAxICsgKHRoaXMuaG92ZXJGYWN0b3IgLSAxKSAqIGdhbWVXb3JsZC5tZW51QnV0dG9uLmhvdmVyUHJvZ3Jlc3M7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCAqIHNjYWxlO1xuICAgICAgICAgICAgdGhpcy5tZW51Q29udGV4dC5kcmF3SW1hZ2UodGhpcy5wbGF5SW1hZ2UsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnggLVxuICAgICAgICAgICAgICAgICh3aWR0aCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCkgLyAyLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi55IC1cbiAgICAgICAgICAgICAgICAoaGVpZ2h0IC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCkgLyAyLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuTWVudVJlbmRlciA9IE1lbnVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyUG93ZXJTaG90UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRWxlY3RyaWNQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRWxlY3RyaWNQb3dlclNob3RcIik7XG5jb25zdCBGaXJlUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0ZpcmVQb3dlclNob3RcIik7XG5jbGFzcyBQbGF5ZXJQb3dlclNob3RSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBhc3NldExvYWRlciwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5jZWxsc1BlclJvdyA9IDQ7XG4gICAgICAgIHRoaXMuY2VsbHNQZXJDb2x1bW4gPSA0O1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHROdW1iZXIgPSAzO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5mbGFtZUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJSZWRQYXJ0aWNsZS5wbmdcIik7XG4gICAgICAgIHRoaXMuY2VsbFdpZHRoID0gdGhpcy5mbGFtZUltYWdlLndpZHRoIC8gdGhpcy5jZWxsc1BlclJvdztcbiAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5mbGFtZUltYWdlLmhlaWdodCAvIHRoaXMuY2VsbHNQZXJDb2x1bW47XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgcG93ZXJTaG90RW50aXRpZXMgPSBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5wb3dlclNob3RFbnRpdGllcztcbiAgICAgICAgICAgIHBvd2VyU2hvdEVudGl0aWVzLmZvckVhY2gocG93ZXJTaG90RW50aXR5ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocG93ZXJTaG90RW50aXR5LnNob3VsZFJlbmRlcihwbGF5ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3dlclNob3RFbnRpdHkgaW5zdGFuY2VvZiBGaXJlUG93ZXJTaG90XzEuRmlyZVBvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJGaXJlUG93ZXJTaG90KHBvd2VyU2hvdEVudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocG93ZXJTaG90RW50aXR5IGluc3RhbmNlb2YgRWxlY3RyaWNQb3dlclNob3RfMS5FbGVjdHJpY1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbGVjdHJpY1Bvd2VyU2hvdChwbGF5ZXIsIHBvd2VyU2hvdEVudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckZpcmVQb3dlclNob3QoZmlyZVBvd2VyU2hvdCkge1xuICAgICAgICBmaXJlUG93ZXJTaG90LmZsYW1lcy5mb3JFYWNoKGZsYW1lID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBmbGFtZS5nZXREdXJhdGlvbkZhY3RvcigpICogKGZpcmVQb3dlclNob3QubWF4U2l6ZSAtIGZpcmVQb3dlclNob3QubWluU2l6ZSkgK1xuICAgICAgICAgICAgICAgIGZpcmVQb3dlclNob3QubWluU2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IGFscGhhID0gMSAtIGZsYW1lLmdldER1cmF0aW9uRmFjdG9yKCk7XG4gICAgICAgICAgICBjb25zdCByb3dJbmRleCA9IE1hdGguZmxvb3IoZmxhbWUuaW5kZXggLyB0aGlzLmNlbGxzUGVyUm93KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbHVtbkluZGV4ID0gZmxhbWUuaW5kZXggJSB0aGlzLmNlbGxzUGVyUm93O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZsYW1lSW1hZ2UsIHRoaXMuY2VsbFdpZHRoICogcm93SW5kZXgsIHRoaXMuY2VsbEhlaWdodCAqIGNvbHVtbkluZGV4LCB0aGlzLmNlbGxXaWR0aCwgdGhpcy5jZWxsSGVpZ2h0LCBNYXRoLnJvdW5kKGZsYW1lLnBvc2l0aW9uLnggLSBzaXplIC8gMiksIE1hdGgucm91bmQoZmxhbWUucG9zaXRpb24ueSAtIHNpemUgLyAyKSwgTWF0aC5yb3VuZChzaXplKSwgTWF0aC5yb3VuZChzaXplKSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckVsZWN0cmljUG93ZXJTaG90KHBsYXllciwgZWxlY3RyaWNQb3dlclNob3QpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50ID0gdGhpcy5nYW1lQ29udGV4dC5jcmVhdGVSYWRpYWxHcmFkaWVudChwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyIC8gNSwgcG9zaXRpb24ueCwgcG9zaXRpb24ueSwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcik7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCBcIiNGRkZGRkZcIik7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCBcInRyYW5zcGFyZW50XCIpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoZWxlY3RyaWNQb3dlclNob3QuYW5nbGVPZmZzZXQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGlnaHRuaW5nQm9sdE51bWJlcjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShNYXRoLlBJIC8gdGhpcy5saWdodG5pbmdCb2x0TnVtYmVyKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAwLjU7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRTaXplIC0gMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnQgPSBlbGVjdHJpY1Bvd2VyU2hvdC5saWdodG5pbmdCb2x0UG9pbnRBcnJheVtqXTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0UG9pbnQgPSBlbGVjdHJpY1Bvd2VyU2hvdC5saWdodG5pbmdCb2x0UG9pbnRBcnJheVtqICsgMV07XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGVsZWN0cmljUG93ZXJTaG90LmJpZ0xpbmVXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVUbyhuZXh0UG9pbnQueCwgbmV4dFBvaW50LnkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlY3RyaWNQb3dlclNob3Qud2hpdGVMaW5lVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGVsZWN0cmljUG93ZXJTaG90LmxpbmVXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5tb3ZlVG8ocG9pbnQueCwgcG9pbnQueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVRvKG5leHRQb2ludC54LCBuZXh0UG9pbnQueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyUG93ZXJTaG90UmVuZGVyID0gUGxheWVyUG93ZXJTaG90UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY2xhc3MgUGxheWVyUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuY29sb3JNYXAgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcIkxFRlQtMFwiLCBcIiMwMDgwMDBcIl0sXG4gICAgICAgICAgICBbXCJMRUZULTFcIiwgXCIjMzM4MDg4XCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMFwiLCBcIiNGRkE1MDBcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0xXCIsIFwiI0ZGRkYwMFwiXSxcbiAgICAgICAgXSk7XG4gICAgICAgIHRoaXMuc3R1bm5lZENvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBcIiMwMDMzMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuc3RhckltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJzdGFyLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5zdGFyTWF4U2l6ZSA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc3RhcnRNYXhEaXN0YW5jZSA9IHRoaXMuc3Rhck1heFNpemUgKiA1O1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgY29sb3JLZXkgPSBgJHtwbGF5ZXIuc2lkZX0tJHtwbGF5ZXIuY29sb3JJbmRleH1gO1xuICAgICAgICAgICAgY29uc3QgaXNTdHVubmVkID0gcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQ7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSBpc1N0dW5uZWQgPyB0aGlzLnN0dW5uZWRDb2xvciA6IHRoaXMuY29sb3JNYXAuZ2V0KGNvbG9yS2V5KTtcbiAgICAgICAgICAgIGlmIChjb2xvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSBcIiNGRjAwMDBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXJDb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KSwgTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IHBsYXllci5ib3VuY2VXcmFwcGVyLmdldEJvdW5jaW5nQW1wbGl0dWRlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNjYWxlKDEgLSBzY2FsZSwgMSArIHNjYWxlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICAgICAgaWYgKGlzU3R1bm5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyU3R1bm5lZFN0YXJzKHBsYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJTdHVubmVkU3RhcnMocGxheWVyKSB7XG4gICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5zdHVubmVkU3RhcnMuc3RhcnMuZm9yRWFjaChzdGFyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgZmFjdG9yID0gc3Rhci5nZXRGYWN0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHggPSBzdGFyLnBvc2l0aW9uLnggKyBNYXRoLmNvcyhzdGFyLmRpcmVjdGlvbikgKiAoZmFjdG9yICogdGhpcy5zdGFydE1heERpc3RhbmNlKTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBzdGFyLnBvc2l0aW9uLnkgKyBNYXRoLnNpbihzdGFyLmRpcmVjdGlvbikgKiAoZmFjdG9yICogdGhpcy5zdGFydE1heERpc3RhbmNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoc3Rhci5hbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gMSAtIGZhY3RvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3RhckltYWdlLCAtdGhpcy5zdGFyTWF4U2l6ZSAvIDIsIC10aGlzLnN0YXJNYXhTaXplIC8gMiwgdGhpcy5zdGFyTWF4U2l6ZSwgdGhpcy5zdGFyTWF4U2l6ZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSBQbGF5ZXJSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU2NvcmVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKHNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5mcmFtZUZvck51bWJlciA9IDY7XG4gICAgICAgIHRoaXMudG90YWxOdW1iZXJzID0gOTtcbiAgICAgICAgdGhpcy50b3RhbEFuaW1hdGlvblRpbWUgPSAzMDA7XG4gICAgICAgIHRoaXMuZnJhbWVUaW1lID0gdGhpcy50b3RhbEFuaW1hdGlvblRpbWUgLyB0aGlzLmZyYW1lRm9yTnVtYmVyO1xuICAgICAgICB0aGlzLnNjb3JlRnJhbWVzID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dCA9IHNjb3JlQ29udGV4dDtcbiAgICAgICAgdGhpcy5kaWdpdHNJbWFnZXMgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImRpZ2l0cy5wbmdcIik7XG4gICAgICAgIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnModGhpcy5kaWdpdHNJbWFnZXMud2lkdGgsIHRoaXMuZGlnaXRzSW1hZ2VzLmhlaWdodCAvICh0aGlzLnRvdGFsTnVtYmVycyAqIHRoaXMuZnJhbWVGb3JOdW1iZXIgKyAxKSk7XG4gICAgICAgIGNvbnN0IHNjb3JlSGVpZ2h0ID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0ICogOSkgLyAxMDtcbiAgICAgICAgdGhpcy5zY29yZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoKHNjb3JlSGVpZ2h0ICogdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCkgLyB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgc2NvcmVIZWlnaHQpO1xuICAgICAgICBjb25zdCB5UG9zaXRpb24gPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgLSB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpIC8gMjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkFycmF5ID0gW1xuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoMCwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoICogMiwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgeVBvc2l0aW9uKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY29yZUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc2NvcmVBcnJheSA9IGdhbWVXb3JsZC5zY29yZS5nZXRTY29yZUFzQXJyYXkoKTtcbiAgICAgICAgc2NvcmVBcnJheS5mb3JFYWNoKChudW1iZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGcmFtZSA9IG51bWJlciAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICBsZXQgZnJhbWVUb0RyYXcgPSB0YXJnZXRGcmFtZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSAhPT0gdGFyZ2V0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RlcCA9IE1hdGguZmxvb3IoZ2FtZVdvcmxkLnNjb3JlLmdldExhc3RVcGRhdGVEdXJhdGlvbigpIC8gdGhpcy5mcmFtZVRpbWUpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSA+IHRhcmdldEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgKj0gMjtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVUb0RyYXcgPSBNYXRoLm1heCh0YXJnZXRGcmFtZSwgdGhpcy5zY29yZUZyYW1lc1tpbmRleF0gLSBzdGVwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lVG9EcmF3ID0gTWF0aC5taW4odGFyZ2V0RnJhbWUsIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdICsgc3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmcmFtZVRvRHJhdyA9PT0gdGFyZ2V0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY29yZUZyYW1lc1tpbmRleF0gPSB0YXJnZXRGcmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5kaWdpdHNJbWFnZXMsIDAsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0ICogZnJhbWVUb0RyYXcsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdLngsIHRoaXMucG9zaXRpb25BcnJheVtpbmRleF0ueSwgdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSBTY29yZVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Eb21IYW5kbGVyID0gdm9pZCAwO1xuY2xhc3MgRG9tSGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIFt0aGlzLmJhY2tncm91bmRDYW52YXMsIHRoaXMuYmFja2dyb3VuZENvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJiYWNrZ3JvdW5kQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5zY29yZUNhbnZhcywgdGhpcy5zY29yZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJzY29yZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuZ2FtZUNhbnZhcywgdGhpcy5nYW1lQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImdhbWVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLm1lbnVDYW52YXMsIHRoaXMubWVudUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJtZW51Q2FudmFzXCIpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0Q2FudmFzKGlkKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBjb250ZXh0IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbY2FudmFzLCBjb250ZXh0XTtcbiAgICB9XG59XG5leHBvcnRzLkRvbUhhbmRsZXIgPSBEb21IYW5kbGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSB2b2lkIDA7XG5jbGFzcyBVSUludGVyYWN0aW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgfVxuICAgIHVwZGF0ZShob3ZlcmFibGUsIG9uQ2xpY2ssIGRlbHRhTXMpIHtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyZWQgPSBob3ZlcmFibGUuY29udGFpbnModGhpcy5pbnB1dC5tb3VzZVBvc2l0aW9uKTtcbiAgICAgICAgaWYgKGhvdmVyYWJsZS5ob3ZlcmVkICYmIHRoaXMuaW5wdXQuaXNNb3VzZVByZXNzZWQpIHtcbiAgICAgICAgICAgIG9uQ2xpY2soKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGVwID0gKGRlbHRhTXMgLyBob3ZlcmFibGUuZ2V0VHJhbnNpdGlvblRpbWUoKSkgKiAoaG92ZXJhYmxlLmhvdmVyZWQgPyAxIDogLTEpO1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzICsgc3RlcCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IFVJSW50ZXJhY3Rpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRXZlbnRCdXNVdGlsaXRpZXMgPSB2b2lkIDA7XG5jb25zdCB0c19idXNfMSA9IHJlcXVpcmUoXCJ0cy1idXNcIik7XG5jbGFzcyBFdmVudEJ1c1V0aWxpdGllcyB7XG59XG5leHBvcnRzLkV2ZW50QnVzVXRpbGl0aWVzID0gRXZlbnRCdXNVdGlsaXRpZXM7XG5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQgPSAoMCwgdHNfYnVzXzEuY3JlYXRlRXZlbnREZWZpbml0aW9uKSgpKFwic3RhdHVzQ2hhbmdlZFwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy5iYWxsQm9yZGVyID0gMTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDI4KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkV2lkdGggLyA0KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIHRoaXMuY3B1U3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgKHRoaXMuZmllbGRXaWR0aCAtIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICAgICAgdGhpcy5maWVsZEJvcmRlclNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyAxMDApO1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0ID0gdGhpcy5maWVsZFdpZHRoIC8gODtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldCA9IHRoaXMuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCA9XG4gICAgICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ICsgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCArIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuZ2F0ZXNMZW5ndGggPSB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyICogMy41O1xuICAgICAgICB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDgwKTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciArIHRoaXMuYmFsbEJvcmRlcjtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVDb25maWdzID0gR2FtZUNvbmZpZ3M7XG5HYW1lQ29uZmlncy5JU19ERUJVRyA9IHRydWU7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jb25zdCBHYW1lTG9vcF8xID0gcmVxdWlyZShcIi4vY29yZS9HYW1lTG9vcFwiKTtcbmNvbnN0IERvbUhhbmRsZXJfMSA9IHJlcXVpcmUoXCIuL3VpL0RvbUhhbmRsZXJcIik7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBNYWluIHtcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBhc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGF3YWl0IGFzc2V0TG9hZGVyLmluaXQoKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY2xvc2VMb2FkaW5nV2luZG93KCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgZ2FtZUxvb3AubWFpbigpO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICAgICAgLy9kb21IYW5kbGVyLm1lbnVDYW52YXMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbn1cbmNvbnN0IG1haW4gPSBuZXcgTWFpbigpO1xubWFpbi5pbml0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
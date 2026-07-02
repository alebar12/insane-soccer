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
                // create variable hexadecimal color
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
        this.bounceWrapper = new BounceWrapper_1.BounceWrapper(this);
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.currentMaxSpeed = 0;
        this.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
        this.stunnedWrapper = new StunnedWrapper_1.StunnedWrapper(this);
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
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BounceWrapper = void 0;
const PlayerStatus_1 = __webpack_require__(/*! ../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
class BounceWrapper {
    constructor(player) {
        this.bouncingStartTime = 0;
        this.bounceTime = 2000;
        this.bounceMaxAmplitude = 0.5;
        this.bounceExponentialFactor = 0.00346;
        this.bounceNumber = 5;
        this.player = player;
    }
    startBouncing() {
        if (this.getBouncingProgress() > this.bounceTime / 2 &&
            this.player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.bouncingStartTime = Date.now();
        }
    }
    getBouncingAmplitude() {
        if (!this.isBouncing()) {
            return 0;
        }
        return (this.bounceMaxAmplitude *
            Math.pow(Math.E, -this.getBouncingProgress() * this.bounceExponentialFactor) *
            Math.sin(this.getBouncingProgress() / (2 * Math.PI * this.bounceNumber)));
    }
    reset() {
        this.bouncingStartTime = 0;
    }
    getBouncingProgress() {
        return Date.now() - this.bouncingStartTime;
    }
    isBouncing() {
        return this.getBouncingProgress() <= this.bounceTime;
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
        this.powerShots.push(new FirePowerShot_1.FirePowerShot(gameConfigs));
        this.powerShots.push(new ElectricPowerShot_1.ElectricPowerShot(gameConfigs));
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
            this.stars.push(new StarDto(new Point_1.Point(position.x, position.y), 0, Math.random() * 2 * Math.PI, Date.now()));
            this.starDelta = 0;
        }
        this.stars.forEach((star, _index) => {
            star.angle += this.angleStep * delta;
            if (Date.now() - star.addedTime > StunnedStars.duration) {
                this.stars.splice(this.stars.indexOf(star), 1);
            }
        });
    }
}
exports.StunnedStars = StunnedStars;
StunnedStars.duration = 2000;
class StarDto {
    constructor(position, angle, direction, addedTime) {
        this.position = position;
        this.angle = angle;
        this.direction = direction;
        this.addedTime = addedTime;
    }
    getFactor() {
        return (Date.now() - this.addedTime) / StunnedStars.duration;
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
        this.stunnedStartTime = 0;
        this.stunnedStars = new StunnedStars_1.StunnedStars();
        this.stunnedMaxValue = 2000;
        this.stunnedStep = 1000;
        this.stunnedTime = 3000;
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
                this.stunnedStartTime = Date.now();
            }
        }
    }
    forceStunned() {
        this.player.playerStatus = PlayerStatus_1.PlayerStatus.STUNNED;
        this.stunnedStartTime = Date.now();
    }
    decrementStunnedValue(deltaMs) {
        if (this.player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        }
        else if (this.player.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED) {
            this.stunnedStars.update(deltaMs, this.player.movementPosition.position);
            if (Date.now() - this.stunnedStartTime > this.stunnedTime) {
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
        this.statusStartTime = 0;
        this.scheduledEvents = [];
        this.time = 0;
        this.bus = bus;
    }
    changeStatus(gameStatus) {
        this._gameStatus = gameStatus;
        this.statusStartTime = Date.now();
    }
    get gameStatus() {
        return this._gameStatus;
    }
    isStatusChangedRecently() {
        return Date.now() - this.statusStartTime < 300;
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
        this.lastUpdateTime = 0;
        this.lastSideUpdated = PlayerSide_1.PlayerSide.LEFT;
        this.maxScore = 5;
        this.substitutionGoals = 3;
    }
    increaseScore(playerSide) {
        if (playerSide === PlayerSide_1.PlayerSide.RIGHT) {
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
        this.lastUpdateTime = Date.now();
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
                player.bounceWrapper.startBouncing();
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
            humanPlayer.bounceWrapper.startBouncing();
            cpuPlayer.bounceWrapper.startBouncing();
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
                const step = (speed / player.maxSpeedWithBall) * 0.01 * deltaMs;
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
        if (player.movementPosition.getSpeed() > player.maxSpeedWithBall / 5) {
            player.movementPosition.decrementSpeed(deltaMs);
        }
        else {
            const speed = player.maxSpeedWithBall / 15;
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
        player.currentMaxSpeed = (player.maxSpeedWithBall * 2) / 3;
        player.destinationPosition.position = destinationPoint.point;
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
            player.destinationPosition.position.y =
                (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldHeight;
            player.destinationPosition.position.x =
                this.gameConfigs.fieldXOffset +
                    (Math.random() * 0.8 + 0.1) * this.gameConfigs.fieldWidth;
            player.destinationPosition.velocity = new Point_1.Point(0, 0);
            player.destinationPosition.acceleration = 0;
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
        this.renders.push(new ScoreRender_1.ScoreRender(domHandler.scoreContext, assetLoader));
        this.renders.push(new BallRender_1.BallRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new GatesRender_1.GatesRender(domHandler.gameContext, gameConfigs));
        this.renders.push(new PlayerRender_1.PlayerRender(domHandler.gameContext, gameConfigs, assetLoader));
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
const Point_1 = __webpack_require__(/*! ../../game/geometry/Point */ "./src/game/geometry/Point.ts");
class BallRender {
    constructor(gameContext, gameConfigs) {
        this.maxResizeFactor = 2;
        this.gameContext = gameContext;
        this.gameConfigs = gameConfigs;
        this.trajectoryMaxDistance = gameConfigs.fieldHeight / 3;
    }
    render(gameWorld) {
        const ball = gameWorld.ball;
        this.renderBallTrajectory(ball);
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
    renderBallTrajectory(ball) {
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
exports.BallRender = BallRender;


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
                let step = Math.floor((Date.now() - gameWorld.score.lastUpdate) / this.frameTime);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QzVCO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsNkNBQTZDO0FBQzdDLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBO0FBQ0Esc0JBQXNCLG9CQUFvQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LENBQUMsK0NBQWlCO0FBQzlDLHNCQUFzQixtQkFBTyxDQUFDLHVEQUFxQjtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMi9saWIvZXZlbnRlbWl0dGVyMi5qcyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9ub2RlX21vZHVsZXMvdHMtYnVzL0V2ZW50QnVzLmpzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy90cy1idXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2Fzc2V0cy9Bc3NldExvYWRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvY29yZS9HYW1lTG9vcC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9CYWxsLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0V4cGxvc2lvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9GaXJld29ya3MudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR2F0ZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Hb2FsUG9zdHMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvSG92ZXJhYmxlRW50aXR5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL01lbnVCdXR0b24udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvUGxheWVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL2JvdW5jZS9Cb3VuY2VXcmFwcGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvQmFsbFBvd2VyU2hvdC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0VsZWN0cmljUG93ZXJTaG90LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRmlyZVBvd2VyU2hvdC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL1Bvd2VyU2hvdFdyYXBwZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvc3R1bm5lZC9TdHVubmVkU3RhcnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvc3R1bm5lZC9TdHVubmVkV3JhcHBlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9CYWxsU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0dhbWVTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvS2V5cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9QbGF5ZXJTaWRlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL1BsYXllclN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9Qb3dlclNob3RUeXBlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0JvcmRlckxpbWl0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L01vdmVtZW50UG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9zaXRpb25IaXN0b3J5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL1Njb3JlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL0dhdGVTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9NYWluU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY2hlY2tlcnMvQ2hlY2tlclN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NoZWNrZXJzL3N0cmF0ZWdpZXMvU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY2hlY2tlcnMvc3RyYXRlZ2llcy9XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9QbGF5ZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L01vdmVtZW50U3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS93b3JsZC9HYW1lV29ybGQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2lucHV0L0tleWJvYXJkSW5wdXRNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01haW5SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0JhbGxSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0V4cGxvc2lvblJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvRmllbGRSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0ZpcmV3b3Jrc1JlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvR2F0ZXNSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL01lbnVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL1BsYXllclBvd2VyU2hvdFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvUGxheWVyUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9TY29yZVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdWkvRG9tSGFuZGxlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdWkvVUlJbnRlcmFjdGlvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0dhbWVDb25maWdzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcclxuICogRXZlbnRFbWl0dGVyMlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vaGlqMW54L0V2ZW50RW1pdHRlcjJcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDEzIGhpajFueFxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbiAqL1xyXG47IWZ1bmN0aW9uKHVuZGVmaW5lZCkge1xyXG5cclxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gX2lzQXJyYXkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcclxuICB9O1xyXG4gIHZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcclxuICAgIGlmICh0aGlzLl9jb25mKSB7XHJcbiAgICAgIGNvbmZpZ3VyZS5jYWxsKHRoaXMsIHRoaXMuX2NvbmYpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29uZmlndXJlKGNvbmYpIHtcclxuICAgIGlmIChjb25mKSB7XHJcbiAgICAgIHRoaXMuX2NvbmYgPSBjb25mO1xyXG5cclxuICAgICAgY29uZi5kZWxpbWl0ZXIgJiYgKHRoaXMuZGVsaW1pdGVyID0gY29uZi5kZWxpbWl0ZXIpO1xyXG4gICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkID8gY29uZi5tYXhMaXN0ZW5lcnMgOiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xyXG5cclxuICAgICAgY29uZi53aWxkY2FyZCAmJiAodGhpcy53aWxkY2FyZCA9IGNvbmYud2lsZGNhcmQpO1xyXG4gICAgICBjb25mLm5ld0xpc3RlbmVyICYmICh0aGlzLl9uZXdMaXN0ZW5lciA9IGNvbmYubmV3TGlzdGVuZXIpO1xyXG4gICAgICBjb25mLnJlbW92ZUxpc3RlbmVyICYmICh0aGlzLl9yZW1vdmVMaXN0ZW5lciA9IGNvbmYucmVtb3ZlTGlzdGVuZXIpO1xyXG4gICAgICBjb25mLnZlcmJvc2VNZW1vcnlMZWFrICYmICh0aGlzLnZlcmJvc2VNZW1vcnlMZWFrID0gY29uZi52ZXJib3NlTWVtb3J5TGVhayk7XHJcblxyXG4gICAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJUcmVlID0ge307XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX21heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2dQb3NzaWJsZU1lbW9yeUxlYWsoY291bnQsIGV2ZW50TmFtZSkge1xyXG4gICAgdmFyIGVycm9yTXNnID0gJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xyXG4gICAgICAgICdsZWFrIGRldGVjdGVkLiAnICsgY291bnQgKyAnIGxpc3RlbmVycyBhZGRlZC4gJyArXHJcbiAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0Lic7XHJcblxyXG4gICAgaWYodGhpcy52ZXJib3NlTWVtb3J5TGVhayl7XHJcbiAgICAgIGVycm9yTXNnICs9ICcgRXZlbnQgbmFtZTogJyArIGV2ZW50TmFtZSArICcuJztcclxuICAgIH1cclxuXHJcbiAgICBpZih0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5lbWl0V2FybmluZyl7XHJcbiAgICAgIHZhciBlID0gbmV3IEVycm9yKGVycm9yTXNnKTtcclxuICAgICAgZS5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XHJcbiAgICAgIGUuZW1pdHRlciA9IHRoaXM7XHJcbiAgICAgIGUuY291bnQgPSBjb3VudDtcclxuICAgICAgcHJvY2Vzcy5lbWl0V2FybmluZyhlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNc2cpO1xyXG5cclxuICAgICAgaWYgKGNvbnNvbGUudHJhY2Upe1xyXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKGNvbmYpIHtcclxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgdGhpcy5fbmV3TGlzdGVuZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuX3JlbW92ZUxpc3RlbmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLnZlcmJvc2VNZW1vcnlMZWFrID0gZmFsc2U7XHJcbiAgICBjb25maWd1cmUuY2FsbCh0aGlzLCBjb25mKTtcclxuICB9XHJcbiAgRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7IC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBleHBvcnRpbmcgRXZlbnRFbWl0dGVyIHByb3BlcnR5XHJcblxyXG4gIC8vXHJcbiAgLy8gQXR0ZW50aW9uLCBmdW5jdGlvbiByZXR1cm4gdHlwZSBub3cgaXMgYXJyYXksIGFsd2F5cyAhXHJcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXHJcbiAgLy8gZWxlbWVudHMgKGxlYWZzKSBpZiB0aGVyZSBhcmUgbWF0Y2hlc1xyXG4gIC8vXHJcbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XHJcbiAgICBpZiAoIXRyZWUpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgdmFyIGxpc3RlbmVycz1bXSwgbGVhZiwgbGVuLCBicmFuY2gsIHhUcmVlLCB4eFRyZWUsIGlzb2xhdGVkQnJhbmNoLCBlbmRSZWFjaGVkLFxyXG4gICAgICAgIHR5cGVMZW5ndGggPSB0eXBlLmxlbmd0aCwgY3VycmVudFR5cGUgPSB0eXBlW2ldLCBuZXh0VHlwZSA9IHR5cGVbaSsxXTtcclxuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBJZiBhdCB0aGUgZW5kIG9mIHRoZSBldmVudChzKSBsaXN0IGFuZCB0aGUgdHJlZSBoYXMgbGlzdGVuZXJzXHJcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XHJcbiAgICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVyc1tsZWFmXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoKGN1cnJlbnRUeXBlID09PSAnKicgfHwgY3VycmVudFR5cGUgPT09ICcqKicpIHx8IHRyZWVbY3VycmVudFR5cGVdKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcclxuICAgICAgLy8gb3IgdGhlcmUgaXMgYSBjb25jcmV0ZSBtYXRjaCBhdCB0aGlzIHBhdGNoXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XHJcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xyXG4gICAgICAgICAgaWYgKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcclxuICAgICAgfSBlbHNlIGlmKGN1cnJlbnRUeXBlID09PSAnKionKSB7XHJcbiAgICAgICAgZW5kUmVhY2hlZCA9IChpKzEgPT09IHR5cGVMZW5ndGggfHwgKGkrMiA9PT0gdHlwZUxlbmd0aCAmJiBuZXh0VHlwZSA9PT0gJyonKSk7XHJcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIFRoZSBuZXh0IGVsZW1lbnQgaGFzIGEgX2xpc3RlbmVycywgYWRkIGl0IHRvIHRoZSBoYW5kbGVycy5cclxuICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGJyYW5jaCBpbiB0cmVlKSB7XHJcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gJyonIHx8IGJyYW5jaCA9PT0gJyoqJykge1xyXG4gICAgICAgICAgICAgIGlmKHRyZWVbYnJhbmNoXS5fbGlzdGVuZXJzICYmICFlbmRSZWFjaGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcclxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzIpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVtjdXJyZW50VHlwZV0sIGkrMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHhUcmVlID0gdHJlZVsnKiddO1xyXG4gICAgaWYgKHhUcmVlKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciB0cmVlIHdpbGwgYWxsb3cgYW55IG1hdGNoIGZvciB0aGlzIHBhcnQsXHJcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcclxuICAgICAgLy9cclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4VHJlZSwgaSsxKTtcclxuICAgIH1cclxuXHJcbiAgICB4eFRyZWUgPSB0cmVlWycqKiddO1xyXG4gICAgaWYoeHhUcmVlKSB7XHJcbiAgICAgIGlmKGkgPCB0eXBlTGVuZ3RoKSB7XHJcbiAgICAgICAgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXHJcbiAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBCdWlsZCBhcnJheXMgb2YgbWF0Y2hpbmcgbmV4dCBicmFuY2hlcyBhbmQgb3RoZXJzLlxyXG4gICAgICAgIGZvcihicmFuY2ggaW4geHhUcmVlKSB7XHJcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgLy8gV2Uga25vdyB0aGUgbmV4dCBlbGVtZW50IHdpbGwgbWF0Y2gsIHNvIGp1bXAgdHdpY2UuXHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gY3VycmVudFR5cGUpIHtcclxuICAgICAgICAgICAgICAvLyBDdXJyZW50IG5vZGUgbWF0Y2hlcywgbW92ZSBpbnRvIHRoZSB0cmVlLlxyXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaXNvbGF0ZWRCcmFuY2ggPSB7fTtcclxuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB7ICcqKic6IGlzb2xhdGVkQnJhbmNoIH0sIGkrMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcclxuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWVbJyonXSAmJiB4eFRyZWVbJyonXS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ3Jvd0xpc3RlbmVyVHJlZSh0eXBlLCBsaXN0ZW5lcikge1xyXG5cclxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuXHJcbiAgICAvL1xyXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXHJcbiAgICAvL1xyXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdHlwZS5sZW5ndGg7IGkrMSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRyZWUgPSB0aGlzLmxpc3RlbmVyVHJlZTtcclxuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG5cclxuICAgIHdoaWxlIChuYW1lICE9PSB1bmRlZmluZWQpIHtcclxuXHJcbiAgICAgIGlmICghdHJlZVtuYW1lXSkge1xyXG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XHJcblxyXG4gICAgICBpZiAodHlwZS5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IGxpc3RlbmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IFt0cmVlLl9saXN0ZW5lcnNdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICF0cmVlLl9saXN0ZW5lcnMud2FybmVkICYmXHJcbiAgICAgICAgICAgIHRoaXMuX21heExpc3RlbmVycyA+IDAgJiZcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCA+IHRoaXMuX21heExpc3RlbmVyc1xyXG4gICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy53YXJuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBsb2dQb3NzaWJsZU1lbW9yeUxlYWsuY2FsbCh0aGlzLCB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoLCBuYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgbmFtZSA9IHR5cGUuc2hpZnQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxyXG4gIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxyXG4gIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxyXG4gIC8vXHJcbiAgLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXHJcbiAgLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZGVsaW1pdGVyID0gJy4nO1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcclxuICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcclxuICAgICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XHJcbiAgICAgIHRoaXMuX2NvbmYubWF4TGlzdGVuZXJzID0gbjtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50ID0gJyc7XHJcblxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbmNlKGV2ZW50LCBmbiwgZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uY2UoZXZlbnQsIGZuLCB0cnVlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuLCBwcmVwZW5kKSB7XHJcbiAgICB0aGlzLl9tYW55KGV2ZW50LCAxLCBmbiwgcHJlcGVuZCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX21hbnkoZXZlbnQsIHR0bCwgZm4sIGZhbHNlKTtcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX21hbnkoZXZlbnQsIHR0bCwgZm4sIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuLCBwcmVwZW5kKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hbnkgb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xyXG4gICAgICBpZiAoLS10dGwgPT09IDApIHtcclxuICAgICAgICBzZWxmLm9mZihldmVudCwgbGlzdGVuZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbmVyLl9vcmlnaW4gPSBmbjtcclxuXHJcbiAgICB0aGlzLl9vbihldmVudCwgbGlzdGVuZXIsIHByZXBlbmQpO1xyXG5cclxuICAgIHJldHVybiBzZWxmO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XHJcblxyXG4gICAgaWYgKHR5cGUgPT09ICduZXdMaXN0ZW5lcicgJiYgIXRoaXMuX25ld0xpc3RlbmVyKSB7XHJcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgIHZhciBhcmdzLGwsaSxqO1xyXG4gICAgdmFyIGhhbmRsZXI7XHJcblxyXG4gICAgaWYgKHRoaXMuX2FsbCAmJiB0aGlzLl9hbGwubGVuZ3RoKSB7XHJcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9hbGwuc2xpY2UoKTtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwpO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBhbDsgaisrKSBhcmdzW2pdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgaGFuZGxlciA9IFtdO1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0gZWxzZSBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgIC8vIG5lZWQgdG8gbWFrZSBjb3B5IG9mIGhhbmRsZXJzIGJlY2F1c2UgbGlzdCBjYW4gY2hhbmdlIGluIHRoZSBtaWRkbGVcclxuICAgICAgICAvLyBvZiBlbWl0IGNhbGxcclxuICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5sZW5ndGgpIHtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IGhhbmRsZXIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2FsbCAmJiB0eXBlID09PSAnZXJyb3InKSB7XHJcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAhIXRoaXMuX2FsbDtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXRBc3luYyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XHJcblxyXG4gICAgaWYgKHR5cGUgPT09ICduZXdMaXN0ZW5lcicgJiYgIXRoaXMuX25ld0xpc3RlbmVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbZmFsc2VdKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwcm9taXNlcz0gW107XHJcblxyXG4gICAgdmFyIGFsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgIHZhciBhcmdzLGwsaSxqO1xyXG4gICAgdmFyIGhhbmRsZXI7XHJcblxyXG4gICAgaWYgKHRoaXMuX2FsbCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3Nbal0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuX2FsbC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBoYW5kbGVyID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgY2FzZSAxOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAyOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDM6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLmxlbmd0aCkge1xyXG4gICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpO1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcykpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9hbGwgJiYgdHlwZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYXJndW1lbnRzWzFdKTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uKHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uKHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uQW55ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbkFueShmbiwgZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZEFueSA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25BbnkoZm4sIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbkFueSA9IGZ1bmN0aW9uKGZuLCBwcmVwZW5kKXtcclxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbkFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9hbGwpIHtcclxuICAgICAgdGhpcy5fYWxsID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXIgY29sbGVjdGlvbi5cclxuICAgIGlmKHByZXBlbmQpe1xyXG4gICAgICB0aGlzLl9hbGwudW5zaGlmdChmbik7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5fYWxsLnB1c2goZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fb24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xyXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRoaXMuX29uQW55KHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uIG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcclxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXHJcbiAgICBpZiAodGhpcy5fbmV3TGlzdGVuZXIpXHJcbiAgICAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGdyb3dMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCB0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XHJcbiAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIC8vIENoYW5nZSB0byBhcnJheS5cclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYWRkXHJcbiAgICAgIGlmKHByZXBlbmQpe1xyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS51bnNoaWZ0KGxpc3RlbmVyKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgJiZcclxuICAgICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPiAwICYmXHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IHRoaXMuX21heExpc3RlbmVyc1xyXG4gICAgICApIHtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcclxuICAgICAgICBsb2dQb3NzaWJsZU1lbW9yeUxlYWsuY2FsbCh0aGlzLCB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoLCB0eXBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGhhbmRsZXJzLGxlYWZzPVtdO1xyXG5cclxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cclxuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xyXG4gICAgICBoYW5kbGVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgbGVhZnMucHVzaCh7X2xpc3RlbmVyczpoYW5kbGVyc30pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xyXG4gICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcclxuICAgICAgaGFuZGxlcnMgPSBsZWFmLl9saXN0ZW5lcnM7XHJcbiAgICAgIGlmIChpc0FycmF5KGhhbmRsZXJzKSkge1xyXG5cclxuICAgICAgICB2YXIgcG9zaXRpb24gPSAtMTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoaGFuZGxlcnNbaV0gPT09IGxpc3RlbmVyIHx8XHJcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5saXN0ZW5lciAmJiBoYW5kbGVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XHJcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5fb3JpZ2luICYmIGhhbmRsZXJzW2ldLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IGk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICBsZWFmLl9saXN0ZW5lcnMuc3BsaWNlKHBvc2l0aW9uLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0uc3BsaWNlKHBvc2l0aW9uLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCB0eXBlLCBsaXN0ZW5lcik7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGhhbmRsZXJzID09PSBsaXN0ZW5lciB8fFxyXG4gICAgICAgIChoYW5kbGVycy5saXN0ZW5lciAmJiBoYW5kbGVycy5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XHJcbiAgICAgICAgKGhhbmRsZXJzLl9vcmlnaW4gJiYgaGFuZGxlcnMuX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XHJcbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCB0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHJvb3QpIHtcclxuICAgICAgaWYgKHJvb3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJvb3QpO1xyXG4gICAgICBmb3IgKHZhciBpIGluIGtleXMpIHtcclxuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICB2YXIgb2JqID0gcm9vdFtrZXldO1xyXG4gICAgICAgIGlmICgob2JqIGluc3RhbmNlb2YgRnVuY3Rpb24pIHx8ICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB8fCAob2JqID09PSBudWxsKSlcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3Qocm9vdFtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBkZWxldGUgcm9vdFtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdCh0aGlzLmxpc3RlbmVyVHJlZSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmZBbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xyXG4gICAgaWYgKGZuICYmIHRoaXMuX2FsbCAmJiB0aGlzLl9hbGwubGVuZ3RoID4gMCkge1xyXG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XHJcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZihmbiA9PT0gZm5zW2ldKSB7XHJcbiAgICAgICAgICBmbnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lckFueVwiLCBmbik7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcclxuICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKSB7XHJcbiAgICAgICAgZm9yKGkgPSAwLCBsID0gZm5zLmxlbmd0aDsgaSA8IGw7IGkrKylcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyQW55XCIsIGZuc1tpXSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5fYWxsID0gW107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmY7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYgKHR5cGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAhdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHZhciBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcblxyXG4gICAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcclxuICAgICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcclxuICAgICAgICBsZWFmLl9saXN0ZW5lcnMgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHMpIHtcclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIGhhbmRsZXJzID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVycywgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgICAgcmV0dXJuIGhhbmRsZXJzO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xyXG4gICAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fZXZlbnRzKTtcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycyh0eXBlKS5sZW5ndGg7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnNBbnkgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZih0aGlzLl9hbGwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2FsbDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXHJcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XHJcbiAgICB9KTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgLy8gQ29tbW9uSlNcclxuICAgIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIC8vIEJyb3dzZXIgZ2xvYmFsLlxyXG4gICAgd2luZG93LkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XHJcbiAgfVxyXG59KCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIFVzaW5nIEV2ZW50RW1pdHRlcjIgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byB1c2Ugd2lsZGNhcmRzIHRvIHN1YnNjcmliZSB0byBhbGwgZXZlbnRzXG52YXIgZXZlbnRlbWl0dGVyMl8xID0gcmVxdWlyZShcImV2ZW50ZW1pdHRlcjJcIik7XG5mdW5jdGlvbiBzaG93V2FybmluZyhtc2cpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmIChwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICEhZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLmV2ZW50VHlwZTtcbn1cbmZ1bmN0aW9uIGlzUHJlZGljYXRlRm4oZGVzY3JpcHRvcikge1xuICAgIHJldHVybiAhaXNFdmVudERlc2NyaXB0b3IoZGVzY3JpcHRvcikgJiYgdHlwZW9mIGRlc2NyaXB0b3IgPT09IFwiZnVuY3Rpb25cIjtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGVmaW5pdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIGZ1bmN0aW9uIGV2ZW50Q3JlYXRvcihwYXlsb2FkKSB7XG4gICAgICAgICAgICAvLyBBbGxvdyBydW50aW1lIHBheWxvYWQgY2hlY2tpbmcgZm9yIHBsYWluIEphdmFTY3JpcHQgdXNhZ2VcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdEZuID0gdHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIiA/IG9wdGlvbnMgOiBvcHRpb25zLnRlc3Q7XG4gICAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgICAgICBpZiAodGVzdEZuICYmICF0ZXN0Rm4ocGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd1dhcm5pbmcoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkgKyBcIiBkb2VzIG5vdCBtYXRjaCBleHBlY3RlZCBwYXlsb2FkLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBldmVudENyZWF0b3IuZXZlbnRUeXBlID0gdHlwZTtcbiAgICAgICAgZXZlbnRDcmVhdG9yLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHlwZTsgfTsgLy8gYWxsb3cgU3RyaW5nIGNvZXJjaW9uIHRvIGRlbGl2ZXIgdGhlIGV2ZW50VHlwZVxuICAgICAgICByZXR1cm4gZXZlbnRDcmVhdG9yO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbiA9IGNyZWF0ZUV2ZW50RGVmaW5pdGlvbjtcbmZ1bmN0aW9uIGRlZmluZUV2ZW50KHR5cGUpIHtcbiAgICBzaG93V2FybmluZyhcImRlZmluZUV2ZW50IGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLiBQbGVhc2UgdXNlIGNyZWF0ZUV2ZW50RGVmaW5pdGlvbiBpbnN0ZWFkLlwiKTtcbiAgICB2YXIgZXZlbnRDcmVhdG9yID0gZnVuY3Rpb24gKHBheWxvYWQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHBheWxvYWQ6IHBheWxvYWRcbiAgICB9KTsgfTtcbiAgICBldmVudENyZWF0b3IuZXZlbnRUeXBlID0gdHlwZTtcbiAgICByZXR1cm4gZXZlbnRDcmVhdG9yO1xufVxuZXhwb3J0cy5kZWZpbmVFdmVudCA9IGRlZmluZUV2ZW50O1xuZnVuY3Rpb24gZ2V0RXZlbnRUeXBlKGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoaXNFdmVudERlc2NyaXB0b3IoZGVzY3JpcHRvcikpXG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yLmV2ZW50VHlwZTtcbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbn1cbmZ1bmN0aW9uIGZpbHRlcihwcmVkaWNhdGUsIGhhbmRsZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUoZXZlbnQpKVxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoZXZlbnQpO1xuICAgIH07XG59XG52YXIgRXZlbnRCdXMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRCdXMoKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBldmVudGVtaXR0ZXIyXzEuRXZlbnRFbWl0dGVyMih7IHdpbGRjYXJkOiB0cnVlIH0pO1xuICAgIH1cbiAgICBFdmVudEJ1cy5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uIChldmVudCwgbWV0YSkge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChldmVudC50eXBlLCAhbWV0YSA/IGV2ZW50IDogX19hc3NpZ24oe30sIGV2ZW50LCB7IG1ldGE6IF9fYXNzaWduKHt9LCBldmVudC5tZXRhLCBtZXRhKSB9KSk7XG4gICAgfTtcbiAgICBFdmVudEJ1cy5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHN1YnNjcmlwdGlvbiwgaGFuZGxlcikge1xuICAgICAgICAvLyBzdG9yZSBlbWl0dGVyIG9uIGNsb3N1cmVcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSB0aGlzLmVtaXR0ZXI7XG4gICAgICAgIHZhciBzdWJzY3JpYmVUb1N1YmRlZiA9IGZ1bmN0aW9uIChzdWJkZWYpIHtcbiAgICAgICAgICAgIGlmIChpc1ByZWRpY2F0ZUZuKHN1YmRlZikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWRIYW5kbGVyXzEgPSBmaWx0ZXIoc3ViZGVmLCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLm9uKFwiKipcIiwgZmlsdGVyZWRIYW5kbGVyXzEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiBlbWl0dGVyLm9mZihcIioqXCIsIGZpbHRlcmVkSGFuZGxlcl8xKTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0RXZlbnRUeXBlKHN1YmRlZik7XG4gICAgICAgICAgICBlbWl0dGVyLm9uKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVtaXR0ZXIub2ZmKHR5cGUsIGhhbmRsZXIpOyB9O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc3VicyA9IEFycmF5LmlzQXJyYXkoc3Vic2NyaXB0aW9uKSA/IHN1YnNjcmlwdGlvbiA6IFtzdWJzY3JpcHRpb25dO1xuICAgICAgICB2YXIgdW5zdWJzY3JpYmVycyA9IHN1YnMubWFwKHN1YnNjcmliZVRvU3ViZGVmKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHVuc3Vic2NyaWJlcnMuZm9yRWFjaChmdW5jdGlvbiAodSkgeyByZXR1cm4gdSgpOyB9KTsgfTtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudEJ1cztcbn0oKSk7XG5leHBvcnRzLkV2ZW50QnVzID0gRXZlbnRCdXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FdmVudEJ1cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBFdmVudEJ1c18xID0gcmVxdWlyZShcIi4vRXZlbnRCdXNcIik7XG5leHBvcnRzLkV2ZW50QnVzID0gRXZlbnRCdXNfMS5FdmVudEJ1cztcbmV4cG9ydHMuZGVmaW5lRXZlbnQgPSBFdmVudEJ1c18xLmRlZmluZUV2ZW50O1xuZXhwb3J0cy5jcmVhdGVFdmVudERlZmluaXRpb24gPSBFdmVudEJ1c18xLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Bc3NldExvYWRlciA9IHZvaWQgMDtcbmNsYXNzIEFzc2V0TG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5JTUFHRV9GT0xERVIgPSBcImltYWdlcy9cIjtcbiAgICAgICAgdGhpcy5JTUFHRV9OQU1FUyA9IFtcbiAgICAgICAgICAgIFwiYmFsbHMucG5nXCIsXG4gICAgICAgICAgICBcImZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJ0cmFjay5qcGdcIixcbiAgICAgICAgICAgIFwiUmVkUGFydGljbGUucG5nXCIsXG4gICAgICAgICAgICBcImRpZ2l0cy5wbmdcIixcbiAgICAgICAgICAgIFwiZ29hbF9maWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwic3Rhci5wbmdcIixcbiAgICAgICAgICAgIFwicGxheS5wbmdcIixcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5pbWFnZXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuSU1BR0VfTkFNRVMubWFwKGZpbGVOYW1lID0+IHRoaXMubG9hZEltYWdlKGZpbGVOYW1lLCBgJHt0aGlzLklNQUdFX0ZPTERFUn0ke2ZpbGVOYW1lfWApKSk7XG4gICAgfVxuICAgIGdldEltYWdlKGltYWdlTmFtZSkge1xuICAgICAgICBjb25zdCBpbWFnZSA9IHRoaXMuaW1hZ2VzLmdldChpbWFnZU5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2ltYWdlTmFtZX0gaW1hZ2Ugbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBsb2FkSW1hZ2UobmFtZSwgc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZXMuc2V0KG5hbWUsIGltZyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSBBc3NldExvYWRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lTG9vcCA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNYWluU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9zeXN0ZW1zL01haW5TeXN0ZW1cIik7XG5jb25zdCBHYW1lV29ybGRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3dvcmxkL0dhbWVXb3JsZFwiKTtcbmNvbnN0IE1vdXNlSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jb25zdCBVSUludGVyYWN0aW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vdWkvVUlJbnRlcmFjdGlvblN5c3RlbVwiKTtcbmNsYXNzIEdhbWVMb29wIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wcmV2VGltZSA9IDA7XG4gICAgICAgIHRoaXMubWFpblJlbmRlciA9IG5ldyBNYWluUmVuZGVyXzEuTWFpblJlbmRlcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZCA9IG5ldyBHYW1lV29ybGRfMS5HYW1lV29ybGQoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtID0gbmV3IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMS5VSUludGVyYWN0aW9uU3lzdGVtKG5ldyBNb3VzZUlucHV0TWFuYWdlcl8xLk1vdXNlSW5wdXRNYW5hZ2VyKGRvbUhhbmRsZXIubWVudUNhbnZhcykpO1xuICAgICAgICB0aGlzLm1haW5TeXN0ZW0gPSBuZXcgTWFpblN5c3RlbV8xLk1haW5TeXN0ZW0oZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0cyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5tYWluU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZCwgZGVsdGEpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5maXJld29ya3MudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZXhwbG9zaW9uLnVwZGF0ZShkZWx0YSk7XG4gICAgfVxuICAgIHVwZGF0ZUlucHV0cyhkZWx0YSkge1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLm1lbnVCdXR0b24sICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lV29ybGQuZmlyZXdvcmtzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtLmlucHV0LnJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGRlbHRhKTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIucmVuZGVyKHRoaXMuZ2FtZVdvcmxkKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVMb29wID0gR2FtZUxvb3A7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbCA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBQb3NpdGlvbkhpc3RvcnlfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb3NpdGlvbkhpc3RvcnlcIik7XG5jb25zdCBCYWxsUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi9wb3dlclNob3RzL0JhbGxQb3dlclNob3RcIik7XG5jbGFzcyBCYWxsIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5hbmdsZVdpdGhQbGF5ZXIgPSAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pc1NldEZvclN0YXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucG9zaXRpb25IaXN0b3J5ID0gbmV3IFBvc2l0aW9uSGlzdG9yeV8xLlBvc2l0aW9uSGlzdG9yeSg1MDAwKTtcbiAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90ID0gbmV3IEJhbGxQb3dlclNob3RfMS5CYWxsUG93ZXJTaG90KCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMubWF4U3BlZWQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDQwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IHRoaXMubWF4U3BlZWQgLyAyMDAwO1xuICAgIH1cbiAgICBzZXRGb3JTdGFydEdhbWUoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1NldEZvclN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICsgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUpO1xuICAgICAgICAgICAgY29uc3Qgc3BlZWQgPSBNYXRoLnJhbmRvbSgpICogKHRoaXMubWF4U3BlZWQgLSB0aGlzLm1heFNwZWVkIC8gMy4zMykgKyB0aGlzLm1heFNwZWVkIC8gMy4zMztcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlID0gTWF0aC5QSSAvIDIgKyAoKE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJKSAvIDQuNSAtIE1hdGguUEkgLyA5KTtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChzcGVlZCwgYW5nbGUpO1xuICAgICAgICAgICAgdGhpcy5pc1NldEZvclN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXNldFRvU3RhcnRHYW1lKCkge1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKDAsIDApO1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIGlmICh0aGlzLmJhbGxQb3dlclNob3QuaXNQb3dlclNob3QpIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25IaXN0b3J5LmFkZFBvc2l0aW9uKG5ldyBQb2ludF8xLlBvaW50KHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54LCB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmRlY3JlbWVudFNwZWVkKGRlbHRhTXMpO1xuICAgICAgICBpZiAodGhpcy5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPCB0aGlzLm1heFNwZWVkIC8gMikge1xuICAgICAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LnJlc2V0UG93ZXJTaG90KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlVHJhamVjdG9yeShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25IaXN0b3J5LnVwZGF0ZShkZWx0YU1zKTtcbiAgICB9XG4gICAgYXR0YWNoVG9QbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBwbGF5ZXI7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEO1xuICAgICAgICB0aGlzLmFuZ2xlV2l0aFBsYXllciA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QucmVzZXRQb3dlclNob3QoKTtcbiAgICB9XG4gICAgZGV0YWNoRnJvbVBsYXllcigpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgbGV0IHNwZWVkRmFjdG9yID0gMTtcbiAgICAgICAgaWYgKHRoaXMuYXR0YWNoZWRQbGF5ZXI/LnBvd2VyU2hvdFdyYXBwZXIuZ2V0UG93ZXJTaG90KCkpIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdC5lbmFibGVQb3dlclNob3QodGhpcy5hdHRhY2hlZFBsYXllcik7XG4gICAgICAgICAgICBzcGVlZEZhY3RvciA9IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuZ2V0U3BlZWRGYWN0b3IodGhpcy5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdFR5cGUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllcj8ucG93ZXJTaG90V3JhcHBlci5yZXNldFBvd2VyU2hvdCgpO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHRoaXMubWF4U3BlZWQgKiBzcGVlZEZhY3RvciwgdGhpcy5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgIH1cbiAgICByZXNldE9uR29hbCgpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdC5yZXNldFBvd2VyU2hvdCgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbCA9IEJhbGw7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRXhwbG9zaW9uQ29tcG9uZW50ID0gZXhwb3J0cy5FeHBsb3Npb24gPSB2b2lkIDA7XG5jb25zdCBQb3dlclNob3RUeXBlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUG93ZXJTaG90VHlwZVwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBFeHBsb3Npb24ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMubWF4Q29tcG9uZW50cyA9IDQwO1xuICAgICAgICB0aGlzLm1pbkNvbXBvbmVudHMgPSAyMDtcbiAgICAgICAgdGhpcy5tYXhUaW1lID0gMTAwMDtcbiAgICAgICAgdGhpcy5jb2xvck9mZnNldCA9IDgwO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB0aGlzLm1heFNpemUgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDI2O1xuICAgICAgICB0aGlzLm1heERpc3RhbmNlID0gdGhpcy5tYXhTaXplICogMztcbiAgICB9XG4gICAgYWRkRXhwbG9zaW9uKHBvc2l0aW9uLCBwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgY29uc3QgbnVtYmVyT2ZDb21wb25lbnRzID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKHRoaXMubWF4Q29tcG9uZW50cyAtIHRoaXMubWluQ29tcG9uZW50cykgKyB0aGlzLm1pbkNvbXBvbmVudHMpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkNvbXBvbmVudHM7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb24gPSBNYXRoLnJhbmRvbSgpICogdGhpcy5tYXhUaW1lO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICBjb25zdCBnID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICBsZXQgciwgYjtcbiAgICAgICAgICAgIGlmIChwb3dlclNob3RUeXBlID09PSBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VHlwZS5GSVJFKSB7XG4gICAgICAgICAgICAgICAgciA9IDI1NSAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgICAgIGIgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHIgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBiID0gMjU1IC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IFwiI1wiICtcbiAgICAgICAgICAgICAgICByLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgIGcudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSArXG4gICAgICAgICAgICAgICAgYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2gobmV3IEV4cGxvc2lvbkNvbXBvbmVudChkdXJhdGlvbiwgYW5nbGUsIGNvbG9yKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb21wb25lbnQudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IHRoaXMuY29tcG9uZW50cy5maWx0ZXIoY29tcG9uZW50ID0+ICFjb21wb25lbnQuaXNGaW5pc2hlZCgpKTtcbiAgICB9XG59XG5leHBvcnRzLkV4cGxvc2lvbiA9IEV4cGxvc2lvbjtcbmNsYXNzIEV4cGxvc2lvbkNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3IoZHVyYXRpb24sIGFuZ2xlLCBjb2xvcikge1xuICAgICAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG4gICAgICAgIHRoaXMuYW5nbGUgPSBhbmdsZTtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmRlbHRhID0gMDtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZGVsdGEgKz0gZGVsdGE7XG4gICAgfVxuICAgIGlzRmluaXNoZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbHRhID49IHRoaXMuZHVyYXRpb247XG4gICAgfVxuICAgIGdldEZhY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsdGEgLyB0aGlzLmR1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuRXhwbG9zaW9uQ29tcG9uZW50ID0gRXhwbG9zaW9uQ29tcG9uZW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpcmV3b3JrQ29tcG9uZW50RHRvID0gZXhwb3J0cy5GaXJld29ya0R0byA9IGV4cG9ydHMuRmlyZXdvcmtzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEZpcmV3b3JrcyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5jb2xvck9mZnNldCA9IDEwMDtcbiAgICAgICAgdGhpcy5tYXhDb21wb25lbnRzID0gMjA7XG4gICAgICAgIHRoaXMubWluQ29tcG9uZW50cyA9IDIwO1xuICAgICAgICB0aGlzLmludGVydmFsID0gMTAwO1xuICAgICAgICB0aGlzLm51bWJlck9mRmlyZXdvcmtzID0gTWF0aC5yb3VuZChGaXJld29ya3MuYW5pbWF0aW9uVGltZSAvIHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgICB0aGlzLmZpcmV3b3JrcyA9IFtdO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMubWF4RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDc7XG4gICAgICAgIHRoaXMubWluRGlzdGFuY2UgPSB0aGlzLm1heERpc3RhbmNlIC8gNTtcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBNYXRoLmNlaWwoZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgLyAxMik7XG4gICAgfVxuICAgIGluaXRGaXJld29ya3MoKSB7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5udW1iZXJPZkZpcmV3b3JrczsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByZWQgPSB0aGlzLmdldFJhbmRvbUNvbG9yVmFsdWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGdyZWVuID0gdGhpcy5nZXRSYW5kb21Db2xvclZhbHVlKCk7XG4gICAgICAgICAgICBjb25zdCBibHVlID0gdGhpcy5nZXRSYW5kb21Db2xvclZhbHVlKCk7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRzX251bWJlciA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhDb21wb25lbnRzIC0gdGhpcy5taW5Db21wb25lbnRzKSArIHRoaXMubWluQ29tcG9uZW50cztcbiAgICAgICAgICAgIGxldCBjb21wb25lbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvbXBvbmVudHNfbnVtYmVyOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5nZXRDb2xvclZhbHVlV2l0aE9mZnNldChyZWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGcgPSB0aGlzLmdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KGdyZWVuKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiID0gdGhpcy5nZXRDb2xvclZhbHVlV2l0aE9mZnNldChibHVlKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgdmFyaWFibGUgaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvciA9IFwiI1wiICtcbiAgICAgICAgICAgICAgICAgICAgci50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpICtcbiAgICAgICAgICAgICAgICAgICAgZy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpICtcbiAgICAgICAgICAgICAgICAgICAgYi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChuZXcgRmlyZXdvcmtDb21wb25lbnREdG8oY29sb3IsIE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMiwgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKHRoaXMubWF4RGlzdGFuY2UgLSB0aGlzLm1pbkRpc3RhbmNlKSArXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRGlzdGFuY2UpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpcmV3b3Jrcy5wdXNoKG5ldyBGaXJld29ya0R0byhuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIE1hdGgucmFuZG9tKCkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKiBNYXRoLnJhbmRvbSgpKSwgLWkgKiB0aGlzLmludGVydmFsLCBjb21wb25lbnRzKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzLmZvckVhY2goZmlyZXdvcmsgPT4ge1xuICAgICAgICAgICAgZmlyZXdvcmsuc3RhcnRUaW1lICs9IGRlbHRhO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gW107XG4gICAgfVxuICAgIGdldFJhbmRvbUNvbG9yVmFsdWUoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAyNTUpO1xuICAgIH1cbiAgICBnZXRDb2xvclZhbHVlV2l0aE9mZnNldChjb2xvVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KGNvbG9WYWx1ZSArXG4gICAgICAgICAgICBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodGhpcy5jb2xvck9mZnNldCAvIDIpIC0gdGhpcy5jb2xvck9mZnNldCAvIDIpLCAwKSwgMjU1KTtcbiAgICB9XG59XG5leHBvcnRzLkZpcmV3b3JrcyA9IEZpcmV3b3JrcztcbkZpcmV3b3Jrcy5hbmltYXRpb25UaW1lID0gNTAwMDtcbmNsYXNzIEZpcmV3b3JrRHRvIHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgc3RhcnRUaW1lLCBjb21wb25lbnRzID0gW10pIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gY29tcG9uZW50cztcbiAgICAgICAgdGhpcy5zaW5nbGVEdXJhdGlvbiA9IDcwMDtcbiAgICAgICAgdGhpcy5tYXhMZW5ndGhGYWN0b3IgPSAwLjM7XG4gICAgfVxuICAgIGlzRmlyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydFRpbWUgPj0gMCAmJiB0aGlzLnN0YXJ0VGltZSA8PSB0aGlzLnNpbmdsZUR1cmF0aW9uO1xuICAgIH1cbiAgICBnZXRMZW5naHQoKSB7XG4gICAgICAgIGNvbnN0IGZhY3RvciA9IHRoaXMuc3RhcnRUaW1lID49IHRoaXMuc2luZ2xlRHVyYXRpb24gLyAyXG4gICAgICAgICAgICA/ICh0aGlzLnNpbmdsZUR1cmF0aW9uIC0gdGhpcy5zdGFydFRpbWUpIC8gKHRoaXMuc2luZ2xlRHVyYXRpb24gLyAyKVxuICAgICAgICAgICAgOiB0aGlzLnN0YXJ0VGltZSAvICh0aGlzLnNpbmdsZUR1cmF0aW9uIC8gMik7XG4gICAgICAgIHJldHVybiB0aGlzLm1heExlbmd0aEZhY3RvciAqIGZhY3RvcjtcbiAgICB9XG4gICAgZ2V0VGltZUZhY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRUaW1lIC8gdGhpcy5zaW5nbGVEdXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLkZpcmV3b3JrRHRvID0gRmlyZXdvcmtEdG87XG5jbGFzcyBGaXJld29ya0NvbXBvbmVudER0byB7XG4gICAgY29uc3RydWN0b3IoY29sb3IsIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuYW5nbGUgPSBhbmdsZTtcbiAgICAgICAgdGhpcy5kaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtDb21wb25lbnREdG8gPSBGaXJld29ya0NvbXBvbmVudER0bztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlID0gdm9pZCAwO1xuY2xhc3MgR2F0ZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYW5nbGUgPSAwO1xuICAgICAgICB0aGlzLm1heEFuZ2xlID0gTWF0aC5QSSAvIDI7XG4gICAgICAgIHRoaXMub3BlblRpbWUgPSAzMDA7XG4gICAgICAgIHRoaXMuc3RlcCA9IHRoaXMubWF4QW5nbGUgLyB0aGlzLm9wZW5UaW1lO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEsIGlzT3Blbikge1xuICAgICAgICBpZiAoaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlICs9IHRoaXMuc3RlcCAqIGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hbmdsZSAtPSB0aGlzLnN0ZXAgKiBkZWx0YTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFuZ2xlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4odGhpcy5tYXhBbmdsZSwgdGhpcy5hbmdsZSkpO1xuICAgIH1cbiAgICBnZXQgY3VycmVudEFuZ2xlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmdsZTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGUgPSBHYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdvYWxQb3N0cyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBHb2FsUG9zdHMge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBnYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cztcbiAgICB9XG59XG5leHBvcnRzLkdvYWxQb3N0cyA9IEdvYWxQb3N0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSB2b2lkIDA7XG5jbGFzcyBIb3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ob3ZlclByb2dyZXNzID0gMDtcbiAgICB9XG59XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IEhvdmVyYWJsZUVudGl0eTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51QnV0dG9uID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgSG92ZXJhYmxlRW50aXR5XzEgPSByZXF1aXJlKFwiLi9Ib3ZlcmFibGVFbnRpdHlcIik7XG5jbGFzcyBNZW51QnV0dG9uIGV4dGVuZHMgSG92ZXJhYmxlRW50aXR5XzEuSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgcmVmV2lkdGgsIHJlZkhlaWdodCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDU7XG4gICAgICAgIHRoaXMuZGltZW5zaW9uID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKGhlaWdodCAqIChyZWZXaWR0aCAvIHJlZkhlaWdodCksIGhlaWdodCk7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyAoZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIHRoaXMuZGltZW5zaW9uLndpZHRoKSAvIDIsIChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZGltZW5zaW9uLmhlaWdodCkgLyAyKTtcbiAgICB9XG4gICAgY29udGFpbnMocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludC54ID49IHRoaXMucG9zaXRpb24ueCAmJlxuICAgICAgICAgICAgcG9pbnQueCA8PSB0aGlzLnBvc2l0aW9uLnggKyB0aGlzLmRpbWVuc2lvbi53aWR0aCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnBvc2l0aW9uLnkgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5kaW1lbnNpb24uaGVpZ2h0KTtcbiAgICB9XG4gICAgZ2V0VHJhbnNpdGlvblRpbWUoKSB7XG4gICAgICAgIHJldHVybiAxMDA7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51QnV0dG9uID0gTWVudUJ1dHRvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEJvdW5jZVdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL2JvdW5jZS9Cb3VuY2VXcmFwcGVyXCIpO1xuY29uc3QgUG93ZXJTaG90V3JhcHBlcl8xID0gcmVxdWlyZShcIi4vcG93ZXJTaG90cy9Qb3dlclNob3RXcmFwcGVyXCIpO1xuY29uc3QgU3R1bm5lZFdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL3N0dW5uZWQvU3R1bm5lZFdyYXBwZXJcIik7XG5jbGFzcyBQbGF5ZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBpc0NwdSwgaXNTdWJzdGl0dXRlLCBzaWRlLCBjb2xvckluZGV4KSB7XG4gICAgICAgIHRoaXMuYm91bmNlV3JhcHBlciA9IG5ldyBCb3VuY2VXcmFwcGVyXzEuQm91bmNlV3JhcHBlcih0aGlzKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXhTcGVlZCA9IDA7XG4gICAgICAgIHRoaXMucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTDtcbiAgICAgICAgdGhpcy5zdHVubmVkV3JhcHBlciA9IG5ldyBTdHVubmVkV3JhcHBlcl8xLlN0dW5uZWRXcmFwcGVyKHRoaXMpO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDA7XG4gICAgICAgIHRoaXMubWF4U3BlZWRXaXRoQmFsbCA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAxLjMzMjtcbiAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5ub3JtYWxNYXhTcGVlZCAvIDMwMDtcbiAgICAgICAgdGhpcy5jbG9zZVRvUG9pbnREaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5pc0NwdSA9IGlzQ3B1O1xuICAgICAgICB0aGlzLmlzU3Vic3RpdHV0ZSA9IGlzU3Vic3RpdHV0ZTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gY29sb3JJbmRleDtcbiAgICAgICAgdGhpcy5pbml0UG9zaXRpb25zKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RXcmFwcGVyID0gbmV3IFBvd2VyU2hvdFdyYXBwZXJfMS5Qb3dlclNob3RXcmFwcGVyKGdhbWVDb25maWdzLCBzaWRlKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCB0cnVlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAxKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAxKTtcbiAgICB9XG4gICAgcmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZSh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RlZFBvc2l0aW9uID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHByb2plY3RlZFBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFggPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFkgPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGxldCBzdGVlclggPSBkZXNpcmVkU3BlZWRYIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lng7XG4gICAgICAgICAgICBsZXQgc3RlZXJZID0gZGVzaXJlZFNwZWVkWSAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgICAgICBpZiAoc3RlZXJNYWduaXR1ZGUgPiBtYXhTdGVlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4U3RlZXIgLyBzdGVlck1hZ25pdHVkZTtcbiAgICAgICAgICAgICAgICBzdGVlclggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgc3RlZXJZICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKz0gc3RlZXJYO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZCh0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgfVxuICAgIHN3aXRjaENvbG9ySW5kZXgoKSB7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IHRoaXMuY29sb3JJbmRleCA9PT0gMCA/IDEgOiAwO1xuICAgIH1cbiAgICB1cGRhdGVQb3dlclNob3QoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFdyYXBwZXIudXBkYXRlKGRlbHRhTXMsIHRoaXMpO1xuICAgIH1cbiAgICByZXNldE9uR29hbCgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2VXcmFwcGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuc3R1bm5lZFdyYXBwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMO1xuICAgIH1cbiAgICBpbml0UG9zaXRpb25zKGdhbWVDb25maWdzKSB7XG4gICAgICAgIGxldCBvZmZzZXRYID0gMDtcbiAgICAgICAgaWYgKHRoaXMuaXNTdWJzdGl0dXRlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0O1xuICAgICAgICAgICAgb2Zmc2V0WCA9XG4gICAgICAgICAgICAgICAgdGhpcy5zaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgICAgID8gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueCA9IGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIG9mZnNldFg7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllciA9IFBsYXllcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3VuY2VXcmFwcGVyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY2xhc3MgQm91bmNlV3JhcHBlciB7XG4gICAgY29uc3RydWN0b3IocGxheWVyKSB7XG4gICAgICAgIHRoaXMuYm91bmNpbmdTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLmJvdW5jZVRpbWUgPSAyMDAwO1xuICAgICAgICB0aGlzLmJvdW5jZU1heEFtcGxpdHVkZSA9IDAuNTtcbiAgICAgICAgdGhpcy5ib3VuY2VFeHBvbmVudGlhbEZhY3RvciA9IDAuMDAzNDY7XG4gICAgICAgIHRoaXMuYm91bmNlTnVtYmVyID0gNTtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG4gICAgfVxuICAgIHN0YXJ0Qm91bmNpbmcoKSB7XG4gICAgICAgIGlmICh0aGlzLmdldEJvdW5jaW5nUHJvZ3Jlc3MoKSA+IHRoaXMuYm91bmNlVGltZSAvIDIgJiZcbiAgICAgICAgICAgIHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCkge1xuICAgICAgICAgICAgdGhpcy5ib3VuY2luZ1N0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0Qm91bmNpbmdBbXBsaXR1ZGUoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0JvdW5jaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAodGhpcy5ib3VuY2VNYXhBbXBsaXR1ZGUgKlxuICAgICAgICAgICAgTWF0aC5wb3coTWF0aC5FLCAtdGhpcy5nZXRCb3VuY2luZ1Byb2dyZXNzKCkgKiB0aGlzLmJvdW5jZUV4cG9uZW50aWFsRmFjdG9yKSAqXG4gICAgICAgICAgICBNYXRoLnNpbih0aGlzLmdldEJvdW5jaW5nUHJvZ3Jlc3MoKSAvICgyICogTWF0aC5QSSAqIHRoaXMuYm91bmNlTnVtYmVyKSkpO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2luZ1N0YXJ0VGltZSA9IDA7XG4gICAgfVxuICAgIGdldEJvdW5jaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5ib3VuY2luZ1N0YXJ0VGltZTtcbiAgICB9XG4gICAgaXNCb3VuY2luZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmNpbmdQcm9ncmVzcygpIDw9IHRoaXMuYm91bmNlVGltZTtcbiAgICB9XG59XG5leHBvcnRzLkJvdW5jZVdyYXBwZXIgPSBCb3VuY2VXcmFwcGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxQb3dlclNob3QgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY2xhc3MgQmFsbFBvd2VyU2hvdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucG93ZXJTaG90VHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMucG93ZXJTaG90RGVzdGlvbmF0aW9uU2lkZSA9IG51bGw7XG4gICAgfVxuICAgIGdldCBpc1Bvd2VyU2hvdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJTaG90O1xuICAgIH1cbiAgICBnZXRQb3dlclNob3RUeXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3RUeXBlO1xuICAgIH1cbiAgICBlbmFibGVQb3dlclNob3QocGxheWVyKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RUeXBlID0gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5nZXRQb3dlclNob3RUeXBlKHBsYXllci5jb2xvckluZGV4KTtcbiAgICAgICAgdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGVVdGlsaXRpZXMuZ2V0T3Bwb3NpdGVTaWRlKHBsYXllci5zaWRlKTtcbiAgICB9XG4gICAgcmVzZXRQb3dlclNob3QoKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90ID0gZmFsc2U7XG4gICAgICAgIHRoaXMucG93ZXJTaG90VHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMucG93ZXJTaG90RGVzdGlvbmF0aW9uU2lkZSA9IG51bGw7XG4gICAgfVxuICAgIHNob3VsZFN0b3BPblBsYXllckJvdW5jZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBvd2VyU2hvdCB8fCB0aGlzLnBvd2VyU2hvdFR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLnNob3VsZFN0b3BPblBsYXllckJvdW5jZSh0aGlzLnBvd2VyU2hvdFR5cGUpO1xuICAgIH1cbiAgICBzaG91bGRNb3ZlVG9Hb2FsKCkge1xuICAgICAgICBpZiAoIXRoaXMucG93ZXJTaG90IHx8IHRoaXMucG93ZXJTaG90VHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLnNob3VsZE1vdmVUb0dvYWwodGhpcy5wb3dlclNob3RUeXBlKTtcbiAgICB9XG4gICAgZ2V0UG93ZXJTaG90RGVzdGluYXRpb25TaWRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFBvd2VyU2hvdCA9IEJhbGxQb3dlclNob3Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRWxlY3RyaWNQb3dlclNob3QgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRWxlY3RyaWNQb3dlclNob3Qge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSA1MDtcbiAgICAgICAgdGhpcy5saWdodG5pbmdCb2x0U2l6ZSA9IDEwO1xuICAgICAgICB0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgPSB0aGlzLmludGVydmFsO1xuICAgICAgICB0aGlzLmFuZ2xlT2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5saWdodG5pbmdCb2x0UG9pbnRBcnJheSA9IFtdO1xuICAgICAgICB0aGlzLndoaXRlTGluZVZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgucm91bmQoTWF0aC5mbG9vcihnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDIuNSkpO1xuICAgICAgICB0aGlzLmhlaWdodCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDUpO1xuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IE1hdGguY2VpbCh0aGlzLmhlaWdodCAvIDQpO1xuICAgICAgICB0aGlzLmJpZ0xpbmVXaWR0aCA9IE1hdGgucm91bmQodGhpcy5saW5lV2lkdGggKiAzKTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5sYXN0Q2hhbmdlRGVsdGFUaW1lICs9IGRlbHRhTXM7XG4gICAgICAgIHRoaXMud2hpdGVMaW5lVmlzaWJsZSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgPj0gdGhpcy5pbnRlcnZhbCkge1xuICAgICAgICAgICAgdGhpcy5sYXN0Q2hhbmdlRGVsdGFUaW1lID0gMDtcbiAgICAgICAgICAgIHRoaXMucmVnZW5lcmF0ZUxpZ2h0bmluZ0JvbHRQb2ludHMoKTtcbiAgICAgICAgICAgIHRoaXMuYW5nbGVPZmZzZXQgKz0gKE1hdGguUEkgLyA0NSkgKiB0aGlzLmludGVydmFsICogMC4wNTtcbiAgICAgICAgICAgIHRoaXMud2hpdGVMaW5lVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3VsZFJlbmRlcihwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIChwbGF5ZXIuY29sb3JJbmRleCA9PT0gMSAmJlxuICAgICAgICAgICAgcGxheWVyLnBvd2VyU2hvdFdyYXBwZXIuZ2V0UG93ZXJTaG90KCkgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpO1xuICAgIH1cbiAgICByZWdlbmVyYXRlTGlnaHRuaW5nQm9sdFBvaW50cygpIHtcbiAgICAgICAgdGhpcy5saWdodG5pbmdCb2x0UG9pbnRBcnJheSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGlnaHRuaW5nQm9sdFNpemU7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5saWdodG5pbmdCb2x0UG9pbnRBcnJheS5wdXNoKG5ldyBQb2ludF8xLlBvaW50KCh0aGlzLndpZHRoIC8gdGhpcy5saWdodG5pbmdCb2x0U2l6ZSkgKiBpIC0gdGhpcy53aWR0aCAvIDIsIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuaGVpZ2h0KSAtIHRoaXMuaGVpZ2h0IC8gMikpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5FbGVjdHJpY1Bvd2VyU2hvdCA9IEVsZWN0cmljUG93ZXJTaG90O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZsYW1lRHRvID0gZXhwb3J0cy5GaXJlUG93ZXJTaG90ID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEZpcmVQb3dlclNob3Qge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMubWF4SW5kZXggPSAxNjtcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IDE7XG4gICAgICAgIHRoaXMubGFzdEFkZGVkRGVsdGFUaW1lID0gdGhpcy5pbnRlcnZhbDtcbiAgICAgICAgdGhpcy5mbGFtZXMgPSBbXTtcbiAgICAgICAgdGhpcy5tYXhTaXplID0gTWF0aC5yb3VuZChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDIpO1xuICAgICAgICB0aGlzLm1pblNpemUgPSB0aGlzLm1heFNpemUgLyA1O1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcywgcGxheWVyKSB7XG4gICAgICAgIHRoaXMuZmxhbWVzLmZvckVhY2goZmxhbWUgPT4ge1xuICAgICAgICAgICAgZmxhbWUudXBkYXRlKGRlbHRhTXMpO1xuICAgICAgICAgICAgaWYgKGZsYW1lLmlzRmluaXNoZWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmxhbWVzLnNwbGljZSh0aGlzLmZsYW1lcy5pbmRleE9mKGZsYW1lKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZERlbHRhVGltZSArPSBkZWx0YU1zO1xuICAgICAgICBpZiAodGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgPj0gdGhpcy5pbnRlcnZhbCAmJlxuICAgICAgICAgICAgcGxheWVyLnBvd2VyU2hvdFdyYXBwZXIuZ2V0UG93ZXJTaG90KCkgJiZcbiAgICAgICAgICAgIHBsYXllci5jb2xvckluZGV4ID09PSAwICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLmZsYW1lcy5wdXNoKG5ldyBGbGFtZUR0byhuZXcgUG9pbnRfMS5Qb2ludChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSwgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5tYXhJbmRleCkpKTtcbiAgICAgICAgICAgIHRoaXMubGFzdEFkZGVkRGVsdGFUaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzaG91bGRSZW5kZXIoX3BsYXllcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5leHBvcnRzLkZpcmVQb3dlclNob3QgPSBGaXJlUG93ZXJTaG90O1xuY2xhc3MgRmxhbWVEdG8ge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBpbmRleCkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IDA7XG4gICAgICAgIHRoaXMubWF4RHVyYXRpb24gPSAxMDAwO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLmR1cmF0aW9uICs9IGRlbHRhTXM7XG4gICAgfVxuICAgIGdldER1cmF0aW9uRmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kdXJhdGlvbiAvIHRoaXMubWF4RHVyYXRpb247XG4gICAgfVxuICAgIGlzRmluaXNoZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmR1cmF0aW9uID49IHRoaXMubWF4RHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5GbGFtZUR0byA9IEZsYW1lRHRvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvd2VyU2hvdFdyYXBwZXIgPSB2b2lkIDA7XG5jb25zdCBFbGVjdHJpY1Bvd2VyU2hvdF8xID0gcmVxdWlyZShcIi4vRWxlY3RyaWNQb3dlclNob3RcIik7XG5jb25zdCBGaXJlUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi9GaXJlUG93ZXJTaG90XCIpO1xuY2xhc3MgUG93ZXJTaG90V3JhcHBlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIHNpZGUpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzID0gMDtcbiAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzVG9Qb3dlclNob3QgPSAyO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RzLnB1c2gobmV3IEZpcmVQb3dlclNob3RfMS5GaXJlUG93ZXJTaG90KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucG93ZXJTaG90cy5wdXNoKG5ldyBFbGVjdHJpY1Bvd2VyU2hvdF8xLkVsZWN0cmljUG93ZXJTaG90KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc2lkZSA9IHNpZGU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zLCBwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3RzLmZvckVhY2gocG93ZXJTaG90ID0+IHtcbiAgICAgICAgICAgIHBvd2VyU2hvdC51cGRhdGUoZGVsdGFNcywgcGxheWVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldCBwb3dlclNob3RFbnRpdGllcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJTaG90cztcbiAgICB9XG4gICAgdXBkYXRlU2NvcmVkR29hbChwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGlmIChwbGF5ZXJTaWRlID09PSB0aGlzLnNpZGUpIHtcbiAgICAgICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscysrO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29uc2VjdXRpdmVHb2FscyA9PT0gdGhpcy5jb25zZWN1dGl2ZUdvYWxzVG9Qb3dlclNob3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0UG93ZXJTaG90KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3Q7XG4gICAgfVxuICAgIHJlc2V0UG93ZXJTaG90KCkge1xuICAgICAgICBpZiAodGhpcy5wb3dlclNob3QpIHtcbiAgICAgICAgICAgIHRoaXMucG93ZXJTaG90ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5Qb3dlclNob3RXcmFwcGVyID0gUG93ZXJTaG90V3JhcHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdGFyRHRvID0gZXhwb3J0cy5TdHVubmVkU3RhcnMgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU3R1bm5lZFN0YXJzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kZWx0YUJldHdlZW5TdGFycyA9IDIwMDtcbiAgICAgICAgdGhpcy5hbmdsZVN0ZXAgPSBNYXRoLlBJIC8gODAwO1xuICAgICAgICB0aGlzLnN0YXJzID0gW107XG4gICAgICAgIHRoaXMuc3RhckRlbHRhID0gMDtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhLCBwb3NpdGlvbikge1xuICAgICAgICB0aGlzLnN0YXJEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgaWYgKHRoaXMuc3RhckRlbHRhID49IHRoaXMuZGVsdGFCZXR3ZWVuU3RhcnMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnMucHVzaChuZXcgU3RhckR0byhuZXcgUG9pbnRfMS5Qb2ludChwb3NpdGlvbi54LCBwb3NpdGlvbi55KSwgMCwgTWF0aC5yYW5kb20oKSAqIDIgKiBNYXRoLlBJLCBEYXRlLm5vdygpKSk7XG4gICAgICAgICAgICB0aGlzLnN0YXJEZWx0YSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGFycy5mb3JFYWNoKChzdGFyLCBfaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHN0YXIuYW5nbGUgKz0gdGhpcy5hbmdsZVN0ZXAgKiBkZWx0YTtcbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIC0gc3Rhci5hZGRlZFRpbWUgPiBTdHVubmVkU3RhcnMuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJzLnNwbGljZSh0aGlzLnN0YXJzLmluZGV4T2Yoc3RhciksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlN0dW5uZWRTdGFycyA9IFN0dW5uZWRTdGFycztcblN0dW5uZWRTdGFycy5kdXJhdGlvbiA9IDIwMDA7XG5jbGFzcyBTdGFyRHRvIHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgYW5nbGUsIGRpcmVjdGlvbiwgYWRkZWRUaW1lKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgdGhpcy5hZGRlZFRpbWUgPSBhZGRlZFRpbWU7XG4gICAgfVxuICAgIGdldEZhY3RvcigpIHtcbiAgICAgICAgcmV0dXJuIChEYXRlLm5vdygpIC0gdGhpcy5hZGRlZFRpbWUpIC8gU3R1bm5lZFN0YXJzLmR1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuU3RhckR0byA9IFN0YXJEdG87XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3R1bm5lZFdyYXBwZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBTdHVubmVkU3RhcnNfMSA9IHJlcXVpcmUoXCIuL1N0dW5uZWRTdGFyc1wiKTtcbmNsYXNzIFN0dW5uZWRXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFycyA9IG5ldyBTdHVubmVkU3RhcnNfMS5TdHVubmVkU3RhcnMoKTtcbiAgICAgICAgdGhpcy5zdHVubmVkTWF4VmFsdWUgPSAyMDAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGVwID0gMTAwMDtcbiAgICAgICAgdGhpcy5zdHVubmVkVGltZSA9IDMwMDA7XG4gICAgICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuICAgIH1cbiAgICB1cGRhdGVTdHVubmVkVmFsdWUob3RoZXJQbGF5ZXJTcGVlZCkge1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzICE9PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCkge1xuICAgICAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLnBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgICAgICBpZiAoc3BlZWQgPiBvdGhlclBsYXllclNwZWVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSBNYXRoLm1heCgwLCB0aGlzLnN0dW5uZWRWYWx1ZSAtIHRoaXMuc3R1bm5lZFN0ZXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3BlZWQgPCBvdGhlclBsYXllclNwZWVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgKz0gdGhpcy5zdHVubmVkU3RlcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnN0dW5uZWRWYWx1ZSA+IHRoaXMuc3R1bm5lZE1heFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQ7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3JjZVN0dW5uZWQoKSB7XG4gICAgICAgIHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBkZWNyZW1lbnRTdHVubmVkVmFsdWUoZGVsdGFNcykge1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gZGVsdGFNcyAvIDIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQpIHtcbiAgICAgICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnVwZGF0ZShkZWx0YU1zLCB0aGlzLnBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIC0gdGhpcy5zdHVubmVkU3RhcnRUaW1lID4gdGhpcy5zdHVubmVkVGltZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnN0YXJzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMuc3RhcnMgPSBbXTtcbiAgICB9XG59XG5leHBvcnRzLlN0dW5uZWRXcmFwcGVyID0gU3R1bm5lZFdyYXBwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFN0YXR1cyA9IHZvaWQgMDtcbnZhciBCYWxsU3RhdHVzO1xuKGZ1bmN0aW9uIChCYWxsU3RhdHVzKSB7XG4gICAgQmFsbFN0YXR1c1tcIkZSRUVcIl0gPSBcIkZSRUVcIjtcbiAgICBCYWxsU3RhdHVzW1wiQVRUQUNIRURcIl0gPSBcIkFUVEFDSEVEXCI7XG4gICAgQmFsbFN0YXR1c1tcIkdPQUxfU0NPUkVEXCJdID0gXCJHT0FMX1NDT1JFRFwiO1xufSkoQmFsbFN0YXR1cyB8fCAoZXhwb3J0cy5CYWxsU3RhdHVzID0gQmFsbFN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1cyA9IHZvaWQgMDtcbnZhciBHYW1lU3RhdHVzO1xuKGZ1bmN0aW9uIChHYW1lU3RhdHVzKSB7XG4gICAgR2FtZVN0YXR1c1tcIk1FTlVcIl0gPSBcIk1FTlVcIjtcbiAgICBHYW1lU3RhdHVzW1wiV0FJVElOR19CQUxMXCJdID0gXCJXQUlUSU5HX0JBTExcIjtcbiAgICBHYW1lU3RhdHVzW1wiUExBWUlOR1wiXSA9IFwiUExBWUlOR1wiO1xuICAgIEdhbWVTdGF0dXNbXCJFTkRfR0FNRVwiXSA9IFwiRU5EX0dBTUVcIjtcbiAgICBHYW1lU3RhdHVzW1wiU1VCU1RJVElPTlwiXSA9IFwiU1VCU1RJVElPTlwiO1xufSkoR2FtZVN0YXR1cyB8fCAoZXhwb3J0cy5HYW1lU3RhdHVzID0gR2FtZVN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IGV4cG9ydHMuS2V5cyA9IHZvaWQgMDtcbnZhciBLZXlzO1xuKGZ1bmN0aW9uIChLZXlzKSB7XG4gICAgS2V5c1tcIkFSUk9XX0RPV05cIl0gPSBcIkFycm93RG93blwiO1xuICAgIEtleXNbXCJBUlJPV19VUFwiXSA9IFwiQXJyb3dVcFwiO1xuICAgIEtleXNbXCJBUlJPV19MRUZUXCJdID0gXCJBcnJvd0xlZnRcIjtcbiAgICBLZXlzW1wiQVJST1dfUklHSFRcIl0gPSBcIkFycm93UmlnaHRcIjtcbiAgICBLZXlzW1wiU1BBQ0VcIl0gPSBcIiBcIjtcbn0pKEtleXMgfHwgKGV4cG9ydHMuS2V5cyA9IEtleXMgPSB7fSkpO1xudmFyIEtleXNEaXJlY3Rpb247XG4oZnVuY3Rpb24gKEtleXNEaXJlY3Rpb24pIHtcbiAgICBLZXlzRGlyZWN0aW9uW1wiSE9SSVpPTlRBTFwiXSA9IFwiSE9SSVpPTlRBTFwiO1xuICAgIEtleXNEaXJlY3Rpb25bXCJWRVJUSUNBTFwiXSA9IFwiVkVSVElDQUxcIjtcbn0pKEtleXNEaXJlY3Rpb24gfHwgKGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IEtleXNEaXJlY3Rpb24gPSB7fSkpO1xuY2xhc3MgS2V5c1V0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldEtleURpcmVjdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5cy5BUlJPV19MRUZUIHx8IGtleSA9PT0gS2V5cy5BUlJPV19SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIEtleXNEaXJlY3Rpb24uSE9SSVpPTlRBTDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX1VQIHx8IGtleSA9PT0gS2V5cy5BUlJPV19ET1dOKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5WRVJUSUNBTDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleXNVdGlsaXRpZXMgPSBLZXlzVXRpbGl0aWVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclNpZGVVdGlsaXRpZXMgPSBleHBvcnRzLlBsYXllclNpZGUgPSB2b2lkIDA7XG52YXIgUGxheWVyU2lkZTtcbihmdW5jdGlvbiAoUGxheWVyU2lkZSkge1xuICAgIFBsYXllclNpZGVbXCJMRUZUXCJdID0gXCJMRUZUXCI7XG4gICAgUGxheWVyU2lkZVtcIlJJR0hUXCJdID0gXCJSSUdIVFwiO1xufSkoUGxheWVyU2lkZSB8fCAoZXhwb3J0cy5QbGF5ZXJTaWRlID0gUGxheWVyU2lkZSA9IHt9KSk7XG5jbGFzcyBQbGF5ZXJTaWRlVXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0T3Bwb3NpdGVTaWRlKHNpZGUpIHtcbiAgICAgICAgcmV0dXJuIHNpZGUgPT09IFBsYXllclNpZGUuTEVGVCA/IFBsYXllclNpZGUuUklHSFQgOiBQbGF5ZXJTaWRlLkxFRlQ7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJTaWRlVXRpbGl0aWVzID0gUGxheWVyU2lkZVV0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSB2b2lkIDA7XG52YXIgUGxheWVyU3RhdHVzO1xuKGZ1bmN0aW9uIChQbGF5ZXJTdGF0dXMpIHtcbiAgICBQbGF5ZXJTdGF0dXNbXCJOT1JNQUxcIl0gPSBcIk5PUk1BTFwiO1xuICAgIFBsYXllclN0YXR1c1tcIlNUVU5ORURcIl0gPSBcIlNUVU5ORURcIjtcbn0pKFBsYXllclN0YXR1cyB8fCAoZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvd2VyU2hvdFV0aWxpdGllcyA9IGV4cG9ydHMuUG93ZXJTaG90VHlwZSA9IHZvaWQgMDtcbnZhciBQb3dlclNob3RUeXBlO1xuKGZ1bmN0aW9uIChQb3dlclNob3RUeXBlKSB7XG4gICAgUG93ZXJTaG90VHlwZVtcIkZJUkVcIl0gPSBcIkZJUkVcIjtcbiAgICBQb3dlclNob3RUeXBlW1wiRUxFQ1RSSUNcIl0gPSBcIkVMRUNUUklDXCI7XG59KShQb3dlclNob3RUeXBlIHx8IChleHBvcnRzLlBvd2VyU2hvdFR5cGUgPSBQb3dlclNob3RUeXBlID0ge30pKTtcbmNsYXNzIFBvd2VyU2hvdFV0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldFBvd2VyU2hvdFR5cGUoY29sb3JJbmRleCkge1xuICAgICAgICBzd2l0Y2ggKGNvbG9ySW5kZXgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZS5GSVJFO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlLkVMRUNUUklDO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZS5GSVJFO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZXRTcGVlZEZhY3Rvcihwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRUxFQ1RSSUM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDEuMjtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIHNob3VsZFN0b3BPblBsYXllckJvdW5jZShwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkVMRUNUUklDOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgc2hvdWxkTW92ZVRvR29hbChwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkVMRUNUUklDOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlBvd2VyU2hvdFV0aWxpdGllcyA9IFBvd2VyU2hvdFV0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSB2b2lkIDA7XG5jbGFzcyBCb3JkZXJMaW1pdHMge1xuICAgIGNvbnN0cnVjdG9yKGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSkge1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xuICAgICAgICB0aGlzLmJvdHRvbSA9IGJvdHRvbTtcbiAgICB9XG4gICAgaXNQb2ludEluc2lkZShwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5sZWZ0ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucmlnaHQgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy50b3AgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5ib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gQm9yZGVyTGltaXRzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRpbWVuc2lvbnMgPSB2b2lkIDA7XG5jbGFzcyBEaW1lbnNpb25zIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxufVxuZXhwb3J0cy5EaW1lbnNpb25zID0gRGltZW5zaW9ucztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuL1BvaW50XCIpO1xuY2xhc3MgTW92ZW1lbnRQb2ludCB7XG4gICAgc3RhdGljIGFyZVRvdWNoaW5nKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHBvaW50MS5wb3NpdGlvbiwgcG9pbnQyLnBvc2l0aW9uKSA8IHBvaW50MS5zaXplICsgcG9pbnQyLnNpemU7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCB2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uLCBzaXplKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICB9XG4gICAgdXBkYXRlUG9zaXRpb24oZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gdGhpcy52ZWxvY2l0eS54ICogZGVsdGFNcztcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ICs9IHRoaXMudmVsb2NpdHkueSAqIGRlbHRhTXM7XG4gICAgfVxuICAgIHByb2plY3RUb0ZpbmFsUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi54LCB0aGlzLnZlbG9jaXR5LngpLCB0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi55LCB0aGlzLnZlbG9jaXR5LnkpKTtcbiAgICB9XG4gICAgZ2V0U3BlZWQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy52ZWxvY2l0eS54LCAyKSArIE1hdGgucG93KHRoaXMudmVsb2NpdHkueSwgMikpO1xuICAgIH1cbiAgICBnZXRTcGVlZEFuZ2xlKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnZlbG9jaXR5LnksIHRoaXMudmVsb2NpdHkueCk7XG4gICAgfVxuICAgIGFkanVzdFRvTWF4U3BlZWQobWF4U3BlZWQpIHtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBNYXRoLm1pbih0aGlzLmdldFNwZWVkKCksIG1heFNwZWVkKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSB0aGlzLmdldFNwZWVkQW5nbGUoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBzZXRTcGVlZChzcGVlZCwgYW5nbGUpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBkZWNyZW1lbnRTcGVlZChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMuZ2V0U3BlZWQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbmV3U3BlZWQgLyBjdXJyZW50U3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnggKj0gcmF0aW87XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnkgKj0gcmF0aW87XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbihwb3NpdGlvbiwgc3BlZWQpIHtcbiAgICAgICAgd2hpbGUgKE1hdGguYWJzKHNwZWVkKSA+IDApIHtcbiAgICAgICAgICAgIHBvc2l0aW9uICs9IHNwZWVkO1xuICAgICAgICAgICAgc3BlZWQgPSBNYXRoLnNpZ24oc3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoc3BlZWQpIC0gdGhpcy5hY2NlbGVyYXRpb24sIDApO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHNwZWVkKSA8PSB0aGlzLmFjY2VsZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHNwZWVkID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gTW92ZW1lbnRQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb2ludCA9IHZvaWQgMDtcbmNsYXNzIFBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXREaXN0YW5jZShwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50MS54IC0gcG9pbnQyLngsIDIpICsgTWF0aC5wb3cocG9pbnQxLnkgLSBwb2ludDIueSwgMikpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHBvaW50Mi55IC0gcG9pbnQxLnksIHBvaW50Mi54IC0gcG9pbnQxLngpO1xuICAgIH1cbiAgICBzdGF0aWMgYXJlUG9pbnRFcXVhbHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIHBvaW50MS54ID09PSBwb2ludDIueCAmJiBwb2ludDEueSA9PT0gcG9pbnQyLnk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhpc3RvcnlQb2ludCA9IGV4cG9ydHMuUG9zaXRpb25IaXN0b3J5ID0gdm9pZCAwO1xuY2xhc3MgUG9zaXRpb25IaXN0b3J5IHtcbiAgICBjb25zdHJ1Y3RvcihyZXRlbnRpb25UaW1lKSB7XG4gICAgICAgIHRoaXMucmV0ZW50aW9uVGltZSA9IHJldGVudGlvblRpbWU7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgfVxuICAgIGFkZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IEhpc3RvcnlQb2ludChwb3NpdGlvbiwgMCkpO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5mb3JFYWNoKHAgPT4gKHAuZGVsdGEgKz0gZGVsdGFNcykpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IHRoaXMucG9zaXRpb25zLmZpbHRlcihwID0+IHAuZGVsdGEgPCB0aGlzLnJldGVudGlvblRpbWUpO1xuICAgIH1cbiAgICBnZXRGYWN0b3IoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb25zW2luZGV4XS5nZXRGYWN0b3IodGhpcy5yZXRlbnRpb25UaW1lKTtcbiAgICB9XG59XG5leHBvcnRzLlBvc2l0aW9uSGlzdG9yeSA9IFBvc2l0aW9uSGlzdG9yeTtcbmNsYXNzIEhpc3RvcnlQb2ludCB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGRlbHRhKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5kZWx0YSA9IGRlbHRhO1xuICAgIH1cbiAgICBnZXRGYWN0b3IocmV0ZW50aW9uVGltZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWx0YSAvIHJldGVudGlvblRpbWU7XG4gICAgfVxufVxuZXhwb3J0cy5IaXN0b3J5UG9pbnQgPSBIaXN0b3J5UG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBFdmVudEJ1c1V0aWxpdGllc18xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0V2ZW50QnVzVXRpbGl0aWVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBHYW1lU3RhdHVzTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoYnVzKSB7XG4gICAgICAgIHRoaXMuX2dhbWVTdGF0dXMgPSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgICAgICB0aGlzLnN0YXR1c1N0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzID0gW107XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgICAgIHRoaXMuYnVzID0gYnVzO1xuICAgIH1cbiAgICBjaGFuZ2VTdGF0dXMoZ2FtZVN0YXR1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gZ2FtZVN0YXR1cztcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhdHVzU3RhcnRUaW1lIDwgMzAwO1xuICAgIH1cbiAgICBzY2hlZHVsZVN0YXR1c0NoYW5nZShkZWxheSwgZ2FtZVN0YXR1cykge1xuICAgICAgICBjb25zdCBleGlzdGluZ0V2ZW50ID0gdGhpcy5zY2hlZHVsZWRFdmVudHMuZmluZChlID0+IGUuZ2FtZVN0YXR1cyA9PT0gZ2FtZVN0YXR1cyk7XG4gICAgICAgIGlmICghZXhpc3RpbmdFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdGltZTogdGhpcy50aW1lICsgZGVsYXksXG4gICAgICAgICAgICAgICAgZ2FtZVN0YXR1czogZ2FtZVN0YXR1cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLnNjaGVkdWxlZEV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZSA+PSBlLnRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZVN0YXR1cyhlLmdhbWVTdGF0dXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnVzLnB1Ymxpc2goRXZlbnRCdXNVdGlsaXRpZXNfMS5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQodGhpcy5nYW1lU3RhdHVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maWx0ZXIoZSA9PiB0aGlzLnRpbWUgPCBlLnRpbWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSBHYW1lU3RhdHVzTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZU1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNsYXNzIFNjb3JlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGVmdFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5yaWdodFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlVGltZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdFNpZGVVcGRhdGVkID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVDtcbiAgICAgICAgdGhpcy5tYXhTY29yZSA9IDU7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uR29hbHMgPSAzO1xuICAgIH1cbiAgICBpbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0U2NvcmUrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVmdFNjb3JlKys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHRoaXMubGFzdFNpZGVVcGRhdGVkID0gcGxheWVyU2lkZTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMubGVmdFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5yaWdodFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuICAgIGdldFNjb3JlQXNBcnJheSgpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gU3RyaW5nKHRoaXMubGVmdFNjb3JlKS5wYWRTdGFydCgyLCBcIjBcIikgKyBTdHJpbmcodGhpcy5yaWdodFNjb3JlKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgIHJldHVybiBvdXRwdXRTdHJpbmcuc3BsaXQoXCJcIikubWFwKE51bWJlcik7XG4gICAgfVxuICAgIHNob3VsZEFuaW1hdGVJbmRleChpbmRleCkge1xuICAgICAgICBpZiAodGhpcy5sYXN0U2lkZVVwZGF0ZWQgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPCAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4ID49IDI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGxhc3RVcGRhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RVcGRhdGVUaW1lO1xuICAgIH1cbiAgICBnZXQgaXNHYW1lT3ZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdFNjb3JlID09PSB0aGlzLm1heFNjb3JlIHx8IHRoaXMucmlnaHRTY29yZSA9PT0gdGhpcy5tYXhTY29yZTtcbiAgICB9XG4gICAgZ2V0V2lubmluZ1BsYXllclNpZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLmxlZnRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5yaWdodFNjb3JlID09PSB0aGlzLm1heFNjb3JlKSB7XG4gICAgICAgICAgICByZXR1cm4gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc1N1YnN0aXR1dGlvblRpbWUoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsU2NvcmUgPSB0aGlzLmxlZnRTY29yZSArIHRoaXMucmlnaHRTY29yZTtcbiAgICAgICAgcmV0dXJuIHRvdGFsU2NvcmUgPiAwICYmIHRvdGFsU2NvcmUgJSB0aGlzLnN1YnN0aXR1dGlvbkdvYWxzID09PSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVNYW5hZ2VyID0gU2NvcmVNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEdhdGVTeXN0ZW0ge1xuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgZ2FtZVdvcmxkLmdhdGVzLnVwZGF0ZShkZWx0YU1zLCBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTik7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlU3lzdGVtID0gR2F0ZVN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlclwiKTtcbmNvbnN0IENoZWNrZXJTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NoZWNrZXJzL0NoZWNrZXJTeXN0ZW1cIik7XG5jb25zdCBDb2xsaXNpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW1cIik7XG5jb25zdCBHYXRlU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9HYXRlU3lzdGVtXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL21vdmVtZW50L01vdmVtZW50U3lzdGVtXCIpO1xuY2xhc3MgTWFpblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IEdhdGVTeXN0ZW1fMS5HYXRlU3lzdGVtKCkpO1xuICAgICAgICB0aGlzLnN5c3RlbXMucHVzaChuZXcgQ2hlY2tlclN5c3RlbV8xLkNoZWNrZXJTeXN0ZW0oKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLmZvckVhY2goc3lzdGVtID0+IHN5c3RlbS51cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluU3lzdGVtID0gTWFpblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1N1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1dhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XCIpO1xuY2xhc3MgQ2hlY2tlclN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3lfMS5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSgpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgX2RlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkKSk7XG4gICAgfVxufVxuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gQ2hlY2tlclN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYXJlQWxsUGxheWVyc0luSW5pdGlhbFBvc2l0aW9uID0gZ2FtZVdvcmxkLnBsYXllcnMuZXZlcnkocGxheWVyID0+IHtcbiAgICAgICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmFyZVBvaW50RXF1YWxzKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBwbGF5ZXIuaW5pdGlhbFBvc2l0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChhcmVBbGxQbGF5ZXJzSW5Jbml0aWFsUG9zaXRpb24pIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5ID0gU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBXYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTDtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGFyZUFsbFBsYXllcnNJblBvc2l0aW9uID0gZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmV2ZXJ5KHBsYXllciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpc0JhbGxTdG9wcGVkID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID09PSAwO1xuICAgICAgICBpZiAoYXJlQWxsUGxheWVyc0luUG9zaXRpb24gJiYgaXNCYWxsU3RvcHBlZCkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKDE1MDAsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSA9IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9QbGF5ZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIENvbGxpc2lvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5XzEuQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llc1xuICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gQ29sbGlzaW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEJvcmRlckxpbWl0c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L0JvcmRlckxpbWl0c1wiKTtcbmNsYXNzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgZ2V0RmllbGRCb3JkZXJMaW1pdHMoc2l6ZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoIC0gc2l6ZSwgY2ZnLmZpZWxkQm9yZGVyU2l6ZSArIHNpemUsIGNmZy5maWVsZEhlaWdodCAtIGNmZy5maWVsZEJvcmRlclNpemUgLSBzaXplKTtcbiAgICB9XG4gICAgaGFuZGxlQm9yZGVyQ29sbGlzaW9uKG1vdmVtZW50UG9pbnQsIGJvcmRlckxpbWl0cywgaW52ZXJ0U3BlZWQsIGF2b2lkQm91bmNlT25Hb2FsID0gdHJ1ZSwgYXZvaWRCb3VuY2VPblN1YnN0aXR1dGlvbiA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IGlzSW5Hb2FsWVJhbmdlID0gIWF2b2lkQm91bmNlT25Hb2FsICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPj0gY2ZnLmdvYWxZT2Zmc2V0ICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPD0gY2ZnLmdvYWxZT2Zmc2V0ICsgY2ZnLmdvYWxIZWlnaHQ7XG4gICAgICAgIGNvbnN0IGlzSW5TdWJzdGl0dXRpb25ZUmFuZ2UgPSBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uICYmXG4gICAgICAgICAgICAoKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+PSBjZmcucGxheWVyU3Vic3RpdHV0aW9uWCAtIGNmZy5nYXRlc0xlbmd0aCAvIDIgJiZcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPD0gY2ZnLnBsYXllclN1YnN0aXR1dGlvblggKyBjZmcuZ2F0ZXNMZW5ndGggLyAyKSB8fFxuICAgICAgICAgICAgICAgIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPj0gY2ZnLmNwdVN1YnN0aXR1dGlvblggLSBjZmcuZ2F0ZXNMZW5ndGggLyAyICYmXG4gICAgICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8PSBjZmcuY3B1U3Vic3RpdHV0aW9uWCArIGNmZy5nYXRlc0xlbmd0aCAvIDIpKTtcbiAgICAgICAgbGV0IGhhc0NvbGxpZGVkID0gZmFsc2U7XG4gICAgICAgIGlmICghaXNJbkdvYWxZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54IDwgYm9yZGVyTGltaXRzLmxlZnQpIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA9IGJvcmRlckxpbWl0cy5sZWZ0O1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGgubWF4KDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0luR29hbFlSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPiBib3JkZXJMaW1pdHMucmlnaHQpIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA9IGJvcmRlckxpbWl0cy5yaWdodDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5taW4oMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi55IDwgYm9yZGVyTGltaXRzLnRvcCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLnRvcDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLm1heCgwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJblN1YnN0aXR1dGlvbllSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPiBib3JkZXJMaW1pdHMuYm90dG9tKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMuYm90dG9tO1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLm1pbigwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNDb2xsaWRlZDtcbiAgICB9XG4gICAgZ2V0R29hbEJvcmRlckxpbWl0cyhzaXplLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IHRvcCA9IGNmZy5nb2FsWU9mZnNldCArIHNpemU7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IGNmZy5nb2FsWU9mZnNldCArIGNmZy5nb2FsSGVpZ2h0IC0gc2l6ZTtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKHNpemUsIGNmZy5maWVsZFhPZmZzZXQgLSBzaXplLCB0b3AsIGJvdHRvbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIGNmZy5maWVsZFdpZHRoICsgc2l6ZSwgY2ZnLndpZHRoIC0gc2l6ZSwgdG9wLCBib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSA9IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICB0aGlzLmhhbmRsZUJvcmRlckNvbGxpc2lvbihiYWxsTW92ZW1lbnQsIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUpLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCk7XG4gICAgICAgIHRoaXMuY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpO1xuICAgIH1cbiAgICBjaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIGNvbnN0IGdvYWxCb3JkZXIgPSB0aGlzLmdldEdvYWxCb3JkZXJMaW1pdHMoYmFsbE1vdmVtZW50LnNpemUsIHBsYXllclNpZGUpO1xuICAgICAgICBpZiAoZ29hbEJvcmRlci5pc1BvaW50SW5zaWRlKGJhbGxNb3ZlbWVudC5wb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5pbmNyZWFzZVNjb3JlKFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlVXRpbGl0aWVzLmdldE9wcG9zaXRlU2lkZShwbGF5ZXJTaWRlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICBsZXQgc2lkZSA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgICAgIGlmIChiYWxsTW92ZW1lbnQucG9zaXRpb24ueCA+XG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDIpIHtcbiAgICAgICAgICAgIHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBnb2FsQm9yZGVyID0gdGhpcy5nZXRHb2FsQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplLCBzaWRlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24oYmFsbE1vdmVtZW50LCBnb2FsQm9yZGVyLCB0cnVlLCB0cnVlKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgcG9zaXRpb24pIDxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNpemUgKyBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFuZ2xlID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgcG9zaXRpb24pIC0gTWF0aC5QSTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSwgYW5nbGUpO1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLnggKyBNYXRoLmNvcyhhbmdsZSkgKiBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cztcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi55ICsgTWF0aC5zaW4oYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFBvd2VyU2hvdC5zaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UoKSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmF0dGFjaFRvUGxheWVyKHBsYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgICFnYW1lV29ybGQuYmFsbC5iYWxsUG93ZXJTaG90LnNob3VsZFN0b3BPblBsYXllckJvdW5jZSgpKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBpZiAoTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQuYXJlVG91Y2hpbmcoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbiwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWlkZGxlUG9pbnQgPSBuZXcgUG9pbnRfMS5Qb2ludCgoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkgL1xuICAgICAgICAgICAgICAgICAgICAyLCAoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgICAgICAyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKG1pZGRsZVBvaW50LCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpLCBhbmdsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneSA9IEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF2b2lkQm91bmNlT25TdWJzdGl0dXRpb24gPSBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTjtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbGxpZGVkID0gdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24ocGxheWVyLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSksIGZhbHNlLCB0cnVlLCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChoYXNDb2xsaWRlZCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5ib3VuY2VXcmFwcGVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgaHVtYW5QbGF5ZXIgPSBnYW1lV29ybGQucGxheWVycy5maW5kKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiAhcGxheWVyLmlzQ3B1KTtcbiAgICAgICAgY29uc3QgY3B1UGxheWVyID0gZ2FtZVdvcmxkLnBsYXllcnMuZmluZChwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgcGxheWVyLmlzQ3B1KTtcbiAgICAgICAgaWYgKGh1bWFuUGxheWVyID09PSB1bmRlZmluZWQgfHwgY3B1UGxheWVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQuYXJlVG91Y2hpbmcoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbiwgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpIHtcbiAgICAgICAgICAgICAgICBodW1hblBsYXllci5zdHVubmVkV3JhcHBlci51cGRhdGVTdHVubmVkVmFsdWUoY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSk7XG4gICAgICAgICAgICAgICAgY3B1UGxheWVyLnN0dW5uZWRXcmFwcGVyLnVwZGF0ZVN0dW5uZWRWYWx1ZShodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0aW9uUG9pbnQgPSBuZXcgUG9pbnRfMS5Qb2ludCgoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkgL1xuICAgICAgICAgICAgICAgIDIsIChodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgKyBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSAvXG4gICAgICAgICAgICAgICAgMik7XG4gICAgICAgICAgICBodW1hblBsYXllci5ib3VuY2VXcmFwcGVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNwdVBsYXllci5ib3VuY2VXcmFwcGVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpc2lvblNwZWVkID0gKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpIC9cbiAgICAgICAgICAgICAgICAyO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGh1bWFuUGxheWVyLCBjcHVQbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoY3B1UGxheWVyLCBodW1hblBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhpbnRlcnNlY3Rpb25Qb2ludCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgYmFsbC5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBib3VuY2VQbGF5ZXJzKHBsYXllcjEsIHBsYXllcjIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgaW50ZXJzZWN0aW9uUG9pbnQpIC1cbiAgICAgICAgICAgIE1hdGguUEk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChjb2xsaXNpb25TcGVlZCwgYW5nbGUpO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBpbnRlcnNlY3Rpb25Qb2ludC54ICsgTWF0aC5jb3MoYW5nbGUpICogcGxheWVyMi5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnkgKyBNYXRoLnNpbihhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL01vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL1dhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBNZW51TW92ZW1lbnRTdHJhdGVneV8xLk1lbnVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgLy90aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgQ3B1TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFdpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneV8xLlN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzLnB1c2gobmV3IE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5XzEuTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICAgICAgdGhpcy51cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgfVxuICAgIHVwZGF0ZVBsYXllcnMoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICAgICAgcGxheWVyLnN0dW5uZWRXcmFwcGVyLmRlY3JlbWVudFN0dW5uZWRWYWx1ZShkZWx0YU1zKTtcbiAgICAgICAgICAgIHBsYXllci51cGRhdGVQb3dlclNob3QoZGVsdGFNcyk7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkLmJhbGwsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgICAgICBnYW1lV29ybGQuYmFsbC51cGRhdGVUcmFqZWN0b3J5KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSBNb3ZlbWVudFN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBiYWxsLmF0dGFjaGVkUGxheWVyO1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIgIT09IG51bGwgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5kZXRhY2hGcm9tUGxheWVyKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuYW5nbGVUb2xsZXJhbmNlID0gTWF0aC5QSSAvIDMwO1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgIXRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgaWYgKHBsYXllciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRqdXN0QmFsbFBvc2l0aW9uQXJvdW5kUGxheWVyKGJhbGwsIHBsYXllciwgZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRTaXplID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSArIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICsgTWF0aC5QSTtcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlRGlmZmVyZW5jZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGFyZ2V0QW5nbGUgLSBiYWxsLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYW5nbGVEaWZmZXJlbmNlKSA+IHRoaXMuYW5nbGVUb2xsZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IChzcGVlZCAvIHBsYXllci5tYXhTcGVlZFdpdGhCYWxsKSAqIDAuMDEgKiBkZWx0YU1zO1xuICAgICAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyICs9IGFuZ2xlRGlmZmVyZW5jZSA+IDAgPyBzdGVwIDogLXN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciA9IHRhcmdldEFuZ2xlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGJhbGwuYW5nbGVXaXRoUGxheWVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICB3aGlsZSAoYW5nbGUgPiBNYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSAtPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYW5nbGUgPCAtTWF0aC5QSSkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMiAqIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCA9IDI1MDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1pbkdvYWxEaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTA7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBiYWxsLmJhbGxQb3dlclNob3Quc2hvdWxkTW92ZVRvR29hbCgpKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSk7XG4gICAgICAgIGlmIChkaXN0YW5jZSA+IHRoaXMubWluR29hbERpc3RhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZTEgPSB0aGlzLmdldERpcmVjdGlvbkRpc3RhbmNlKGJhbGwsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgKyBNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlMiA9IHRoaXMuZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSAtIE1hdGguUEkgLyB0aGlzLmJhbGxSb3RhdGVPZmZzZXQpO1xuICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGJhbGwubWF4U3BlZWQgKlxuICAgICAgICAgICAgICAgIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuZ2V0U3BlZWRGYWN0b3IoYmFsbC5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdFR5cGUoKSksIGRpc3RhbmNlMSA8IGRpc3RhbmNlMlxuICAgICAgICAgICAgICAgID8gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSArXG4gICAgICAgICAgICAgICAgICAgIChNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KSAqIGRlbHRhTXNcbiAgICAgICAgICAgICAgICA6IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgLVxuICAgICAgICAgICAgICAgICAgICAoTWF0aC5QSSAvIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCkgKiBkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXREaXJlY3Rpb25EaXN0YW5jZShiYWxsLCBiYWxsU3BlZWRBbmdsZSkge1xuICAgICAgICBjb25zdCBkZXN0aW5hdGlvblggPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArXG4gICAgICAgICAgICAoYmFsbC5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdERlc3RpbmF0aW9uU2lkZSgpID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgOiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpO1xuICAgICAgICBjb25zdCBkZXN0aW5hdGlvblkgPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMjtcbiAgICAgICAgbGV0IGRpc3QgPSBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgbmV3IFBvaW50XzEuUG9pbnQoZGVzdGluYXRpb25YLCBkZXN0aW5hdGlvblkpKTtcbiAgICAgICAgY29uc3QgbmV3WCA9IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbFNwZWVkQW5nbGUpICogZGlzdDtcbiAgICAgICAgY29uc3QgbmV3WSA9IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbFNwZWVkQW5nbGUpICogZGlzdDtcbiAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UobmV3IFBvaW50XzEuUG9pbnQobmV3WCwgbmV3WSksIG5ldyBQb2ludF8xLlBvaW50KGRlc3RpbmF0aW9uWCwgZGVzdGluYXRpb25ZKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneSA9IE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuc2V0Rm9yU3RhcnRHYW1lKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChfYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTik7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkge1xuICAgICAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYmFsbC5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uSE9SSVpPTlRBTCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLlZFUlRJQ0FMKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBob3Jpem9udGFsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19MRUZULCBLZXlzXzEuS2V5cy5BUlJPV19SSUdIVCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnksIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgdmVydGljYWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX1VQLCBLZXlzXzEuS2V5cy5BUlJPV19ET1dOKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgYXBwbHlBeGlzTW92ZW1lbnQoY3VycmVudFNwZWVkLCBhY2NlbGVyYXRpb24sIGRlbHRhTXMsIGtleSwgbmVnYXRpdmVLZXksIHBvc2l0aXZlS2V5KSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgaWYgKGtleSA9PT0gbmVnYXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkIC0gZGVsdGE7XG4gICAgICAgIGlmIChrZXkgPT09IHBvc2l0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCArIGRlbHRhO1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGN1cnJlbnRTcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhjdXJyZW50U3BlZWQpIC0gZGVsdGEsIDApO1xuICAgIH1cbn1cbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNZW51TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICAoKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoKSAvIDI7XG4gICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCArPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24udmVsb2NpdHkgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IDA7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IE1lbnVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICh0aGlzLmlzUGxheWVyU3R1bm5lZER1cmluZ1BsYXkocGxheWVyLCBnYW1lV29ybGQpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNQbGF5ZXJMb3NlZEdhbWUocGxheWVyLCBnYW1lV29ybGQpKSk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUpIHtcbiAgICAgICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5mb3JjZVN0dW5uZWQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IHBsYXllci5tYXhTcGVlZFdpdGhCYWxsIC8gNSkge1xuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tYXhTcGVlZFdpdGhCYWxsIC8gMTU7XG4gICAgICAgICAgICBsZXQgYW5nbGUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgICAgICBhbmdsZSA9IGFuZ2xlICsgKE1hdGguUEkgLyAzMCkgKiBkZWx0YU1zICogMC4wNTtcbiAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaXNQbGF5ZXJTdHVubmVkRHVyaW5nUGxheShwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCk7XG4gICAgfVxuICAgIGhhc1BsYXllckxvc2VkR2FtZShwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCB3aW5uaW5nUGxheWVyU2lkZSA9IGdhbWVXb3JsZC5zY29yZS5nZXRXaW5uaW5nUGxheWVyU2lkZSgpO1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSAmJlxuICAgICAgICAgICAgd2lubmluZ1BsYXllclNpZGUgIT09IG51bGwgJiZcbiAgICAgICAgICAgIHdpbm5pbmdQbGF5ZXJTaWRlICE9PSBwbGF5ZXIuc2lkZSk7XG4gICAgfVxufVxuZXhwb3J0cy5TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5zdWJQb3NpdGlvbnNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCB0aGlzLmdldFN1YnN0aXR1dGlvbkRlc3RpbmF0aW9ucyhQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKSk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgdGhpcy5nZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT04gJiYgIXBsYXllci5pc1N1YnN0aXR1dGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyRGVzdGluYXRpb25Qb2ludE1hcC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTGlzdCA9IHRoaXMuc3ViUG9zaXRpb25zTWFwLmdldChwbGF5ZXIuc2lkZSk7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvbkxpc3QgPT09IHVuZGVmaW5lZCB8fCBkZXN0aW5hdGlvbkxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uUG9pbnQgPSB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuZ2V0KHBsYXllcik7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvblBvaW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9pbnQgPSBkZXN0aW5hdGlvbkxpc3RbMF07XG4gICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgZGVzdGluYXRpb25Qb2ludCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IChwbGF5ZXIubWF4U3BlZWRXaXRoQmFsbCAqIDIpIC8gMztcbiAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24gPSBkZXN0aW5hdGlvblBvaW50LnBvaW50O1xuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgICAgIGlmIChwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgZGVzdGluYXRpb25Qb2ludC5hY3Rpb24ocGxheWVyLCBnYW1lV29ybGQpO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBkZXN0aW5hdGlvbkxpc3QuZmluZEluZGV4KGRlc3RpbmF0aW9uUG9pbnQgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmFyZVBvaW50RXF1YWxzKGRlc3RpbmF0aW9uUG9pbnQucG9pbnQsIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW5kZXggPCBkZXN0aW5hdGlvbkxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyRGVzdGluYXRpb25Qb2ludE1hcC5zZXQocGxheWVyLCBkZXN0aW5hdGlvbkxpc3RbaW5kZXggKyAxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbmRleCA+PSBkZXN0aW5hdGlvbkxpc3QubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyRGVzdGluYXRpb25Qb2ludE1hcC5zZXQocGxheWVyLCBuZXcgUG9pbnRXaXRoQWN0aW9uKHBsYXllci5pbml0aWFsUG9zaXRpb24sICgpID0+IHsgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGdldFN1YnN0aXR1dGlvbkRlc3RpbmF0aW9ucyhwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGNvbnN0IHggPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArXG4gICAgICAgICAgICAocGxheWVyU2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgID8gdGhpcy5nYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYXG4gICAgICAgICAgICAgICAgOiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLSB0aGlzLmdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFgpO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbmV3IFBvaW50V2l0aEFjdGlvbihuZXcgUG9pbnRfMS5Qb2ludCh4LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlciAvIDIpLCAoKSA9PiB7IH0pLFxuICAgICAgICAgICAgbmV3IFBvaW50V2l0aEFjdGlvbihuZXcgUG9pbnRfMS5Qb2ludCh4LCB0aGlzLmdhbWVDb25maWdzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCksIChwbGF5ZXIsIGdhbWVXb3JsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGdhbWVXb3JsZC5zd2l0Y2hQbGF5ZXJDb2xvcihwbGF5ZXIuc2lkZSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5ldyBQb2ludFdpdGhBY3Rpb24obmV3IFBvaW50XzEuUG9pbnQoeCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIpLCAoKSA9PiB7IH0pLFxuICAgICAgICBdO1xuICAgIH1cbn1cbmV4cG9ydHMuU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5ID0gU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5O1xuY2xhc3MgUG9pbnRXaXRoQWN0aW9uIHtcbiAgICBjb25zdHJ1Y3Rvcihwb2ludCwgYWN0aW9uKSB7XG4gICAgICAgIHRoaXMucG9pbnQgPSBwb2ludDtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuaXNTdGF0dXNDaGFuZ2VkUmVjZW50bHkoKSkge1xuICAgICAgICAgICAgcGxheWVyLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuc2NvcmUuZ2V0V2lubmluZ1BsYXllclNpZGUoKSA9PT0gcGxheWVyLnNpZGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGg7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24uYWNjZWxlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPVxuICAgICAgICAgICAgICAgIHBsYXllci5ub3JtYWxNYXhTcGVlZCAqIDIgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgdHNfYnVzXzEgPSByZXF1aXJlKFwidHMtYnVzXCIpO1xuY29uc3QgRXZlbnRCdXNVdGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9FdmVudEJ1c1V0aWxpdGllc1wiKTtcbmNvbnN0IEJhbGxfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9CYWxsXCIpO1xuY29uc3QgRXhwbG9zaW9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRXhwbG9zaW9uXCIpO1xuY29uc3QgRmlyZXdvcmtzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRmlyZXdvcmtzXCIpO1xuY29uc3QgR2F0ZV8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0dhdGVcIik7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBHYW1lU3RhdHVzTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyXCIpO1xuY29uc3QgU2NvcmVNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvU2NvcmVNYW5hZ2VyXCIpO1xuY2xhc3MgR2FtZVdvcmxkIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ29hbFBvc3RzID0gbmV3IEdvYWxQb3N0c18xLkdvYWxQb3N0cyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuYmFsbCA9IG5ldyBCYWxsXzEuQmFsbChnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gbmV3IEZpcmV3b3Jrc18xLkZpcmV3b3JrcyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9uID0gbmV3IEV4cGxvc2lvbl8xLkV4cGxvc2lvbihnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZ2F0ZXMgPSBuZXcgR2F0ZV8xLkdhdGUoKTtcbiAgICAgICAgY29uc3QgYnVzID0gbmV3IHRzX2J1c18xLkV2ZW50QnVzKCk7XG4gICAgICAgIHRoaXMuc2NvcmUgPSBuZXcgU2NvcmVNYW5hZ2VyXzEuU2NvcmVNYW5hZ2VyKCk7XG4gICAgICAgIGNvbnN0IHBsYXlJbWcgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgICAgICB0aGlzLm1lbnVCdXR0b24gPSBuZXcgTWVudUJ1dHRvbl8xLk1lbnVCdXR0b24oZ2FtZUNvbmZpZ3MsIHBsYXlJbWcud2lkdGgsIHBsYXlJbWcuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlciA9IG5ldyBHYW1lU3RhdHVzTWFuYWdlcl8xLkdhbWVTdGF0dXNNYW5hZ2VyKGJ1cyk7XG4gICAgICAgIGJ1cy5zdWJzY3JpYmUoRXZlbnRCdXNVdGlsaXRpZXNfMS5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5wYXlsb2FkID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldEVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICB0aGlzLnNjb3JlLmluY3JlYXNlU2NvcmUocGxheWVyU2lkZSk7XG4gICAgICAgIGlmICh0aGlzLnNjb3JlLmlzU3Vic3RpdHV0aW9uVGltZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBwbGF5ZXIucmVzZXRPbkdvYWwoKTtcbiAgICAgICAgICAgIHBsYXllci5wb3dlclNob3RXcmFwcGVyLnVwZGF0ZVNjb3JlZEdvYWwocGxheWVyU2lkZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5iYWxsLmJhbGxQb3dlclNob3QuaXNQb3dlclNob3QpIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9zaW9uLmFkZEV4cGxvc2lvbih0aGlzLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5iYWxsLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90VHlwZSgpID8/IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RUeXBlLkZJUkUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFsbC5yZXNldE9uR29hbCgpO1xuICAgICAgICBpZiAodGhpcy5zY29yZS5pc0dhbWVPdmVyKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSk7XG4gICAgICAgICAgICB0aGlzLmZpcmV3b3Jrcy5pbml0RmlyZXdvcmtzKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKEZpcmV3b3Jrc18xLkZpcmV3b3Jrcy5hbmltYXRpb25UaW1lLCBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKTtcbiAgICAgICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnBvd2VyU2hvdFdyYXBwZXIucmVzZXRQb3dlclNob3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN3aXRjaFBsYXllckNvbG9yKHBsYXllclNpZGUpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcGxheWVyLnNpZGUgPT09IHBsYXllclNpZGU7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4gcGxheWVyLnN3aXRjaENvbG9ySW5kZXgoKSk7XG4gICAgfVxuICAgIHJlc2V0RW5kR2FtZSgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHBsYXllci5yZXNldE9uR29hbCgpKTtcbiAgICAgICAgdGhpcy5iYWxsLnJlc2V0T25Hb2FsKCk7XG4gICAgICAgIHRoaXMuc2NvcmUucmVzZXQoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVXb3JsZCA9IEdhbWVXb3JsZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0tleXNcIik7XG5jbGFzcyBLZXlib2FyZElucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJlc3NlZEtleXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMub25LZXlEb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmFkZChldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uS2V5VXAgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuZGVsZXRlKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25LZXlEb3duKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXlVcCk7XG4gICAgfVxuICAgIGlzS2V5UHJlc3NlZChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlc3NlZEtleXMuaGFzKGtleSk7XG4gICAgfVxuICAgIGdldERpcmVjdGlvblByZXNzZWQoZGlyZWN0aW9uKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMucHJlc3NlZEtleXMpIHtcbiAgICAgICAgICAgIGlmIChLZXlzXzEuS2V5c1V0aWxpdGllcy5nZXRLZXlEaXJlY3Rpb24oa2V5KSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gS2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNb3VzZUlucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTW91c2VNb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCwgZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICB9XG59XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gTW91c2VJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEJhbGxSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvQmFsbFJlbmRlclwiKTtcbmNvbnN0IEV4cGxvc2lvblJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9FeHBsb3Npb25SZW5kZXJcIik7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9GaWVsZFJlbmRlclwiKTtcbmNvbnN0IEZpcmV3b3Jrc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9GaXJld29ya3NSZW5kZXJcIik7XG5jb25zdCBHYXRlc1JlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9HYXRlc1JlbmRlclwiKTtcbmNvbnN0IE1lbnVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvTWVudVJlbmRlclwiKTtcbmNvbnN0IFBsYXllclBvd2VyU2hvdFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9QbGF5ZXJQb3dlclNob3RSZW5kZXJcIik7XG5jb25zdCBQbGF5ZXJSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvUGxheWVyUmVuZGVyXCIpO1xuY29uc3QgU2NvcmVSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvU2NvcmVSZW5kZXJcIik7XG5jbGFzcyBNYWluUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlciA9IGRvbUhhbmRsZXI7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBGaWVsZFJlbmRlcl8xLkZpZWxkUmVuZGVyKGRvbUhhbmRsZXIuYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgU2NvcmVSZW5kZXJfMS5TY29yZVJlbmRlcihkb21IYW5kbGVyLnNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEJhbGxSZW5kZXJfMS5CYWxsUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBHYXRlc1JlbmRlcl8xLkdhdGVzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBQbGF5ZXJSZW5kZXJfMS5QbGF5ZXJSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBFeHBsb3Npb25SZW5kZXJfMS5FeHBsb3Npb25SZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCkpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgTWVudVJlbmRlcl8xLk1lbnVSZW5kZXIoZG9tSGFuZGxlci5tZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IFBsYXllclBvd2VyU2hvdFJlbmRlcl8xLlBsYXllclBvd2VyU2hvdFJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBhc3NldExvYWRlciwgZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEZpcmV3b3Jrc1JlbmRlcl8xLkZpcmV3b3Jrc1JlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0KSk7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLnJlbmRlcnMuZm9yRWFjaChyZW5kZXIgPT4gcmVuZGVyLnJlbmRlcihnYW1lV29ybGQpKTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZG9tSGFuZGxlci5nYW1lQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMud2lkdGgsIHRoaXMuZG9tSGFuZGxlci5nYW1lQ2FudmFzLmhlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluUmVuZGVyID0gTWFpblJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBCYWxsUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhSZXNpemVGYWN0b3IgPSAyO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy50cmFqZWN0b3J5TWF4RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDM7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbCA9IGdhbWVXb3JsZC5iYWxsO1xuICAgICAgICB0aGlzLnJlbmRlckJhbGxUcmFqZWN0b3J5KGJhbGwpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HIHx8XG4gICAgICAgICAgICAoKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgfHxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgfHxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTikgJiZcbiAgICAgICAgICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSk7XG4gICAgICAgICAgICBsZXQgcmVzaXplRmFjdG9yID0gMTtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgIT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgcmVzaXplRmFjdG9yID1cbiAgICAgICAgICAgICAgICAgICAgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpIC8gYmFsbC5tYXhTcGVlZCkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMubWF4UmVzaXplRmFjdG9yIC0gMSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2NhbGUocmVzaXplRmFjdG9yLCAxKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMzMzM1wiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbEJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMzMzAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxuICAgIHJlbmRlckJhbGxUcmFqZWN0b3J5KGJhbGwpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjMTExMTExXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMxMTExMTFcIjtcbiAgICAgICAgYmFsbC5wb3NpdGlvbkhpc3RvcnkucG9zaXRpb25zLmZvckVhY2goKHBvc2l0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKGluZGV4IDwgYmFsbC5wb3NpdGlvbkhpc3RvcnkucG9zaXRpb25zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0UG9zaXRpb24gPSBiYWxsLnBvc2l0aW9uSGlzdG9yeS5wb3NpdGlvbnNbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICBpZiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShwb3NpdGlvbi5wb3NpdGlvbiwgbmV4dFBvc2l0aW9uLnBvc2l0aW9uKSA8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhamVjdG9yeU1heERpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxIC0gYmFsbC5wb3NpdGlvbkhpc3RvcnkuZ2V0RmFjdG9yKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5tb3ZlVG8ocG9zaXRpb24ucG9zaXRpb24ueCwgcG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVRvKG5leHRQb3NpdGlvbi5wb3NpdGlvbi54LCBuZXh0UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUmVuZGVyID0gQmFsbFJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FeHBsb3Npb25SZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBFeHBsb3Npb25SZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBleHBsb3Npb24gPSBnYW1lV29ybGQuZXhwbG9zaW9uO1xuICAgICAgICBleHBsb3Npb24uY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCB4ID0gZXhwbG9zaW9uLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudC5hbmdsZSkgKiBjb21wb25lbnQuZ2V0RmFjdG9yKCkgKiBleHBsb3Npb24ubWF4RGlzdGFuY2U7XG4gICAgICAgICAgICBjb25zdCB5ID0gZXhwbG9zaW9uLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudC5hbmdsZSkgKiBjb21wb25lbnQuZ2V0RmFjdG9yKCkgKiBleHBsb3Npb24ubWF4RGlzdGFuY2U7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gKDEgLSBjb21wb25lbnQuZ2V0RmFjdG9yKCkpICogZXhwbG9zaW9uLm1heFNpemU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYyh4LCB5LCBzaXplLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb21wb25lbnQuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5FeHBsb3Npb25SZW5kZXIgPSBFeHBsb3Npb25SZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmllbGRSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImdvYWxfZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLnRyYWNrRmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBpZiAodGhpcy5hbHJlYWR5UmVuZGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmVuZGVyQmFja2dyb3VuZCgpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5maWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgIH1cbiAgICByZW5kZXJCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKiAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNBQUFBQUFcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja1lPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrSGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gRmllbGRSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmlyZXdvcmtzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmlyZXdvcmtzUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLmZpcmV3b3Jrcy5maXJld29ya3MuZm9yRWFjaChmaXJld29yayA9PiB7XG4gICAgICAgICAgICBpZiAoZmlyZXdvcmsuaXNGaXJpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRmlyZXdvcmsoZmlyZXdvcmssIGdhbWVXb3JsZC5maXJld29ya3MubGluZVdpZHRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckZpcmV3b3JrKGZpcmV3b3JrLCBsaW5lV2lkdGgpIHtcbiAgICAgICAgZmlyZXdvcmsuY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCBsZW5naHQgPSBmaXJld29yay5nZXRMZW5naHQoKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVGYWN0b3IgPSBmaXJld29yay5nZXRUaW1lRmFjdG9yKCk7XG4gICAgICAgICAgICBjb25zdCB4MSA9IGZpcmV3b3JrLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gLSBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB5MSA9IGZpcmV3b3JrLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gLSBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB4MiA9IGZpcmV3b3JrLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKyBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB5MiA9IGZpcmV3b3JrLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKyBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb21wb25lbnRbXCJjb2xvclwiXTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubW92ZVRvKE1hdGgucm91bmQoeDEpLCBNYXRoLnJvdW5kKHkxKSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVUbyhNYXRoLnJvdW5kKHgyKSwgTWF0aC5yb3VuZCh5MikpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya3NSZW5kZXIgPSBGaXJld29ya3NSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBHYXRlc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gZ2FtZVdvcmxkLmdhdGVzLmN1cnJlbnRBbmdsZTtcbiAgICAgICAgdGhpcy5yZW5kZXJTaW5nbGVHYXRlKGFuZ2xlLCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyKTtcbiAgICAgICAgdGhpcy5yZW5kZXJTaW5nbGVHYXRlKE1hdGguUEkgLSBhbmdsZSwgdGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgfVxuICAgIHJlbmRlclNpbmdsZUdhdGUoYW5nbGUsIHgpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYwMDAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoeCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSBHYXRlc1JlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIE1lbnVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKG1lbnVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmhvdmVyRmFjdG9yID0gMS4zO1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0ID0gbWVudUNvbnRleHQ7XG4gICAgICAgIHRoaXMucGxheUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IDEgKyAodGhpcy5ob3ZlckZhY3RvciAtIDEpICogZ2FtZVdvcmxkLm1lbnVCdXR0b24uaG92ZXJQcm9ncmVzcztcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoICogc2NhbGU7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnBsYXlJbWFnZSwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueCAtXG4gICAgICAgICAgICAgICAgKHdpZHRoIC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoKSAvIDIsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnkgLVxuICAgICAgICAgICAgICAgIChoZWlnaHQgLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0KSAvIDIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5NZW51UmVuZGVyID0gTWVudVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJQb3dlclNob3RSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBFbGVjdHJpY1Bvd2VyU2hvdF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9FbGVjdHJpY1Bvd2VyU2hvdFwiKTtcbmNvbnN0IEZpcmVQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRmlyZVBvd2VyU2hvdFwiKTtcbmNsYXNzIFBsYXllclBvd2VyU2hvdFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGFzc2V0TG9hZGVyLCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNlbGxzUGVyUm93ID0gNDtcbiAgICAgICAgdGhpcy5jZWxsc1BlckNvbHVtbiA9IDQ7XG4gICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdE51bWJlciA9IDM7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmZsYW1lSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcIlJlZFBhcnRpY2xlLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5jZWxsV2lkdGggPSB0aGlzLmZsYW1lSW1hZ2Uud2lkdGggLyB0aGlzLmNlbGxzUGVyUm93O1xuICAgICAgICB0aGlzLmNlbGxIZWlnaHQgPSB0aGlzLmZsYW1lSW1hZ2UuaGVpZ2h0IC8gdGhpcy5jZWxsc1BlckNvbHVtbjtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb3dlclNob3RFbnRpdGllcyA9IHBsYXllci5wb3dlclNob3RXcmFwcGVyLnBvd2VyU2hvdEVudGl0aWVzO1xuICAgICAgICAgICAgcG93ZXJTaG90RW50aXRpZXMuZm9yRWFjaChwb3dlclNob3RFbnRpdHkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwb3dlclNob3RFbnRpdHkuc2hvdWxkUmVuZGVyKHBsYXllcikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvd2VyU2hvdEVudGl0eSBpbnN0YW5jZW9mIEZpcmVQb3dlclNob3RfMS5GaXJlUG93ZXJTaG90KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpcmVQb3dlclNob3QocG93ZXJTaG90RW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwb3dlclNob3RFbnRpdHkgaW5zdGFuY2VvZiBFbGVjdHJpY1Bvd2VyU2hvdF8xLkVsZWN0cmljUG93ZXJTaG90KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckVsZWN0cmljUG93ZXJTaG90KHBsYXllciwgcG93ZXJTaG90RW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyRmlyZVBvd2VyU2hvdChmaXJlUG93ZXJTaG90KSB7XG4gICAgICAgIGZpcmVQb3dlclNob3QuZmxhbWVzLmZvckVhY2goZmxhbWUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGZsYW1lLmdldER1cmF0aW9uRmFjdG9yKCkgKiAoZmlyZVBvd2VyU2hvdC5tYXhTaXplIC0gZmlyZVBvd2VyU2hvdC5taW5TaXplKSArXG4gICAgICAgICAgICAgICAgZmlyZVBvd2VyU2hvdC5taW5TaXplO1xuICAgICAgICAgICAgY29uc3QgYWxwaGEgPSAxIC0gZmxhbWUuZ2V0RHVyYXRpb25GYWN0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd0luZGV4ID0gTWF0aC5mbG9vcihmbGFtZS5pbmRleCAvIHRoaXMuY2VsbHNQZXJSb3cpO1xuICAgICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBmbGFtZS5pbmRleCAlIHRoaXMuY2VsbHNQZXJSb3c7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSBhbHBoYTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmxhbWVJbWFnZSwgdGhpcy5jZWxsV2lkdGggKiByb3dJbmRleCwgdGhpcy5jZWxsSGVpZ2h0ICogY29sdW1uSW5kZXgsIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQsIE1hdGgucm91bmQoZmxhbWUucG9zaXRpb24ueCAtIHNpemUgLyAyKSwgTWF0aC5yb3VuZChmbGFtZS5wb3NpdGlvbi55IC0gc2l6ZSAvIDIpLCBNYXRoLnJvdW5kKHNpemUpLCBNYXRoLnJvdW5kKHNpemUpKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyRWxlY3RyaWNQb3dlclNob3QocGxheWVyLCBlbGVjdHJpY1Bvd2VyU2hvdCkge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgY29uc3QgZ3JhZGllbnQgPSB0aGlzLmdhbWVDb250ZXh0LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgLyA1LCBwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsIFwiI0ZGRkZGRlwiKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsIFwidHJhbnNwYXJlbnRcIik7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShlbGVjdHJpY1Bvd2VyU2hvdC5hbmdsZU9mZnNldCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saWdodG5pbmdCb2x0TnVtYmVyOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKE1hdGguUEkgLyB0aGlzLmxpZ2h0bmluZ0JvbHROdW1iZXIpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5nbG9iYWxBbHBoYSA9IDAuNTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZWxlY3RyaWNQb3dlclNob3QubGlnaHRuaW5nQm9sdFNpemUgLSAxOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb2ludCA9IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5W2pdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQb2ludCA9IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5W2ogKyAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gZWxlY3RyaWNQb3dlclNob3QuYmlnTGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubW92ZVRvKHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVRvKG5leHRQb2ludC54LCBuZXh0UG9pbnQueSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChlbGVjdHJpY1Bvd2VyU2hvdC53aGl0ZUxpbmVWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gZWxlY3RyaWNQb3dlclNob3QubGluZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8obmV4dFBvaW50LngsIG5leHRQb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJQb3dlclNob3RSZW5kZXIgPSBQbGF5ZXJQb3dlclNob3RSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBQbGF5ZXJSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5jb2xvck1hcCA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiTEVGVC0wXCIsIFwiIzAwODAwMFwiXSxcbiAgICAgICAgICAgIFtcIkxFRlQtMVwiLCBcIiMzMzgwODhcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0wXCIsIFwiI0ZGQTUwMFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTFcIiwgXCIjRkZGRjAwXCJdLFxuICAgICAgICBdKTtcbiAgICAgICAgdGhpcy5zdHVubmVkQ29sb3IgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5ib3JkZXJDb2xvciA9IFwiIzAwMzMwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5zdGFySW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInN0YXIucG5nXCIpO1xuICAgICAgICB0aGlzLnN0YXJNYXhTaXplID0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgdGhpcy5zdGFydE1heERpc3RhbmNlID0gdGhpcy5zdGFyTWF4U2l6ZSAqIDU7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleSA9IGAke3BsYXllci5zaWRlfS0ke3BsYXllci5jb2xvckluZGV4fWA7XG4gICAgICAgICAgICBjb25zdCBpc1N0dW5uZWQgPSBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRDtcbiAgICAgICAgICAgIGxldCBjb2xvciA9IGlzU3R1bm5lZCA/IHRoaXMuc3R1bm5lZENvbG9yIDogdGhpcy5jb2xvck1hcC5nZXQoY29sb3JLZXkpO1xuICAgICAgICAgICAgaWYgKGNvbG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlckNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLnBsYXllckJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpLCBNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpKTtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gcGxheWVyLmJvdW5jZVdyYXBwZXIuZ2V0Qm91bmNpbmdBbXBsaXR1ZGUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2NhbGUoMSAtIHNjYWxlLCAxICsgc2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICBpZiAoaXNTdHVubmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJTdHVubmVkU3RhcnMocGxheWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlclN0dW5uZWRTdGFycyhwbGF5ZXIpIHtcbiAgICAgICAgcGxheWVyLnN0dW5uZWRXcmFwcGVyLnN0dW5uZWRTdGFycy5zdGFycy5mb3JFYWNoKHN0YXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBmYWN0b3IgPSBzdGFyLmdldEZhY3RvcigpO1xuICAgICAgICAgICAgY29uc3QgeCA9IHN0YXIucG9zaXRpb24ueCArIE1hdGguY29zKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgY29uc3QgeSA9IHN0YXIucG9zaXRpb24ueSArIE1hdGguc2luKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShzdGFyLmFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxIC0gZmFjdG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zdGFySW1hZ2UsIC10aGlzLnN0YXJNYXhTaXplIC8gMiwgLXRoaXMuc3Rhck1heFNpemUgLyAyLCB0aGlzLnN0YXJNYXhTaXplLCB0aGlzLnN0YXJNYXhTaXplKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllclJlbmRlciA9IFBsYXllclJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTY29yZVJlbmRlciB7XG4gICAgY29uc3RydWN0b3Ioc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZyYW1lRm9yTnVtYmVyID0gNjtcbiAgICAgICAgdGhpcy50b3RhbE51bWJlcnMgPSA5O1xuICAgICAgICB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSA9IDMwMDtcbiAgICAgICAgdGhpcy5mcmFtZVRpbWUgPSB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSAvIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgIHRoaXMuc2NvcmVGcmFtZXMgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0ID0gc2NvcmVDb250ZXh0O1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyh0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aCwgdGhpcy5kaWdpdHNJbWFnZXMuaGVpZ2h0IC8gKHRoaXMudG90YWxOdW1iZXJzICogdGhpcy5mcmFtZUZvck51bWJlciArIDEpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY29yZUFycmF5ID0gZ2FtZVdvcmxkLnNjb3JlLmdldFNjb3JlQXNBcnJheSgpO1xuICAgICAgICBzY29yZUFycmF5LmZvckVhY2goKG51bWJlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZyYW1lID0gbnVtYmVyICogdGhpcy5mcmFtZUZvck51bWJlcjtcbiAgICAgICAgICAgIGxldCBmcmFtZVRvRHJhdyA9IHRhcmdldEZyYW1lO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdICE9PSB0YXJnZXRGcmFtZSkge1xuICAgICAgICAgICAgICAgIGxldCBzdGVwID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIGdhbWVXb3JsZC5zY29yZS5sYXN0VXBkYXRlKSAvIHRoaXMuZnJhbWVUaW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zY29yZUZyYW1lc1tpbmRleF0gPiB0YXJnZXRGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGVwICo9IDI7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lVG9EcmF3ID0gTWF0aC5tYXgodGFyZ2V0RnJhbWUsIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdIC0gc3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmcmFtZVRvRHJhdyA9IE1hdGgubWluKHRhcmdldEZyYW1lLCB0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSArIHN0ZXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVUb0RyYXcgPT09IHRhcmdldEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdID0gdGFyZ2V0RnJhbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCAqIGZyYW1lVG9EcmF3LCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgdGhpcy5wb3NpdGlvbkFycmF5W2luZGV4XS54LCB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdLnksIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gU2NvcmVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRG9tSGFuZGxlciA9IHZvaWQgMDtcbmNsYXNzIERvbUhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBbdGhpcy5iYWNrZ3JvdW5kQ2FudmFzLCB0aGlzLmJhY2tncm91bmRDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiYmFja2dyb3VuZENhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuc2NvcmVDYW52YXMsIHRoaXMuc2NvcmVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwic2NvcmVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLmdhbWVDYW52YXMsIHRoaXMuZ2FtZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJnYW1lQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5tZW51Q2FudmFzLCB0aGlzLm1lbnVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwibWVudUNhbnZhc1wiKTtcbiAgICB9XG4gICAgc3RhdGljIGdldENhbnZhcyhpZCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gY29udGV4dCBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2NhbnZhcywgY29udGV4dF07XG4gICAgfVxufVxuZXhwb3J0cy5Eb21IYW5kbGVyID0gRG9tSGFuZGxlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gdm9pZCAwO1xuY2xhc3MgVUlJbnRlcmFjdGlvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIH1cbiAgICB1cGRhdGUoaG92ZXJhYmxlLCBvbkNsaWNrLCBkZWx0YU1zKSB7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlcmVkID0gaG92ZXJhYmxlLmNvbnRhaW5zKHRoaXMuaW5wdXQubW91c2VQb3NpdGlvbik7XG4gICAgICAgIGlmIChob3ZlcmFibGUuaG92ZXJlZCAmJiB0aGlzLmlucHV0LmlzTW91c2VQcmVzc2VkKSB7XG4gICAgICAgICAgICBvbkNsaWNrKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RlcCA9IChkZWx0YU1zIC8gaG92ZXJhYmxlLmdldFRyYW5zaXRpb25UaW1lKCkpICogKGhvdmVyYWJsZS5ob3ZlcmVkID8gMSA6IC0xKTtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyArIHN0ZXApKTtcbiAgICB9XG59XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSBVSUludGVyYWN0aW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkV2ZW50QnVzVXRpbGl0aWVzID0gdm9pZCAwO1xuY29uc3QgdHNfYnVzXzEgPSByZXF1aXJlKFwidHMtYnVzXCIpO1xuY2xhc3MgRXZlbnRCdXNVdGlsaXRpZXMge1xufVxuZXhwb3J0cy5FdmVudEJ1c1V0aWxpdGllcyA9IEV2ZW50QnVzVXRpbGl0aWVzO1xuRXZlbnRCdXNVdGlsaXRpZXMuc3RhdHVzQ2hhbmdlZEV2ZW50ID0gKDAsIHRzX2J1c18xLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbikoKShcInN0YXR1c0NoYW5nZWRcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSB2b2lkIDA7XG5jbGFzcyBHYW1lQ29uZmlncyB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCkge1xuICAgICAgICB0aGlzLnBsYXllckJvcmRlciA9IDI7XG4gICAgICAgIHRoaXMuYmFsbEJvcmRlciA9IDE7XG4gICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNXaWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXNIZWlnaHQ7XG4gICAgICAgIHRoaXMuZmllbGRIZWlnaHQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAqIDQuNSkgLyA2KTtcbiAgICAgICAgdGhpcy5maWVsZFhPZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAxNik7XG4gICAgICAgIHRoaXMuZmllbGRXaWR0aCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAtIHRoaXMuZmllbGRYT2Zmc2V0ICogMik7XG4gICAgICAgIHRoaXMuZ29hbEhlaWdodCA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDUpO1xuICAgICAgICB0aGlzLmdvYWxZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5maWVsZEhlaWdodCAtIHRoaXMuZ29hbEhlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdFJhZGl1cyA9IE1hdGgucm91bmQodGhpcy5nb2FsSGVpZ2h0IC8gMjApO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgPSBNYXRoLnJvdW5kKCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0KSAqIDUpIC8gNyk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLmZsb29yKHRoaXMuZmllbGRIZWlnaHQgLyAyOCk7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICsgdGhpcy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCA9IE1hdGgucm91bmQodGhpcy5maWVsZFdpZHRoIC8gNCk7XG4gICAgICAgIHRoaXMucGxheWVyU3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB0aGlzLmNwdVN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArICh0aGlzLmZpZWxkV2lkdGggLSB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFgpO1xuICAgICAgICB0aGlzLnNoYWRvd0JsdXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICB0aGlzLnNoYWRvd09mZnNldCA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjM7XG4gICAgICAgIHRoaXMuZmllbGRCb3JkZXJTaXplID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gMTAwKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldCA9IHRoaXMuZmllbGRXaWR0aCAvIDg7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQgPSB0aGlzLmZpZWxkSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQgPVxuICAgICAgICAgICAgdGhpcy5maWVsZEhlaWdodCArIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgKyB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLmdhdGVzTGVuZ3RoID0gdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciAqIDMuNTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA4MCk7XG4gICAgICAgIHRoaXMuYmFsbFNpemVXaXRoQm9yZGVyID0gdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLmJhbGxCb3JkZXI7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSB0cnVlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91aS9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
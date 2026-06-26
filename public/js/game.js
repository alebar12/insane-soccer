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
    }
    updateInputs(delta) {
        this.uiInteractionSystem.update(this.gameWorld.menuButton, () => {
            if (this.gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.MENU) {
                this.gameWorld.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
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
    resetOnGoal() {
        this.ballStatus = BallStatus_1.BallStatus.FREE;
        this.attachedPlayer = null;
    }
}
exports.Ball = Ball;


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
const StunnedStars_1 = __webpack_require__(/*! ./StunnedStars */ "./src/game/entities/StunnedStars.ts");
class Player {
    constructor(gameConfigs, isCpu, isSubstitute, side, colorIndex) {
        this.bouncingStartTime = 0;
        this.bounceTime = 2000;
        this.bounceMaxAmplitude = 0.5;
        this.bounceExponentialFactor = 0.00346;
        this.bounceNumber = 5;
        this.movementPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.initialPosition = new Point_1.Point(0, 0);
        this.destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(0, 0), new Point_1.Point(0, 0), 0, 0);
        this.currentMaxSpeed = 0;
        this.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
        this.stunnedValue = 0;
        this.stunnedStartTime = 0;
        this.stunnedStars = new StunnedStars_1.StunnedStars();
        this.stunnedMaxValue = 2000;
        this.stunnedStep = 1000;
        this.stunnedTime = 3000;
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
    startBouncing() {
        if (this.getBouncingProgress() > this.bounceTime / 2 && this.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
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
    updateStunnedValue(otherPlayerSpeed) {
        if (this.playerStatus !== PlayerStatus_1.PlayerStatus.STUNNED) {
            const speed = this.movementPosition.getSpeed();
            if (speed > otherPlayerSpeed) {
                this.stunnedValue = Math.max(0, this.stunnedValue - this.stunnedStep);
            }
            else if (speed < otherPlayerSpeed) {
                this.stunnedValue += this.stunnedStep;
            }
            if (this.stunnedValue > this.stunnedMaxValue) {
                this.playerStatus = PlayerStatus_1.PlayerStatus.STUNNED;
                this.stunnedStartTime = Date.now();
            }
        }
    }
    decrementStunnedValue(deltaMs) {
        if (this.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL) {
            this.stunnedValue = Math.max(0, this.stunnedValue - deltaMs / 2);
        }
        else if (this.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED) {
            this.stunnedStars.update(deltaMs, this.movementPosition.position);
            if (Date.now() - this.stunnedStartTime > this.stunnedTime) {
                this.playerStatus = PlayerStatus_1.PlayerStatus.NORMAL;
                this.stunnedValue = 0;
                this.stunnedStars.stars = [];
            }
        }
    }
    resetOnGoal() {
        this.bouncingStartTime = 0;
        this.stunnedValue = 0;
        this.stunnedStars.stars = [];
    }
    getBouncingProgress() {
        return Date.now() - this.bouncingStartTime;
    }
    isBouncing() {
        return this.getBouncingProgress() <= this.bounceTime;
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

/***/ "./src/game/entities/StunnedStars.ts"
/*!*******************************************!*\
  !*** ./src/game/entities/StunnedStars.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StarDto = exports.StunnedStars = void 0;
const Point_1 = __webpack_require__(/*! ../geometry/Point */ "./src/game/geometry/Point.ts");
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
exports.PlayerSide = void 0;
var PlayerSide;
(function (PlayerSide) {
    PlayerSide["LEFT"] = "LEFT";
    PlayerSide["RIGHT"] = "RIGHT";
})(PlayerSide || (exports.PlayerSide = PlayerSide = {}));


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
}
exports.Point = Point;


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
const EventBusUtilities_1 = __webpack_require__(/*! ../../utils/EventBusUtilities */ "./src/utils/EventBusUtilities.ts");
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerSide_1 = __webpack_require__(/*! ../enums/PlayerSide */ "./src/game/enums/PlayerSide.ts");
class ScoreManager {
    constructor(bus) {
        this.leftScore = 0;
        this.rightScore = 0;
        this.lastUpdateTime = 0;
        this.lastSideUpdated = PlayerSide_1.PlayerSide.LEFT;
        this.maxScore = 1;
        this.bus = bus;
        this.bus.subscribe(EventBusUtilities_1.EventBusUtilities.statusChangedEvent, event => {
            if (event.payload === GameStatus_1.GameStatus.MENU) {
                this.reset();
            }
        });
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
    get isGameOver() {
        return this.leftScore === this.maxScore || this.rightScore === this.maxScore;
    }
}
exports.ScoreManager = ScoreManager;


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
const CollisionSystem_1 = __webpack_require__(/*! ./collision/CollisionSystem */ "./src/game/systems/collision/CollisionSystem.ts");
const MovementSystem_1 = __webpack_require__(/*! ./movement/MovementSystem */ "./src/game/systems/movement/MovementSystem.ts");
class MainSystem {
    constructor(gameConfigs) {
        this.systems = new Array();
        this.systems.push(new MovementSystem_1.MovementSystem(gameConfigs, new KeyboardInputManager_1.KeyboardInputManager()));
        this.systems.push(new CollisionSystem_1.CollisionSystem(gameConfigs));
    }
    update(gameWorld, deltaMs) {
        this.systems.forEach(system => system.update(gameWorld, deltaMs));
    }
}
exports.MainSystem = MainSystem;


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
    handleBorderCollision(movementPoint, borderLimits, invertSpeed, avoidBounceOnGoal = true) {
        const cfg = this.gameConfigs;
        const isInGoalYRange = !avoidBounceOnGoal &&
            movementPoint.position.y >= cfg.goalYOffset &&
            movementPoint.position.y <= cfg.goalYOffset + cfg.goalHeight;
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
        if (movementPoint.position.y > borderLimits.bottom) {
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
            gameWorld.increaseScore(playerSide);
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
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME) &&
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

"use strict";

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
            const hasCollided = this.handleBorderCollision(player.movementPosition, this.getFieldBorderLimits(player.movementPosition.size), false);
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
            humanPlayer.updateStunnedValue(cpuPlayer.movementPosition.getSpeed());
            cpuPlayer.updateStunnedValue(humanPlayer.movementPosition.getSpeed());
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
const PlayingFreeBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/PlayingFreeBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/PlayingFreeBallMovementStrategy.ts");
const WaitingBallBallMovementStrategy_1 = __webpack_require__(/*! ./ballStrategies/WaitingBallBallMovementStrategy */ "./src/game/systems/movement/ballStrategies/WaitingBallBallMovementStrategy.ts");
const InputPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/InputPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/InputPlayerMovementStrategy.ts");
const MenuMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/MenuMovementStrategy */ "./src/game/systems/movement/playersStrategies/MenuMovementStrategy.ts");
const StunnedPlayerMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/StunnedPlayerMovementStrategy */ "./src/game/systems/movement/playersStrategies/StunnedPlayerMovementStrategy.ts");
const WaitingBallMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/WaitingBallMovementStrategy */ "./src/game/systems/movement/playersStrategies/WaitingBallMovementStrategy.ts");
class MovementSystem {
    constructor(gameConfigs, keyboardInputManager) {
        this.playerStrategies = [];
        this.ballStrategies = [];
        this.playerStrategies.push(new MenuMovementStrategy_1.MenuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new WaitingBallMovementStrategy_1.WaitingBallMovementStrategy());
        this.playerStrategies.push(new InputPlayerMovementStrategy_1.InputPlayerMovementStrategy(keyboardInputManager));
        //this.playerStrategies.push(new CpuMovementStrategy(gameConfigs));
        this.playerStrategies.push(new StunnedPlayerMovementStrategy_1.StunnedPlayerMovementStrategy());
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
            player.decrementStunnedValue(deltaMs);
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
        return gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.WAITING_BALL ||
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME;
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
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.STUNNED);
    }
    apply(player, _gameWorld, deltaMs) {
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
}
exports.StunnedPlayerMovementStrategy = StunnedPlayerMovementStrategy;


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

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameWorld = void 0;
const ts_bus_1 = __webpack_require__(/*! ts-bus */ "./node_modules/ts-bus/index.js");
const Ball_1 = __webpack_require__(/*! ../entities/Ball */ "./src/game/entities/Ball.ts");
const GoalPosts_1 = __webpack_require__(/*! ../entities/GoalPosts */ "./src/game/entities/GoalPosts.ts");
const MenuButton_1 = __webpack_require__(/*! ../entities/MenuButton */ "./src/game/entities/MenuButton.ts");
const Player_1 = __webpack_require__(/*! ../entities/Player */ "./src/game/entities/Player.ts");
const GameStatus_1 = __webpack_require__(/*! ../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
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
        const bus = new ts_bus_1.EventBus();
        this.score = new ScoreManager_1.ScoreManager(bus);
        const playImg = assetLoader.getImage("play.png");
        this.menuButton = new MenuButton_1.MenuButton(gameConfigs, playImg.width, playImg.height);
        this.gameStatusManager = new GameStatusManager_1.GameStatusManager(bus);
    }
    increaseScore(playerSide) {
        this.score.increaseScore(playerSide);
        this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.WAITING_BALL);
        this.players.forEach(player => player.resetOnGoal());
        this.ball.resetOnGoal();
        if (this.score.isGameOver) {
            this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.END_GAME);
            this.gameStatusManager.scheduleStatusChange(3000, GameStatus_1.GameStatus.MENU);
        }
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
        this.renders.push(new PlayerRender_1.PlayerRender(domHandler.gameContext, gameConfigs, assetLoader));
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
                gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.END_GAME) &&
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
            const scale = player.getBouncingAmplitude();
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
        player.stunnedStars.stars.forEach(star => {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QzVCO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsNkNBQTZDO0FBQzdDLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBO0FBQ0Esc0JBQXNCLG9CQUFvQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7Ozs7Ozs7Ozs7OztBQ3hLRDtBQUNiLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxlQUFlLEdBQUcsb0JBQW9CO0FBQ3RDLGdCQUFnQixtQkFBTyxDQUFDLHVEQUFtQjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksWUFBWTtBQUN6QjtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIyL2xpYi9ldmVudGVtaXR0ZXIyLmpzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy90cy1idXMvRXZlbnRCdXMuanMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vbm9kZV9tb2R1bGVzL3RzLWJ1cy9pbmRleC5qcyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0JhbGwudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR29hbFBvc3RzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0hvdmVyYWJsZUVudGl0eS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9NZW51QnV0dG9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL1BsYXllci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9TdHVubmVkU3RhcnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvQmFsbFN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9HYW1lU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0tleXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUGxheWVyU2lkZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9QbGF5ZXJTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvQm9yZGVyTGltaXRzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvTW92ZW1lbnRQb2ludC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Qb2ludC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9tYW5hZ2Vycy9HYW1lU3RhdHVzTWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9tYW5hZ2Vycy9TY29yZU1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9NYWluU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL0NvbGxpc2lvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL1BsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9Nb3ZlbWVudFN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL1BsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvTWVudU1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL1dhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS93b3JsZC9HYW1lV29ybGQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2lucHV0L0tleWJvYXJkSW5wdXRNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01haW5SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0JhbGxSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9HYXRlc1JlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvUGxheWVyUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9TY29yZVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdWkvRG9tSGFuZGxlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdWkvVUlJbnRlcmFjdGlvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0dhbWVDb25maWdzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcclxuICogRXZlbnRFbWl0dGVyMlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vaGlqMW54L0V2ZW50RW1pdHRlcjJcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDEzIGhpajFueFxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcbiAqL1xyXG47IWZ1bmN0aW9uKHVuZGVmaW5lZCkge1xyXG5cclxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgPyBBcnJheS5pc0FycmF5IDogZnVuY3Rpb24gX2lzQXJyYXkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcclxuICB9O1xyXG4gIHZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XHJcblxyXG4gIGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcclxuICAgIGlmICh0aGlzLl9jb25mKSB7XHJcbiAgICAgIGNvbmZpZ3VyZS5jYWxsKHRoaXMsIHRoaXMuX2NvbmYpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29uZmlndXJlKGNvbmYpIHtcclxuICAgIGlmIChjb25mKSB7XHJcbiAgICAgIHRoaXMuX2NvbmYgPSBjb25mO1xyXG5cclxuICAgICAgY29uZi5kZWxpbWl0ZXIgJiYgKHRoaXMuZGVsaW1pdGVyID0gY29uZi5kZWxpbWl0ZXIpO1xyXG4gICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkID8gY29uZi5tYXhMaXN0ZW5lcnMgOiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xyXG5cclxuICAgICAgY29uZi53aWxkY2FyZCAmJiAodGhpcy53aWxkY2FyZCA9IGNvbmYud2lsZGNhcmQpO1xyXG4gICAgICBjb25mLm5ld0xpc3RlbmVyICYmICh0aGlzLl9uZXdMaXN0ZW5lciA9IGNvbmYubmV3TGlzdGVuZXIpO1xyXG4gICAgICBjb25mLnJlbW92ZUxpc3RlbmVyICYmICh0aGlzLl9yZW1vdmVMaXN0ZW5lciA9IGNvbmYucmVtb3ZlTGlzdGVuZXIpO1xyXG4gICAgICBjb25mLnZlcmJvc2VNZW1vcnlMZWFrICYmICh0aGlzLnZlcmJvc2VNZW1vcnlMZWFrID0gY29uZi52ZXJib3NlTWVtb3J5TGVhayk7XHJcblxyXG4gICAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJUcmVlID0ge307XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX21heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBsb2dQb3NzaWJsZU1lbW9yeUxlYWsoY291bnQsIGV2ZW50TmFtZSkge1xyXG4gICAgdmFyIGVycm9yTXNnID0gJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xyXG4gICAgICAgICdsZWFrIGRldGVjdGVkLiAnICsgY291bnQgKyAnIGxpc3RlbmVycyBhZGRlZC4gJyArXHJcbiAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0Lic7XHJcblxyXG4gICAgaWYodGhpcy52ZXJib3NlTWVtb3J5TGVhayl7XHJcbiAgICAgIGVycm9yTXNnICs9ICcgRXZlbnQgbmFtZTogJyArIGV2ZW50TmFtZSArICcuJztcclxuICAgIH1cclxuXHJcbiAgICBpZih0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5lbWl0V2FybmluZyl7XHJcbiAgICAgIHZhciBlID0gbmV3IEVycm9yKGVycm9yTXNnKTtcclxuICAgICAgZS5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XHJcbiAgICAgIGUuZW1pdHRlciA9IHRoaXM7XHJcbiAgICAgIGUuY291bnQgPSBjb3VudDtcclxuICAgICAgcHJvY2Vzcy5lbWl0V2FybmluZyhlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3JNc2cpO1xyXG5cclxuICAgICAgaWYgKGNvbnNvbGUudHJhY2Upe1xyXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gRXZlbnRFbWl0dGVyKGNvbmYpIHtcclxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgdGhpcy5fbmV3TGlzdGVuZXIgPSBmYWxzZTtcclxuICAgIHRoaXMuX3JlbW92ZUxpc3RlbmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLnZlcmJvc2VNZW1vcnlMZWFrID0gZmFsc2U7XHJcbiAgICBjb25maWd1cmUuY2FsbCh0aGlzLCBjb25mKTtcclxuICB9XHJcbiAgRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7IC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBleHBvcnRpbmcgRXZlbnRFbWl0dGVyIHByb3BlcnR5XHJcblxyXG4gIC8vXHJcbiAgLy8gQXR0ZW50aW9uLCBmdW5jdGlvbiByZXR1cm4gdHlwZSBub3cgaXMgYXJyYXksIGFsd2F5cyAhXHJcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXHJcbiAgLy8gZWxlbWVudHMgKGxlYWZzKSBpZiB0aGVyZSBhcmUgbWF0Y2hlc1xyXG4gIC8vXHJcbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XHJcbiAgICBpZiAoIXRyZWUpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgdmFyIGxpc3RlbmVycz1bXSwgbGVhZiwgbGVuLCBicmFuY2gsIHhUcmVlLCB4eFRyZWUsIGlzb2xhdGVkQnJhbmNoLCBlbmRSZWFjaGVkLFxyXG4gICAgICAgIHR5cGVMZW5ndGggPSB0eXBlLmxlbmd0aCwgY3VycmVudFR5cGUgPSB0eXBlW2ldLCBuZXh0VHlwZSA9IHR5cGVbaSsxXTtcclxuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBJZiBhdCB0aGUgZW5kIG9mIHRoZSBldmVudChzKSBsaXN0IGFuZCB0aGUgdHJlZSBoYXMgbGlzdGVuZXJzXHJcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XHJcbiAgICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVyc1tsZWFmXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoKGN1cnJlbnRUeXBlID09PSAnKicgfHwgY3VycmVudFR5cGUgPT09ICcqKicpIHx8IHRyZWVbY3VycmVudFR5cGVdKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcclxuICAgICAgLy8gb3IgdGhlcmUgaXMgYSBjb25jcmV0ZSBtYXRjaCBhdCB0aGlzIHBhdGNoXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XHJcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xyXG4gICAgICAgICAgaWYgKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcclxuICAgICAgfSBlbHNlIGlmKGN1cnJlbnRUeXBlID09PSAnKionKSB7XHJcbiAgICAgICAgZW5kUmVhY2hlZCA9IChpKzEgPT09IHR5cGVMZW5ndGggfHwgKGkrMiA9PT0gdHlwZUxlbmd0aCAmJiBuZXh0VHlwZSA9PT0gJyonKSk7XHJcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIFRoZSBuZXh0IGVsZW1lbnQgaGFzIGEgX2xpc3RlbmVycywgYWRkIGl0IHRvIHRoZSBoYW5kbGVycy5cclxuICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGJyYW5jaCBpbiB0cmVlKSB7XHJcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gJyonIHx8IGJyYW5jaCA9PT0gJyoqJykge1xyXG4gICAgICAgICAgICAgIGlmKHRyZWVbYnJhbmNoXS5fbGlzdGVuZXJzICYmICFlbmRSZWFjaGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcclxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzIpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVtjdXJyZW50VHlwZV0sIGkrMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHhUcmVlID0gdHJlZVsnKiddO1xyXG4gICAgaWYgKHhUcmVlKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciB0cmVlIHdpbGwgYWxsb3cgYW55IG1hdGNoIGZvciB0aGlzIHBhcnQsXHJcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcclxuICAgICAgLy9cclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4VHJlZSwgaSsxKTtcclxuICAgIH1cclxuXHJcbiAgICB4eFRyZWUgPSB0cmVlWycqKiddO1xyXG4gICAgaWYoeHhUcmVlKSB7XHJcbiAgICAgIGlmKGkgPCB0eXBlTGVuZ3RoKSB7XHJcbiAgICAgICAgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXHJcbiAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBCdWlsZCBhcnJheXMgb2YgbWF0Y2hpbmcgbmV4dCBicmFuY2hlcyBhbmQgb3RoZXJzLlxyXG4gICAgICAgIGZvcihicmFuY2ggaW4geHhUcmVlKSB7XHJcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgLy8gV2Uga25vdyB0aGUgbmV4dCBlbGVtZW50IHdpbGwgbWF0Y2gsIHNvIGp1bXAgdHdpY2UuXHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gY3VycmVudFR5cGUpIHtcclxuICAgICAgICAgICAgICAvLyBDdXJyZW50IG5vZGUgbWF0Y2hlcywgbW92ZSBpbnRvIHRoZSB0cmVlLlxyXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaXNvbGF0ZWRCcmFuY2ggPSB7fTtcclxuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB7ICcqKic6IGlzb2xhdGVkQnJhbmNoIH0sIGkrMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcclxuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWVbJyonXSAmJiB4eFRyZWVbJyonXS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ3Jvd0xpc3RlbmVyVHJlZSh0eXBlLCBsaXN0ZW5lcikge1xyXG5cclxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuXHJcbiAgICAvL1xyXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXHJcbiAgICAvL1xyXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdHlwZS5sZW5ndGg7IGkrMSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRyZWUgPSB0aGlzLmxpc3RlbmVyVHJlZTtcclxuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG5cclxuICAgIHdoaWxlIChuYW1lICE9PSB1bmRlZmluZWQpIHtcclxuXHJcbiAgICAgIGlmICghdHJlZVtuYW1lXSkge1xyXG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XHJcblxyXG4gICAgICBpZiAodHlwZS5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IGxpc3RlbmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IFt0cmVlLl9saXN0ZW5lcnNdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICF0cmVlLl9saXN0ZW5lcnMud2FybmVkICYmXHJcbiAgICAgICAgICAgIHRoaXMuX21heExpc3RlbmVycyA+IDAgJiZcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCA+IHRoaXMuX21heExpc3RlbmVyc1xyXG4gICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy53YXJuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBsb2dQb3NzaWJsZU1lbW9yeUxlYWsuY2FsbCh0aGlzLCB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoLCBuYW1lKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgbmFtZSA9IHR5cGUuc2hpZnQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxyXG4gIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxyXG4gIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxyXG4gIC8vXHJcbiAgLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXHJcbiAgLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZGVsaW1pdGVyID0gJy4nO1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcclxuICAgIGlmIChuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcclxuICAgICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XHJcbiAgICAgIHRoaXMuX2NvbmYubWF4TGlzdGVuZXJzID0gbjtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50ID0gJyc7XHJcblxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbmNlKGV2ZW50LCBmbiwgZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uY2UoZXZlbnQsIGZuLCB0cnVlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuLCBwcmVwZW5kKSB7XHJcbiAgICB0aGlzLl9tYW55KGV2ZW50LCAxLCBmbiwgcHJlcGVuZCk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX21hbnkoZXZlbnQsIHR0bCwgZm4sIGZhbHNlKTtcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX21hbnkoZXZlbnQsIHR0bCwgZm4sIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuLCBwcmVwZW5kKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hbnkgb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xyXG4gICAgICBpZiAoLS10dGwgPT09IDApIHtcclxuICAgICAgICBzZWxmLm9mZihldmVudCwgbGlzdGVuZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbmVyLl9vcmlnaW4gPSBmbjtcclxuXHJcbiAgICB0aGlzLl9vbihldmVudCwgbGlzdGVuZXIsIHByZXBlbmQpO1xyXG5cclxuICAgIHJldHVybiBzZWxmO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XHJcblxyXG4gICAgaWYgKHR5cGUgPT09ICduZXdMaXN0ZW5lcicgJiYgIXRoaXMuX25ld0xpc3RlbmVyKSB7XHJcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgIHZhciBhcmdzLGwsaSxqO1xyXG4gICAgdmFyIGhhbmRsZXI7XHJcblxyXG4gICAgaWYgKHRoaXMuX2FsbCAmJiB0aGlzLl9hbGwubGVuZ3RoKSB7XHJcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9hbGwuc2xpY2UoKTtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwpO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBhbDsgaisrKSBhcmdzW2pdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgaGFuZGxlciA9IFtdO1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0gZWxzZSBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgIC8vIG5lZWQgdG8gbWFrZSBjb3B5IG9mIGhhbmRsZXJzIGJlY2F1c2UgbGlzdCBjYW4gY2hhbmdlIGluIHRoZSBtaWRkbGVcclxuICAgICAgICAvLyBvZiBlbWl0IGNhbGxcclxuICAgICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5sZW5ndGgpIHtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IGhhbmRsZXIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2FsbCAmJiB0eXBlID09PSAnZXJyb3InKSB7XHJcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAhIXRoaXMuX2FsbDtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXRBc3luYyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgdmFyIHR5cGUgPSBhcmd1bWVudHNbMF07XHJcblxyXG4gICAgaWYgKHR5cGUgPT09ICduZXdMaXN0ZW5lcicgJiYgIXRoaXMuX25ld0xpc3RlbmVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbZmFsc2VdKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwcm9taXNlcz0gW107XHJcblxyXG4gICAgdmFyIGFsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgIHZhciBhcmdzLGwsaSxqO1xyXG4gICAgdmFyIGhhbmRsZXI7XHJcblxyXG4gICAgaWYgKHRoaXMuX2FsbCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3Nbal0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuX2FsbC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBoYW5kbGVyID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgY2FzZSAxOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAyOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDM6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLmxlbmd0aCkge1xyXG4gICAgICBoYW5kbGVyID0gaGFuZGxlci5zbGljZSgpO1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcykpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9hbGwgJiYgdHlwZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYXJndW1lbnRzWzFdKTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uKHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uKHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uQW55ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbkFueShmbiwgZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZEFueSA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25BbnkoZm4sIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbkFueSA9IGZ1bmN0aW9uKGZuLCBwcmVwZW5kKXtcclxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbkFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9hbGwpIHtcclxuICAgICAgdGhpcy5fYWxsID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgZXZlbnQgbGlzdGVuZXIgY29sbGVjdGlvbi5cclxuICAgIGlmKHByZXBlbmQpe1xyXG4gICAgICB0aGlzLl9hbGwudW5zaGlmdChmbik7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5fYWxsLnB1c2goZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fb24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xyXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRoaXMuX29uQW55KHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uIG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcclxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXHJcbiAgICBpZiAodGhpcy5fbmV3TGlzdGVuZXIpXHJcbiAgICAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGdyb3dMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCB0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XHJcbiAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2V2ZW50c1t0eXBlXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIC8vIENoYW5nZSB0byBhcnJheS5cclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYWRkXHJcbiAgICAgIGlmKHByZXBlbmQpe1xyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS51bnNoaWZ0KGxpc3RlbmVyKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgJiZcclxuICAgICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPiAwICYmXHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IHRoaXMuX21heExpc3RlbmVyc1xyXG4gICAgICApIHtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcclxuICAgICAgICBsb2dQb3NzaWJsZU1lbW9yeUxlYWsuY2FsbCh0aGlzLCB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoLCB0eXBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGhhbmRsZXJzLGxlYWZzPVtdO1xyXG5cclxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cclxuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xyXG4gICAgICBoYW5kbGVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgbGVhZnMucHVzaCh7X2xpc3RlbmVyczpoYW5kbGVyc30pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xyXG4gICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcclxuICAgICAgaGFuZGxlcnMgPSBsZWFmLl9saXN0ZW5lcnM7XHJcbiAgICAgIGlmIChpc0FycmF5KGhhbmRsZXJzKSkge1xyXG5cclxuICAgICAgICB2YXIgcG9zaXRpb24gPSAtMTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoaGFuZGxlcnNbaV0gPT09IGxpc3RlbmVyIHx8XHJcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5saXN0ZW5lciAmJiBoYW5kbGVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XHJcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5fb3JpZ2luICYmIGhhbmRsZXJzW2ldLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IGk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICBsZWFmLl9saXN0ZW5lcnMuc3BsaWNlKHBvc2l0aW9uLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0uc3BsaWNlKHBvc2l0aW9uLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChoYW5kbGVycy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCB0eXBlLCBsaXN0ZW5lcik7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGhhbmRsZXJzID09PSBsaXN0ZW5lciB8fFxyXG4gICAgICAgIChoYW5kbGVycy5saXN0ZW5lciAmJiBoYW5kbGVycy5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHx8XHJcbiAgICAgICAgKGhhbmRsZXJzLl9vcmlnaW4gJiYgaGFuZGxlcnMuX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XHJcbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgZGVsZXRlIGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCB0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHJvb3QpIHtcclxuICAgICAgaWYgKHJvb3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJvb3QpO1xyXG4gICAgICBmb3IgKHZhciBpIGluIGtleXMpIHtcclxuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICB2YXIgb2JqID0gcm9vdFtrZXldO1xyXG4gICAgICAgIGlmICgob2JqIGluc3RhbmNlb2YgRnVuY3Rpb24pIHx8ICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB8fCAob2JqID09PSBudWxsKSlcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3Qocm9vdFtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBkZWxldGUgcm9vdFtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdCh0aGlzLmxpc3RlbmVyVHJlZSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmZBbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xyXG4gICAgaWYgKGZuICYmIHRoaXMuX2FsbCAmJiB0aGlzLl9hbGwubGVuZ3RoID4gMCkge1xyXG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XHJcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZihmbiA9PT0gZm5zW2ldKSB7XHJcbiAgICAgICAgICBmbnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lckFueVwiLCBmbik7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcclxuICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKSB7XHJcbiAgICAgICAgZm9yKGkgPSAwLCBsID0gZm5zLmxlbmd0aDsgaSA8IGw7IGkrKylcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyQW55XCIsIGZuc1tpXSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5fYWxsID0gW107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmY7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYgKHR5cGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAhdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHZhciBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcblxyXG4gICAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcclxuICAgICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcclxuICAgICAgICBsZWFmLl9saXN0ZW5lcnMgPSBudWxsO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHMpIHtcclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgdmFyIGhhbmRsZXJzID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVycywgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgICAgcmV0dXJuIGhhbmRsZXJzO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xyXG4gICAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fZXZlbnRzKTtcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycyh0eXBlKS5sZW5ndGg7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnNBbnkgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZih0aGlzLl9hbGwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2FsbDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXHJcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBFdmVudEVtaXR0ZXI7XHJcbiAgICB9KTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgLy8gQ29tbW9uSlNcclxuICAgIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIC8vIEJyb3dzZXIgZ2xvYmFsLlxyXG4gICAgd2luZG93LkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7XHJcbiAgfVxyXG59KCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIFVzaW5nIEV2ZW50RW1pdHRlcjIgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byB1c2Ugd2lsZGNhcmRzIHRvIHN1YnNjcmliZSB0byBhbGwgZXZlbnRzXG52YXIgZXZlbnRlbWl0dGVyMl8xID0gcmVxdWlyZShcImV2ZW50ZW1pdHRlcjJcIik7XG5mdW5jdGlvbiBzaG93V2FybmluZyhtc2cpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmIChwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICEhZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLmV2ZW50VHlwZTtcbn1cbmZ1bmN0aW9uIGlzUHJlZGljYXRlRm4oZGVzY3JpcHRvcikge1xuICAgIHJldHVybiAhaXNFdmVudERlc2NyaXB0b3IoZGVzY3JpcHRvcikgJiYgdHlwZW9mIGRlc2NyaXB0b3IgPT09IFwiZnVuY3Rpb25cIjtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGVmaW5pdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIGZ1bmN0aW9uIGV2ZW50Q3JlYXRvcihwYXlsb2FkKSB7XG4gICAgICAgICAgICAvLyBBbGxvdyBydW50aW1lIHBheWxvYWQgY2hlY2tpbmcgZm9yIHBsYWluIEphdmFTY3JpcHQgdXNhZ2VcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdEZuID0gdHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIiA/IG9wdGlvbnMgOiBvcHRpb25zLnRlc3Q7XG4gICAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgICAgICBpZiAodGVzdEZuICYmICF0ZXN0Rm4ocGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd1dhcm5pbmcoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkgKyBcIiBkb2VzIG5vdCBtYXRjaCBleHBlY3RlZCBwYXlsb2FkLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBldmVudENyZWF0b3IuZXZlbnRUeXBlID0gdHlwZTtcbiAgICAgICAgZXZlbnRDcmVhdG9yLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHlwZTsgfTsgLy8gYWxsb3cgU3RyaW5nIGNvZXJjaW9uIHRvIGRlbGl2ZXIgdGhlIGV2ZW50VHlwZVxuICAgICAgICByZXR1cm4gZXZlbnRDcmVhdG9yO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbiA9IGNyZWF0ZUV2ZW50RGVmaW5pdGlvbjtcbmZ1bmN0aW9uIGRlZmluZUV2ZW50KHR5cGUpIHtcbiAgICBzaG93V2FybmluZyhcImRlZmluZUV2ZW50IGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLiBQbGVhc2UgdXNlIGNyZWF0ZUV2ZW50RGVmaW5pdGlvbiBpbnN0ZWFkLlwiKTtcbiAgICB2YXIgZXZlbnRDcmVhdG9yID0gZnVuY3Rpb24gKHBheWxvYWQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHBheWxvYWQ6IHBheWxvYWRcbiAgICB9KTsgfTtcbiAgICBldmVudENyZWF0b3IuZXZlbnRUeXBlID0gdHlwZTtcbiAgICByZXR1cm4gZXZlbnRDcmVhdG9yO1xufVxuZXhwb3J0cy5kZWZpbmVFdmVudCA9IGRlZmluZUV2ZW50O1xuZnVuY3Rpb24gZ2V0RXZlbnRUeXBlKGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoaXNFdmVudERlc2NyaXB0b3IoZGVzY3JpcHRvcikpXG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yLmV2ZW50VHlwZTtcbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbn1cbmZ1bmN0aW9uIGZpbHRlcihwcmVkaWNhdGUsIGhhbmRsZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUoZXZlbnQpKVxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoZXZlbnQpO1xuICAgIH07XG59XG52YXIgRXZlbnRCdXMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnRCdXMoKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBldmVudGVtaXR0ZXIyXzEuRXZlbnRFbWl0dGVyMih7IHdpbGRjYXJkOiB0cnVlIH0pO1xuICAgIH1cbiAgICBFdmVudEJ1cy5wcm90b3R5cGUucHVibGlzaCA9IGZ1bmN0aW9uIChldmVudCwgbWV0YSkge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChldmVudC50eXBlLCAhbWV0YSA/IGV2ZW50IDogX19hc3NpZ24oe30sIGV2ZW50LCB7IG1ldGE6IF9fYXNzaWduKHt9LCBldmVudC5tZXRhLCBtZXRhKSB9KSk7XG4gICAgfTtcbiAgICBFdmVudEJ1cy5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gKHN1YnNjcmlwdGlvbiwgaGFuZGxlcikge1xuICAgICAgICAvLyBzdG9yZSBlbWl0dGVyIG9uIGNsb3N1cmVcbiAgICAgICAgdmFyIGVtaXR0ZXIgPSB0aGlzLmVtaXR0ZXI7XG4gICAgICAgIHZhciBzdWJzY3JpYmVUb1N1YmRlZiA9IGZ1bmN0aW9uIChzdWJkZWYpIHtcbiAgICAgICAgICAgIGlmIChpc1ByZWRpY2F0ZUZuKHN1YmRlZikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWRIYW5kbGVyXzEgPSBmaWx0ZXIoc3ViZGVmLCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLm9uKFwiKipcIiwgZmlsdGVyZWRIYW5kbGVyXzEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiBlbWl0dGVyLm9mZihcIioqXCIsIGZpbHRlcmVkSGFuZGxlcl8xKTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0RXZlbnRUeXBlKHN1YmRlZik7XG4gICAgICAgICAgICBlbWl0dGVyLm9uKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVtaXR0ZXIub2ZmKHR5cGUsIGhhbmRsZXIpOyB9O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgc3VicyA9IEFycmF5LmlzQXJyYXkoc3Vic2NyaXB0aW9uKSA/IHN1YnNjcmlwdGlvbiA6IFtzdWJzY3JpcHRpb25dO1xuICAgICAgICB2YXIgdW5zdWJzY3JpYmVycyA9IHN1YnMubWFwKHN1YnNjcmliZVRvU3ViZGVmKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHVuc3Vic2NyaWJlcnMuZm9yRWFjaChmdW5jdGlvbiAodSkgeyByZXR1cm4gdSgpOyB9KTsgfTtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudEJ1cztcbn0oKSk7XG5leHBvcnRzLkV2ZW50QnVzID0gRXZlbnRCdXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FdmVudEJ1cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBFdmVudEJ1c18xID0gcmVxdWlyZShcIi4vRXZlbnRCdXNcIik7XG5leHBvcnRzLkV2ZW50QnVzID0gRXZlbnRCdXNfMS5FdmVudEJ1cztcbmV4cG9ydHMuZGVmaW5lRXZlbnQgPSBFdmVudEJ1c18xLmRlZmluZUV2ZW50O1xuZXhwb3J0cy5jcmVhdGVFdmVudERlZmluaXRpb24gPSBFdmVudEJ1c18xLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Bc3NldExvYWRlciA9IHZvaWQgMDtcbmNsYXNzIEFzc2V0TG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5JTUFHRV9GT0xERVIgPSBcImltYWdlcy9cIjtcbiAgICAgICAgdGhpcy5JTUFHRV9OQU1FUyA9IFtcbiAgICAgICAgICAgIFwiYmFsbHMucG5nXCIsXG4gICAgICAgICAgICBcImZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJ0cmFjay5qcGdcIixcbiAgICAgICAgICAgIFwiUmVkUGFydGljbGUucG5nXCIsXG4gICAgICAgICAgICBcImRpZ2l0cy5wbmdcIixcbiAgICAgICAgICAgIFwiZ29hbF9maWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwic3Rhci5wbmdcIixcbiAgICAgICAgICAgIFwicGxheS5wbmdcIixcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5pbWFnZXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGFzeW5jIGluaXQoKSB7XG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuSU1BR0VfTkFNRVMubWFwKGZpbGVOYW1lID0+IHRoaXMubG9hZEltYWdlKGZpbGVOYW1lLCBgJHt0aGlzLklNQUdFX0ZPTERFUn0ke2ZpbGVOYW1lfWApKSk7XG4gICAgfVxuICAgIGdldEltYWdlKGltYWdlTmFtZSkge1xuICAgICAgICBjb25zdCBpbWFnZSA9IHRoaXMuaW1hZ2VzLmdldChpbWFnZU5hbWUpO1xuICAgICAgICBpZiAoaW1hZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2ltYWdlTmFtZX0gaW1hZ2Ugbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH1cbiAgICBsb2FkSW1hZ2UobmFtZSwgc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZXMuc2V0KG5hbWUsIGltZyk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSBBc3NldExvYWRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lTG9vcCA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNYWluU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9zeXN0ZW1zL01haW5TeXN0ZW1cIik7XG5jb25zdCBHYW1lV29ybGRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3dvcmxkL0dhbWVXb3JsZFwiKTtcbmNvbnN0IE1vdXNlSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBNYWluUmVuZGVyXzEgPSByZXF1aXJlKFwiLi4vcmVuZGVyaW5nL01haW5SZW5kZXJcIik7XG5jb25zdCBVSUludGVyYWN0aW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi4vdWkvVUlJbnRlcmFjdGlvblN5c3RlbVwiKTtcbmNsYXNzIEdhbWVMb29wIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wcmV2VGltZSA9IDA7XG4gICAgICAgIHRoaXMubWFpblJlbmRlciA9IG5ldyBNYWluUmVuZGVyXzEuTWFpblJlbmRlcihnYW1lQ29uZmlncywgZG9tSGFuZGxlciwgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZCA9IG5ldyBHYW1lV29ybGRfMS5HYW1lV29ybGQoZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtID0gbmV3IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMS5VSUludGVyYWN0aW9uU3lzdGVtKG5ldyBNb3VzZUlucHV0TWFuYWdlcl8xLk1vdXNlSW5wdXRNYW5hZ2VyKGRvbUhhbmRsZXIubWVudUNhbnZhcykpO1xuICAgICAgICB0aGlzLm1haW5TeXN0ZW0gPSBuZXcgTWFpblN5c3RlbV8xLk1haW5TeXN0ZW0oZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBtYWluKCkge1xuICAgICAgICBjb25zdCB0aWNrID0gKHRpbWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXZUaW1lICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSB0aW1lIC0gdGhpcy5wcmV2VGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUlucHV0cyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgdGhpcy5tYWluU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZCwgZGVsdGEpO1xuICAgIH1cbiAgICB1cGRhdGVJbnB1dHMoZGVsdGEpIHtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZC5tZW51QnV0dG9uLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBkZWx0YSk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcih0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGwgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEJhbGwge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFuZ2xlV2l0aFBsYXllciA9IDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLmJhbGxTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5tYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNDAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5tYXhTcGVlZCAvIDIwMDA7XG4gICAgfVxuICAgIHNldEZvclN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzU2V0Rm9yU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKyB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhTcGVlZCAtIHRoaXMubWF4U3BlZWQgLyAzLjMzKSArIHRoaXMubWF4U3BlZWQgLyAzLjMzO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLlBJIC8gMiArICgoTWF0aC5yYW5kb20oKSAqIE1hdGguUEkpIC8gNC41IC0gTWF0aC5QSSAvIDkpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoMCwgMCk7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgfVxuICAgIGF0dGFjaFRvUGxheWVyKHBsYXllcikge1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gcGxheWVyO1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRDtcbiAgICAgICAgdGhpcy5hbmdsZVdpdGhQbGF5ZXIgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICB9XG4gICAgZGV0YWNoRnJvbVBsYXllcigpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZCh0aGlzLm1heFNwZWVkLCB0aGlzLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgfVxuICAgIHJlc2V0T25Hb2FsKCkge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLkJhbGwgPSBCYWxsO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdvYWxQb3N0cyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBHb2FsUG9zdHMge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBnYW1lQ29uZmlncy5nb2FsUG9zdFJhZGl1cztcbiAgICB9XG59XG5leHBvcnRzLkdvYWxQb3N0cyA9IEdvYWxQb3N0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSB2b2lkIDA7XG5jbGFzcyBIb3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmhvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ob3ZlclByb2dyZXNzID0gMDtcbiAgICB9XG59XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IEhvdmVyYWJsZUVudGl0eTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51QnV0dG9uID0gdm9pZCAwO1xuY29uc3QgRGltZW5zaW9uc18xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgSG92ZXJhYmxlRW50aXR5XzEgPSByZXF1aXJlKFwiLi9Ib3ZlcmFibGVFbnRpdHlcIik7XG5jbGFzcyBNZW51QnV0dG9uIGV4dGVuZHMgSG92ZXJhYmxlRW50aXR5XzEuSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgcmVmV2lkdGgsIHJlZkhlaWdodCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDU7XG4gICAgICAgIHRoaXMuZGltZW5zaW9uID0gbmV3IERpbWVuc2lvbnNfMS5EaW1lbnNpb25zKGhlaWdodCAqIChyZWZXaWR0aCAvIHJlZkhlaWdodCksIGhlaWdodCk7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyAoZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIHRoaXMuZGltZW5zaW9uLndpZHRoKSAvIDIsIChnYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZGltZW5zaW9uLmhlaWdodCkgLyAyKTtcbiAgICB9XG4gICAgY29udGFpbnMocG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludC54ID49IHRoaXMucG9zaXRpb24ueCAmJlxuICAgICAgICAgICAgcG9pbnQueCA8PSB0aGlzLnBvc2l0aW9uLnggKyB0aGlzLmRpbWVuc2lvbi53aWR0aCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnBvc2l0aW9uLnkgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5wb3NpdGlvbi55ICsgdGhpcy5kaW1lbnNpb24uaGVpZ2h0KTtcbiAgICB9XG4gICAgZ2V0VHJhbnNpdGlvblRpbWUoKSB7XG4gICAgICAgIHJldHVybiAxMDA7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51QnV0dG9uID0gTWVudUJ1dHRvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IFN0dW5uZWRTdGFyc18xID0gcmVxdWlyZShcIi4vU3R1bm5lZFN0YXJzXCIpO1xuY2xhc3MgUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgaXNDcHUsIGlzU3Vic3RpdHV0ZSwgc2lkZSwgY29sb3JJbmRleCkge1xuICAgICAgICB0aGlzLmJvdW5jaW5nU3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5ib3VuY2VUaW1lID0gMjAwMDtcbiAgICAgICAgdGhpcy5ib3VuY2VNYXhBbXBsaXR1ZGUgPSAwLjU7XG4gICAgICAgIHRoaXMuYm91bmNlRXhwb25lbnRpYWxGYWN0b3IgPSAwLjAwMzQ2O1xuICAgICAgICB0aGlzLmJvdW5jZU51bWJlciA9IDU7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlID0gMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMgPSBuZXcgU3R1bm5lZFN0YXJzXzEuU3R1bm5lZFN0YXJzKCk7XG4gICAgICAgIHRoaXMuc3R1bm5lZE1heFZhbHVlID0gMjAwMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RlcCA9IDEwMDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFRpbWUgPSAzMDAwO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDA7XG4gICAgICAgIHRoaXMubWF4U3BlZWRXaXRoQmFsbCA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAxLjMzMjtcbiAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5ub3JtYWxNYXhTcGVlZCAvIDMwMDtcbiAgICAgICAgdGhpcy5jbG9zZVRvUG9pbnREaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5pc0NwdSA9IGlzQ3B1O1xuICAgICAgICB0aGlzLmlzU3Vic3RpdHV0ZSA9IGlzU3Vic3RpdHV0ZTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gY29sb3JJbmRleDtcbiAgICAgICAgdGhpcy5pbml0UG9zaXRpb25zKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCB0cnVlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAxKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAxKTtcbiAgICB9XG4gICAgcmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZSh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RlZFBvc2l0aW9uID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHByb2plY3RlZFBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFggPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFkgPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGxldCBzdGVlclggPSBkZXNpcmVkU3BlZWRYIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lng7XG4gICAgICAgICAgICBsZXQgc3RlZXJZID0gZGVzaXJlZFNwZWVkWSAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgICAgICBpZiAoc3RlZXJNYWduaXR1ZGUgPiBtYXhTdGVlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4U3RlZXIgLyBzdGVlck1hZ25pdHVkZTtcbiAgICAgICAgICAgICAgICBzdGVlclggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgc3RlZXJZICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKz0gc3RlZXJYO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZCh0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgfVxuICAgIHN0YXJ0Qm91bmNpbmcoKSB7XG4gICAgICAgIGlmICh0aGlzLmdldEJvdW5jaW5nUHJvZ3Jlc3MoKSA+IHRoaXMuYm91bmNlVGltZSAvIDIgJiYgdGhpcy5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpIHtcbiAgICAgICAgICAgIHRoaXMuYm91bmNpbmdTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldEJvdW5jaW5nQW1wbGl0dWRlKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNCb3VuY2luZygpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHRoaXMuYm91bmNlTWF4QW1wbGl0dWRlICpcbiAgICAgICAgICAgIE1hdGgucG93KE1hdGguRSwgLXRoaXMuZ2V0Qm91bmNpbmdQcm9ncmVzcygpICogdGhpcy5ib3VuY2VFeHBvbmVudGlhbEZhY3RvcikgKlxuICAgICAgICAgICAgTWF0aC5zaW4odGhpcy5nZXRCb3VuY2luZ1Byb2dyZXNzKCkgLyAoMiAqIE1hdGguUEkgKiB0aGlzLmJvdW5jZU51bWJlcikpKTtcbiAgICB9XG4gICAgdXBkYXRlU3R1bm5lZFZhbHVlKG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyU3RhdHVzICE9PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCkge1xuICAgICAgICAgICAgY29uc3Qgc3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChzcGVlZCA+IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gdGhpcy5zdHVubmVkU3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzcGVlZCA8IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSArPSB0aGlzLnN0dW5uZWRTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3R1bm5lZFZhbHVlID4gdGhpcy5zdHVubmVkTWF4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGVjcmVtZW50U3R1bm5lZFZhbHVlKGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gZGVsdGFNcyAvIDIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCkge1xuICAgICAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMudXBkYXRlKGRlbHRhTXMsIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuc3R1bm5lZFN0YXJ0VGltZSA+IHRoaXMuc3R1bm5lZFRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnN0YXJzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRPbkdvYWwoKSB7XG4gICAgICAgIHRoaXMuYm91bmNpbmdTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzLnN0YXJzID0gW107XG4gICAgfVxuICAgIGdldEJvdW5jaW5nUHJvZ3Jlc3MoKSB7XG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5ib3VuY2luZ1N0YXJ0VGltZTtcbiAgICB9XG4gICAgaXNCb3VuY2luZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Qm91bmNpbmdQcm9ncmVzcygpIDw9IHRoaXMuYm91bmNlVGltZTtcbiAgICB9XG4gICAgaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncykge1xuICAgICAgICBsZXQgb2Zmc2V0WCA9IDA7XG4gICAgICAgIGlmICh0aGlzLmlzU3Vic3RpdHV0ZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFhcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnggPSBnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBvZmZzZXRYO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXIgPSBQbGF5ZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3RhckR0byA9IGV4cG9ydHMuU3R1bm5lZFN0YXJzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIFN0dW5uZWRTdGFycyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGVsdGFCZXR3ZWVuU3RhcnMgPSAyMDA7XG4gICAgICAgIHRoaXMuYW5nbGVTdGVwID0gTWF0aC5QSSAvIDgwMDtcbiAgICAgICAgdGhpcy5zdGFycyA9IFtdO1xuICAgICAgICB0aGlzLnN0YXJEZWx0YSA9IDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSwgcG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5zdGFyRGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIGlmICh0aGlzLnN0YXJEZWx0YSA+PSB0aGlzLmRlbHRhQmV0d2VlblN0YXJzKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJzLnB1c2gobmV3IFN0YXJEdG8obmV3IFBvaW50XzEuUG9pbnQocG9zaXRpb24ueCwgcG9zaXRpb24ueSksIDAsIE1hdGgucmFuZG9tKCkgKiAyICogTWF0aC5QSSwgRGF0ZS5ub3coKSkpO1xuICAgICAgICAgICAgdGhpcy5zdGFyRGVsdGEgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhcnMuZm9yRWFjaCgoc3RhciwgX2luZGV4KSA9PiB7XG4gICAgICAgICAgICBzdGFyLmFuZ2xlICs9IHRoaXMuYW5nbGVTdGVwICogZGVsdGE7XG4gICAgICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXIuYWRkZWRUaW1lID4gU3R1bm5lZFN0YXJzLmR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFycy5zcGxpY2UodGhpcy5zdGFycy5pbmRleE9mKHN0YXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TdHVubmVkU3RhcnMgPSBTdHVubmVkU3RhcnM7XG5TdHVubmVkU3RhcnMuZHVyYXRpb24gPSAyMDAwO1xuY2xhc3MgU3RhckR0byB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGFuZ2xlLCBkaXJlY3Rpb24sIGFkZGVkVGltZSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuYW5nbGUgPSBhbmdsZTtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIHRoaXMuYWRkZWRUaW1lID0gYWRkZWRUaW1lO1xuICAgIH1cbiAgICBnZXRGYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiAoRGF0ZS5ub3coKSAtIHRoaXMuYWRkZWRUaW1lKSAvIFN0dW5uZWRTdGFycy5kdXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLlN0YXJEdG8gPSBTdGFyRHRvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxTdGF0dXMgPSB2b2lkIDA7XG52YXIgQmFsbFN0YXR1cztcbihmdW5jdGlvbiAoQmFsbFN0YXR1cykge1xuICAgIEJhbGxTdGF0dXNbXCJGUkVFXCJdID0gXCJGUkVFXCI7XG4gICAgQmFsbFN0YXR1c1tcIkFUVEFDSEVEXCJdID0gXCJBVFRBQ0hFRFwiO1xuICAgIEJhbGxTdGF0dXNbXCJHT0FMX1NDT1JFRFwiXSA9IFwiR09BTF9TQ09SRURcIjtcbn0pKEJhbGxTdGF0dXMgfHwgKGV4cG9ydHMuQmFsbFN0YXR1cyA9IEJhbGxTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXMgPSB2b2lkIDA7XG52YXIgR2FtZVN0YXR1cztcbihmdW5jdGlvbiAoR2FtZVN0YXR1cykge1xuICAgIEdhbWVTdGF0dXNbXCJNRU5VXCJdID0gXCJNRU5VXCI7XG4gICAgR2FtZVN0YXR1c1tcIldBSVRJTkdfQkFMTFwiXSA9IFwiV0FJVElOR19CQUxMXCI7XG4gICAgR2FtZVN0YXR1c1tcIlBMQVlJTkdcIl0gPSBcIlBMQVlJTkdcIjtcbiAgICBHYW1lU3RhdHVzW1wiRU5EX0dBTUVcIl0gPSBcIkVORF9HQU1FXCI7XG59KShHYW1lU3RhdHVzIHx8IChleHBvcnRzLkdhbWVTdGF0dXMgPSBHYW1lU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlzVXRpbGl0aWVzID0gZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gZXhwb3J0cy5LZXlzID0gdm9pZCAwO1xudmFyIEtleXM7XG4oZnVuY3Rpb24gKEtleXMpIHtcbiAgICBLZXlzW1wiQVJST1dfRE9XTlwiXSA9IFwiQXJyb3dEb3duXCI7XG4gICAgS2V5c1tcIkFSUk9XX1VQXCJdID0gXCJBcnJvd1VwXCI7XG4gICAgS2V5c1tcIkFSUk9XX0xFRlRcIl0gPSBcIkFycm93TGVmdFwiO1xuICAgIEtleXNbXCJBUlJPV19SSUdIVFwiXSA9IFwiQXJyb3dSaWdodFwiO1xuICAgIEtleXNbXCJTUEFDRVwiXSA9IFwiIFwiO1xufSkoS2V5cyB8fCAoZXhwb3J0cy5LZXlzID0gS2V5cyA9IHt9KSk7XG52YXIgS2V5c0RpcmVjdGlvbjtcbihmdW5jdGlvbiAoS2V5c0RpcmVjdGlvbikge1xuICAgIEtleXNEaXJlY3Rpb25bXCJIT1JJWk9OVEFMXCJdID0gXCJIT1JJWk9OVEFMXCI7XG4gICAgS2V5c0RpcmVjdGlvbltcIlZFUlRJQ0FMXCJdID0gXCJWRVJUSUNBTFwiO1xufSkoS2V5c0RpcmVjdGlvbiB8fCAoZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gS2V5c0RpcmVjdGlvbiA9IHt9KSk7XG5jbGFzcyBLZXlzVXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0S2V5RGlyZWN0aW9uKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX0xFRlQgfHwga2V5ID09PSBLZXlzLkFSUk9XX1JJR0hUKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5IT1JJWk9OVEFMO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09IEtleXMuQVJST1dfVVAgfHwga2V5ID09PSBLZXlzLkFSUk9XX0RPV04pIHtcbiAgICAgICAgICAgIHJldHVybiBLZXlzRGlyZWN0aW9uLlZFUlRJQ0FMO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IEtleXNVdGlsaXRpZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyU2lkZSA9IHZvaWQgMDtcbnZhciBQbGF5ZXJTaWRlO1xuKGZ1bmN0aW9uIChQbGF5ZXJTaWRlKSB7XG4gICAgUGxheWVyU2lkZVtcIkxFRlRcIl0gPSBcIkxFRlRcIjtcbiAgICBQbGF5ZXJTaWRlW1wiUklHSFRcIl0gPSBcIlJJR0hUXCI7XG59KShQbGF5ZXJTaWRlIHx8IChleHBvcnRzLlBsYXllclNpZGUgPSBQbGF5ZXJTaWRlID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSB2b2lkIDA7XG52YXIgUGxheWVyU3RhdHVzO1xuKGZ1bmN0aW9uIChQbGF5ZXJTdGF0dXMpIHtcbiAgICBQbGF5ZXJTdGF0dXNbXCJOT1JNQUxcIl0gPSBcIk5PUk1BTFwiO1xuICAgIFBsYXllclN0YXR1c1tcIlNUVU5ORURcIl0gPSBcIlNUVU5ORURcIjtcbn0pKFBsYXllclN0YXR1cyB8fCAoZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvcmRlckxpbWl0cyA9IHZvaWQgMDtcbmNsYXNzIEJvcmRlckxpbWl0cyB7XG4gICAgY29uc3RydWN0b3IobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tKSB7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy50b3AgPSB0b3A7XG4gICAgICAgIHRoaXMuYm90dG9tID0gYm90dG9tO1xuICAgIH1cbiAgICBpc1BvaW50SW5zaWRlKHBvaW50KSB7XG4gICAgICAgIHJldHVybiAocG9pbnQueCA+PSB0aGlzLmxlZnQgJiZcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy5yaWdodCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnRvcCAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLmJvdHRvbSk7XG4gICAgfVxufVxuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSBCb3JkZXJMaW1pdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4vUG9pbnRcIik7XG5jbGFzcyBNb3ZlbWVudFBvaW50IHtcbiAgICBzdGF0aWMgYXJlVG91Y2hpbmcocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocG9pbnQxLnBvc2l0aW9uLCBwb2ludDIucG9zaXRpb24pIDwgcG9pbnQxLnNpemUgKyBwb2ludDIuc2l6ZTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIHZlbG9jaXR5LCBhY2NlbGVyYXRpb24sIHNpemUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgIH1cbiAgICB1cGRhdGVQb3NpdGlvbihkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSB0aGlzLnZlbG9jaXR5LnggKiBkZWx0YU1zO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gdGhpcy52ZWxvY2l0eS55ICogZGVsdGFNcztcbiAgICB9XG4gICAgcHJvamVjdFRvRmluYWxQb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLngsIHRoaXMudmVsb2NpdHkueCksIHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLnksIHRoaXMudmVsb2NpdHkueSkpO1xuICAgIH1cbiAgICBnZXRTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLnZlbG9jaXR5LngsIDIpICsgTWF0aC5wb3codGhpcy52ZWxvY2l0eS55LCAyKSk7XG4gICAgfVxuICAgIGdldFNwZWVkQW5nbGUoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMudmVsb2NpdHkueSwgdGhpcy52ZWxvY2l0eS54KTtcbiAgICB9XG4gICAgYWRqdXN0VG9NYXhTcGVlZChtYXhTcGVlZCkge1xuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgubWluKHRoaXMuZ2V0U3BlZWQoKSwgbWF4U3BlZWQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IHRoaXMuZ2V0U3BlZWRBbmdsZSgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIHNldFNwZWVkKHNwZWVkLCBhbmdsZSkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIGRlY3JlbWVudFNwZWVkKGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFNwZWVkID0gdGhpcy5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoY3VycmVudFNwZWVkID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXMsIDApO1xuICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYWxjdWxhdGVEZXN0aW5hdGlvblBvc2l0aW9uKHBvc2l0aW9uLCBzcGVlZCkge1xuICAgICAgICB3aGlsZSAoTWF0aC5hYnMoc3BlZWQpID4gMCkge1xuICAgICAgICAgICAgcG9zaXRpb24gKz0gc3BlZWQ7XG4gICAgICAgICAgICBzcGVlZCA9IE1hdGguc2lnbihzcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhzcGVlZCkgLSB0aGlzLmFjY2VsZXJhdGlvbiwgMCk7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoc3BlZWQpIDw9IHRoaXMuYWNjZWxlcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3BlZWQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSBNb3ZlbWVudFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5Qb2ludHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocG9pbnQyLnkgLSBwb2ludDEueSwgcG9pbnQyLnggLSBwb2ludDEueCk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVTdGF0dXNNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgRXZlbnRCdXNVdGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9FdmVudEJ1c1V0aWxpdGllc1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgR2FtZVN0YXR1c01hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGJ1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVTtcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmJ1cyA9IGJ1cztcbiAgICB9XG4gICAgY2hhbmdlU3RhdHVzKGdhbWVTdGF0dXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IGdhbWVTdGF0dXM7XG4gICAgICAgIHRoaXMuc3RhdHVzU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG4gICAgZ2V0IGdhbWVTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nYW1lU3RhdHVzO1xuICAgIH1cbiAgICBpc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXR1c1N0YXJ0VGltZSA8IDEwMDA7XG4gICAgfVxuICAgIHNjaGVkdWxlU3RhdHVzQ2hhbmdlKGRlbGF5LCBnYW1lU3RhdHVzKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRXZlbnQgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maW5kKGUgPT4gZS5nYW1lU3RhdHVzID09PSBnYW1lU3RhdHVzKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0V2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0aW1lOiB0aGlzLnRpbWUgKyBkZWxheSxcbiAgICAgICAgICAgICAgICBnYW1lU3RhdHVzOiBnYW1lU3RhdHVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIHRoaXMuc2NoZWR1bGVkRXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lID49IGUudGltZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlU3RhdHVzKGUuZ2FtZVN0YXR1cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5idXMucHVibGlzaChFdmVudEJ1c1V0aWxpdGllc18xLkV2ZW50QnVzVXRpbGl0aWVzLnN0YXR1c0NoYW5nZWRFdmVudCh0aGlzLmdhbWVTdGF0dXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IHRoaXMuc2NoZWR1bGVkRXZlbnRzLmZpbHRlcihlID0+IHRoaXMudGltZSA8IGUudGltZSk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IEdhbWVTdGF0dXNNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlNjb3JlTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEV2ZW50QnVzVXRpbGl0aWVzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY2xhc3MgU2NvcmVNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihidXMpIHtcbiAgICAgICAgdGhpcy5sZWZ0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLnJpZ2h0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGVUaW1lID0gMDtcbiAgICAgICAgdGhpcy5sYXN0U2lkZVVwZGF0ZWQgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICB0aGlzLm1heFNjb3JlID0gMTtcbiAgICAgICAgdGhpcy5idXMgPSBidXM7XG4gICAgICAgIHRoaXMuYnVzLnN1YnNjcmliZShFdmVudEJ1c1V0aWxpdGllc18xLkV2ZW50QnVzVXRpbGl0aWVzLnN0YXR1c0NoYW5nZWRFdmVudCwgZXZlbnQgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnBheWxvYWQgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbmNyZWFzZVNjb3JlKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHRTY29yZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZWZ0U2NvcmUrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc3RVcGRhdGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy5sYXN0U2lkZVVwZGF0ZWQgPSBwbGF5ZXJTaWRlO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5sZWZ0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLnJpZ2h0U2NvcmUgPSAwO1xuICAgIH1cbiAgICBnZXRTY29yZUFzQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IFN0cmluZyh0aGlzLmxlZnRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpICsgU3RyaW5nKHRoaXMucmlnaHRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICByZXR1cm4gb3V0cHV0U3RyaW5nLnNwbGl0KFwiXCIpLm1hcChOdW1iZXIpO1xuICAgIH1cbiAgICBzaG91bGRBbmltYXRlSW5kZXgoaW5kZXgpIHtcbiAgICAgICAgaWYgKHRoaXMubGFzdFNpZGVVcGRhdGVkID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAyO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBsYXN0VXBkYXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlVGltZTtcbiAgICB9XG4gICAgZ2V0IGxhc3RTaWRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0U2lkZVVwZGF0ZWQ7XG4gICAgfVxuICAgIGdldCBpc0dhbWVPdmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0U2NvcmUgPT09IHRoaXMubWF4U2NvcmUgfHwgdGhpcy5yaWdodFNjb3JlID09PSB0aGlzLm1heFNjb3JlO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVNYW5hZ2VyID0gU2NvcmVNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5TeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBLZXlib2FyZElucHV0TWFuYWdlcl8xID0gcmVxdWlyZShcIi4uLy4uL2lucHV0L0tleWJvYXJkSW5wdXRNYW5hZ2VyXCIpO1xuY29uc3QgQ29sbGlzaW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9jb2xsaXNpb24vQ29sbGlzaW9uU3lzdGVtXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL21vdmVtZW50L01vdmVtZW50U3lzdGVtXCIpO1xuY2xhc3MgTWFpblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLnN5c3RlbXMuZm9yRWFjaChzeXN0ZW0gPT4gc3lzdGVtLnVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5TeXN0ZW0gPSBNYWluU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9QbGF5ZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIENvbGxpc2lvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lfMS5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSBDb2xsaXNpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQm9yZGVyTGltaXRzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvQm9yZGVyTGltaXRzXCIpO1xuY2xhc3MgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBnZXRGaWVsZEJvcmRlckxpbWl0cyhzaXplKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKGNmZy5maWVsZFhPZmZzZXQgKyBzaXplLCBjZmcuZmllbGRYT2Zmc2V0ICsgY2ZnLmZpZWxkV2lkdGggLSBzaXplLCBjZmcuZmllbGRCb3JkZXJTaXplICsgc2l6ZSwgY2ZnLmZpZWxkSGVpZ2h0IC0gY2ZnLmZpZWxkQm9yZGVyU2l6ZSAtIHNpemUpO1xuICAgIH1cbiAgICBoYW5kbGVCb3JkZXJDb2xsaXNpb24obW92ZW1lbnRQb2ludCwgYm9yZGVyTGltaXRzLCBpbnZlcnRTcGVlZCwgYXZvaWRCb3VuY2VPbkdvYWwgPSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIGNvbnN0IGlzSW5Hb2FsWVJhbmdlID0gIWF2b2lkQm91bmNlT25Hb2FsICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPj0gY2ZnLmdvYWxZT2Zmc2V0ICYmXG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPD0gY2ZnLmdvYWxZT2Zmc2V0ICsgY2ZnLmdvYWxIZWlnaHQ7XG4gICAgICAgIGxldCBoYXNDb2xsaWRlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoIWlzSW5Hb2FsWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8IGJvcmRlckxpbWl0cy5sZWZ0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMubGVmdDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLm1heCgwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJbkdvYWxZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID4gYm9yZGVyTGltaXRzLnJpZ2h0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMucmlnaHQ7XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSAtTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGgubWluKDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8IGJvcmRlckxpbWl0cy50b3ApIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy50b3A7XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5tYXgoMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID4gYm9yZGVyTGltaXRzLmJvdHRvbSkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLmJvdHRvbTtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5taW4oMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGFzQ29sbGlkZWQ7XG4gICAgfVxuICAgIGdldEdvYWxCb3JkZXJMaW1pdHMoc2l6ZSwgcGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICBjb25zdCB0b3AgPSBjZmcuZ29hbFlPZmZzZXQgKyBzaXplO1xuICAgICAgICBjb25zdCBib3R0b20gPSBjZmcuZ29hbFlPZmZzZXQgKyBjZmcuZ29hbEhlaWdodCAtIHNpemU7XG4gICAgICAgIGlmIChwbGF5ZXJTaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhzaXplLCBjZmcuZmllbGRYT2Zmc2V0IC0gc2l6ZSwgdG9wLCBib3R0b20pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKGNmZy5maWVsZFhPZmZzZXQgKyBjZmcuZmllbGRXaWR0aCArIHNpemUsIGNmZy53aWR0aCAtIHNpemUsIHRvcCwgYm90dG9tKTtcbiAgICB9XG59XG5leHBvcnRzLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kgPSBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24oYmFsbE1vdmVtZW50LCB0aGlzLmdldEZpZWxkQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplKSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpO1xuICAgICAgICB0aGlzLmNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKTtcbiAgICB9XG4gICAgY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgcGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICBjb25zdCBnb2FsQm9yZGVyID0gdGhpcy5nZXRHb2FsQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplLCBwbGF5ZXJTaWRlKTtcbiAgICAgICAgaWYgKGdvYWxCb3JkZXIuaXNQb2ludEluc2lkZShiYWxsTW92ZW1lbnQucG9zaXRpb24pKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuaW5jcmVhc2VTY29yZShwbGF5ZXJTaWRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSkgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgbGV0IHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICBpZiAoYmFsbE1vdmVtZW50LnBvc2l0aW9uLnggPlxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyKSB7XG4gICAgICAgICAgICBzaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgc2lkZSk7XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgZ29hbEJvcmRlciwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSA8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplICsgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSAtIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCksIGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICsgTWF0aC5jb3MoYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArIE1hdGguc2luKGFuZ2xlKSAqIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5hdHRhY2hUb1BsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChfZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbGxpZGVkID0gdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24ocGxheWVyLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSksIGZhbHNlKTtcbiAgICAgICAgICAgIGlmIChoYXNDb2xsaWRlZCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zdGFydEJvdW5jaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIFBsYXllckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKF9nYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBodW1hblBsYXllciA9IGdhbWVXb3JsZC5wbGF5ZXJzLmZpbmQocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmICFwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBjb25zdCBjcHVQbGF5ZXIgPSBnYW1lV29ybGQucGxheWVycy5maW5kKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiBwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBpZiAoaHVtYW5QbGF5ZXIgPT09IHVuZGVmaW5lZCB8fCBjcHVQbGF5ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLCBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGh1bWFuUGxheWVyLnVwZGF0ZVN0dW5uZWRWYWx1ZShjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKTtcbiAgICAgICAgICAgIGNwdVBsYXllci51cGRhdGVTdHVubmVkVmFsdWUoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKTtcbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAyLCAoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgIDIpO1xuICAgICAgICAgICAgaHVtYW5QbGF5ZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICAgICAgY3B1UGxheWVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpc2lvblNwZWVkID0gKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpIC9cbiAgICAgICAgICAgICAgICAyO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGh1bWFuUGxheWVyLCBjcHVQbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoY3B1UGxheWVyLCBodW1hblBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhpbnRlcnNlY3Rpb25Qb2ludCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgYmFsbC5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBib3VuY2VQbGF5ZXJzKHBsYXllcjEsIHBsYXllcjIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgaW50ZXJzZWN0aW9uUG9pbnQpIC1cbiAgICAgICAgICAgIE1hdGguUEk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChjb2xsaXNpb25TcGVlZCwgYW5nbGUpO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBpbnRlcnNlY3Rpb25Qb2ludC54ICsgTWF0aC5jb3MoYW5nbGUpICogcGxheWVyMi5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnkgKyBNYXRoLnNpbihhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL1dhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY2xhc3MgTW92ZW1lbnRTeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgTWVudU1vdmVtZW50U3RyYXRlZ3lfMS5NZW51TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgICAgIC8vdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IENwdU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneV8xLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgICAgIHRoaXMudXBkYXRlQmFsbChnYW1lV29ybGQsIGRlbHRhTXMpO1xuICAgIH1cbiAgICB1cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBwbGF5ZXIuZGVjcmVtZW50U3R1bm5lZFZhbHVlKGRlbHRhTXMpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZShkZWx0YU1zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkLmJhbGwsIGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgIH1cbn1cbmV4cG9ydHMuTW92ZW1lbnRTeXN0ZW0gPSBNb3ZlbWVudFN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBiYWxsLmF0dGFjaGVkUGxheWVyO1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIgIT09IG51bGwgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5kZXRhY2hGcm9tUGxheWVyKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jbGFzcyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuYW5nbGVUb2xsZXJhbmNlID0gTWF0aC5QSSAvIDMwO1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgIXRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIuaXNLZXlQcmVzc2VkKEtleXNfMS5LZXlzLlNQQUNFKSk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgaWYgKHBsYXllciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRqdXN0QmFsbFBvc2l0aW9uQXJvdW5kUGxheWVyKGJhbGwsIHBsYXllciwgZGVsdGFNcyk7XG4gICAgfVxuICAgIGFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY29tYmluZWRTaXplID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSArIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbC5hbmdsZVdpdGhQbGF5ZXIpICogY29tYmluZWRTaXplO1xuICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICsgTWF0aC5QSTtcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlRGlmZmVyZW5jZSA9IHRoaXMubm9ybWFsaXplQW5nbGUodGFyZ2V0QW5nbGUgLSBiYWxsLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYW5nbGVEaWZmZXJlbmNlKSA+IHRoaXMuYW5nbGVUb2xsZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RlcCA9IChzcGVlZCAvIHBsYXllci5tYXhTcGVlZFdpdGhCYWxsKSAqIDAuMDEgKiBkZWx0YU1zO1xuICAgICAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyICs9IGFuZ2xlRGlmZmVyZW5jZSA+IDAgPyBzdGVwIDogLXN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciA9IHRhcmdldEFuZ2xlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGJhbGwuYW5nbGVXaXRoUGxheWVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICB3aGlsZSAoYW5nbGUgPiBNYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSAtPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYW5nbGUgPCAtTWF0aC5QSSkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMiAqIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuc2V0Rm9yU3RhcnRHYW1lKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChfYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUU7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkge1xuICAgICAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYmFsbC5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uSE9SSVpPTlRBTCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLlZFUlRJQ0FMKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBob3Jpem9udGFsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19MRUZULCBLZXlzXzEuS2V5cy5BUlJPV19SSUdIVCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnksIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgdmVydGljYWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX1VQLCBLZXlzXzEuS2V5cy5BUlJPV19ET1dOKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgYXBwbHlBeGlzTW92ZW1lbnQoY3VycmVudFNwZWVkLCBhY2NlbGVyYXRpb24sIGRlbHRhTXMsIGtleSwgbmVnYXRpdmVLZXksIHBvc2l0aXZlS2V5KSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgaWYgKGtleSA9PT0gbmVnYXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkIC0gZGVsdGE7XG4gICAgICAgIGlmIChrZXkgPT09IHBvc2l0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCArIGRlbHRhO1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGN1cnJlbnRTcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhjdXJyZW50U3BlZWQpIC0gZGVsdGEsIDApO1xuICAgIH1cbn1cbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNZW51TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCA9XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICAgICAoKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoKSAvIDI7XG4gICAgICAgICAgICBpZiAocGxheWVyLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCArPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24udmVsb2NpdHkgPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IDA7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IE1lbnVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAocGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IHBsYXllci5tYXhTcGVlZFdpdGhCYWxsIC8gNSkge1xuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IHBsYXllci5tYXhTcGVlZFdpdGhCYWxsIC8gMTU7XG4gICAgICAgICAgICBsZXQgYW5nbGUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgICAgICBhbmdsZSA9IGFuZ2xlICsgKE1hdGguUEkgLyAzMCkgKiBkZWx0YU1zICogMC4wNTtcbiAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKCFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5pc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpKSB7XG4gICAgICAgICAgICBwbGF5ZXIucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPT09IDApIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5zY2hlZHVsZVN0YXR1c0NoYW5nZSgyMDAwLCBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVXb3JsZCA9IHZvaWQgMDtcbmNvbnN0IHRzX2J1c18xID0gcmVxdWlyZShcInRzLWJ1c1wiKTtcbmNvbnN0IEJhbGxfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9CYWxsXCIpO1xuY29uc3QgR29hbFBvc3RzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvR29hbFBvc3RzXCIpO1xuY29uc3QgTWVudUJ1dHRvbl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL01lbnVCdXR0b25cIik7XG5jb25zdCBQbGF5ZXJfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9QbGF5ZXJcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXJcIik7XG5jb25zdCBTY29yZU1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9tYW5hZ2Vycy9TY29yZU1hbmFnZXJcIik7XG5jbGFzcyBHYW1lV29ybGQge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnBsYXllcnMgPSBbXTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdHMgPSBuZXcgR29hbFBvc3RzXzEuR29hbFBvc3RzKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVDcHVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2goUGxheWVyXzEuUGxheWVyLmNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5iYWxsID0gbmV3IEJhbGxfMS5CYWxsKGdhbWVDb25maWdzKTtcbiAgICAgICAgY29uc3QgYnVzID0gbmV3IHRzX2J1c18xLkV2ZW50QnVzKCk7XG4gICAgICAgIHRoaXMuc2NvcmUgPSBuZXcgU2NvcmVNYW5hZ2VyXzEuU2NvcmVNYW5hZ2VyKGJ1cyk7XG4gICAgICAgIGNvbnN0IHBsYXlJbWcgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgICAgICB0aGlzLm1lbnVCdXR0b24gPSBuZXcgTWVudUJ1dHRvbl8xLk1lbnVCdXR0b24oZ2FtZUNvbmZpZ3MsIHBsYXlJbWcud2lkdGgsIHBsYXlJbWcuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlciA9IG5ldyBHYW1lU3RhdHVzTWFuYWdlcl8xLkdhbWVTdGF0dXNNYW5hZ2VyKGJ1cyk7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICB0aGlzLnNjb3JlLmluY3JlYXNlU2NvcmUocGxheWVyU2lkZSk7XG4gICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiBwbGF5ZXIucmVzZXRPbkdvYWwoKSk7XG4gICAgICAgIHRoaXMuYmFsbC5yZXNldE9uR29hbCgpO1xuICAgICAgICBpZiAodGhpcy5zY29yZS5pc0dhbWVPdmVyKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKDMwMDAsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lV29ybGQgPSBHYW1lV29ybGQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuS2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBLZXlzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgS2V5Ym9hcmRJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnByZXNzZWRLZXlzID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLm9uS2V5RG93biA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkS2V5cy5hZGQoZXZlbnQua2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbktleVVwID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmRlbGV0ZShldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5RG93bik7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLm9uS2V5VXApO1xuICAgIH1cbiAgICBpc0tleVByZXNzZWQoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnByZXNzZWRLZXlzLmhhcyhrZXkpO1xuICAgIH1cbiAgICBnZXREaXJlY3Rpb25QcmVzc2VkKGRpcmVjdGlvbikge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiB0aGlzLnByZXNzZWRLZXlzKSB7XG4gICAgICAgICAgICBpZiAoS2V5c18xLktleXNVdGlsaXRpZXMuZ2V0S2V5RGlyZWN0aW9uKGtleSkgPT09IGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IEtleWJvYXJkSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTW91c2VJbnB1dE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbk1vdXNlTW92ZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGV2ZW50LmNsaWVudFggLSByZWN0LmxlZnQsIGV2ZW50LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25DbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljayk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IE1vdXNlSW5wdXRNYW5hZ2VyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1haW5SZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBCYWxsUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0JhbGxSZW5kZXJcIik7XG5jb25zdCBGaWVsZFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9GaWVsZFJlbmRlclwiKTtcbmNvbnN0IEdhdGVzUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0dhdGVzUmVuZGVyXCIpO1xuY29uc3QgTWVudVJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9NZW51UmVuZGVyXCIpO1xuY29uc3QgUGxheWVyUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL1BsYXllclJlbmRlclwiKTtcbmNvbnN0IFNjb3JlUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL1Njb3JlUmVuZGVyXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucmVuZGVycyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLmRvbUhhbmRsZXIgPSBkb21IYW5kbGVyO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgRmllbGRSZW5kZXJfMS5GaWVsZFJlbmRlcihkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IFNjb3JlUmVuZGVyXzEuU2NvcmVSZW5kZXIoZG9tSGFuZGxlci5zY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBHYXRlc1JlbmRlcl8xLkdhdGVzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBQbGF5ZXJSZW5kZXJfMS5QbGF5ZXJSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBNZW51UmVuZGVyXzEuTWVudVJlbmRlcihkb21IYW5kbGVyLm1lbnVDb250ZXh0LCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgQmFsbFJlbmRlcl8xLkJhbGxSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMucmVuZGVycy5mb3JFYWNoKHJlbmRlciA9PiByZW5kZXIucmVuZGVyKGdhbWVXb3JsZCkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEJhbGxSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLm1heFJlc2l6ZUZhY3RvciA9IDI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyB8fFxuICAgICAgICAgICAgKChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FKSAmJlxuICAgICAgICAgICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54LCBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpKTtcbiAgICAgICAgICAgIGxldCByZXNpemVGYWN0b3IgPSAxO1xuICAgICAgICAgICAgaWYgKGJhbGwuYmFsbFN0YXR1cyAhPT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQpIHtcbiAgICAgICAgICAgICAgICByZXNpemVGYWN0b3IgPVxuICAgICAgICAgICAgICAgICAgICAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgLyBiYWxsLm1heFNwZWVkKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5tYXhSZXNpemVGYWN0b3IgLSAxKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zY2FsZShyZXNpemVGYWN0b3IsIDEpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYzMzMzXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzMzMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxSZW5kZXIgPSBCYWxsUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmllbGRSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJmaWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMuZ29hbEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJnb2FsX2ZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy50cmFja0ZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInRyYWNrLmpwZ1wiKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IGJhY2tncm91bmRDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxyZWFkeVJlbmRlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJBdGhsZXRpY1RyYWNrKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgIHRoaXMucmVuZGVyQm9yZGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IHRydWU7XG4gICAgfVxuICAgIHJlbmRlckJhY2tncm91bmQoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCAwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICogMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgIH1cbiAgICByZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQUFBQUFBXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJBdGhsZXRpY1RyYWNrKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnRyYWNrRmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja0hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgR2F0ZXNSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRjAwMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLSB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gMDsgLy8gVE9ETyBkYSByaXZlZGVyZVxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVJlY3QoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoTWF0aC5QSSAtIGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsUmVjdCgwLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlUmVjdCgwLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSBHYXRlc1JlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIE1lbnVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKG1lbnVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmhvdmVyRmFjdG9yID0gMS4zO1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0ID0gbWVudUNvbnRleHQ7XG4gICAgICAgIHRoaXMucGxheUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IDEgKyAodGhpcy5ob3ZlckZhY3RvciAtIDEpICogZ2FtZVdvcmxkLm1lbnVCdXR0b24uaG92ZXJQcm9ncmVzcztcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoICogc2NhbGU7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnBsYXlJbWFnZSwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueCAtXG4gICAgICAgICAgICAgICAgKHdpZHRoIC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoKSAvIDIsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnkgLVxuICAgICAgICAgICAgICAgIChoZWlnaHQgLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0KSAvIDIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5NZW51UmVuZGVyID0gTWVudVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNsYXNzIFBsYXllclJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmNvbG9yTWFwID0gbmV3IE1hcChbXG4gICAgICAgICAgICBbXCJMRUZULTBcIiwgXCIjMDA4MDAwXCJdLFxuICAgICAgICAgICAgW1wiTEVGVC0xXCIsIFwiIzMzODA4OFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTBcIiwgXCIjRkZBNTAwXCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMVwiLCBcIiNGRkZGMDBcIl0sXG4gICAgICAgIF0pO1xuICAgICAgICB0aGlzLnN0dW5uZWRDb2xvciA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJvcmRlckNvbG9yID0gXCIjMDAzMzAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLnN0YXJJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwic3Rhci5wbmdcIik7XG4gICAgICAgIHRoaXMuc3Rhck1heFNpemUgPSB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UgPSB0aGlzLnN0YXJNYXhTaXplICogNTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yS2V5ID0gYCR7cGxheWVyLnNpZGV9LSR7cGxheWVyLmNvbG9ySW5kZXh9YDtcbiAgICAgICAgICAgIGNvbnN0IGlzU3R1bm5lZCA9IHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEO1xuICAgICAgICAgICAgbGV0IGNvbG9yID0gaXNTdHVubmVkID8gdGhpcy5zdHVubmVkQ29sb3IgOiB0aGlzLmNvbG9yTWFwLmdldChjb2xvcktleSk7XG4gICAgICAgICAgICBpZiAoY29sb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gXCIjRkYwMDAwXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCksIE1hdGgucm91bmQocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSBwbGF5ZXIuZ2V0Qm91bmNpbmdBbXBsaXR1ZGUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2NhbGUoMSAtIHNjYWxlLCAxICsgc2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICBpZiAoaXNTdHVubmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJTdHVubmVkU3RhcnMocGxheWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlclN0dW5uZWRTdGFycyhwbGF5ZXIpIHtcbiAgICAgICAgcGxheWVyLnN0dW5uZWRTdGFycy5zdGFycy5mb3JFYWNoKHN0YXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBmYWN0b3IgPSBzdGFyLmdldEZhY3RvcigpO1xuICAgICAgICAgICAgY29uc3QgeCA9IHN0YXIucG9zaXRpb24ueCArIE1hdGguY29zKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgY29uc3QgeSA9IHN0YXIucG9zaXRpb24ueSArIE1hdGguc2luKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShzdGFyLmFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxIC0gZmFjdG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zdGFySW1hZ2UsIC10aGlzLnN0YXJNYXhTaXplIC8gMiwgLXRoaXMuc3Rhck1heFNpemUgLyAyLCB0aGlzLnN0YXJNYXhTaXplLCB0aGlzLnN0YXJNYXhTaXplKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllclJlbmRlciA9IFBsYXllclJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTY29yZVJlbmRlciB7XG4gICAgY29uc3RydWN0b3Ioc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZyYW1lRm9yTnVtYmVyID0gNjtcbiAgICAgICAgdGhpcy50b3RhbE51bWJlcnMgPSA5O1xuICAgICAgICB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSA9IDMwMDtcbiAgICAgICAgdGhpcy5mcmFtZVRpbWUgPSB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSAvIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0ID0gc2NvcmVDb250ZXh0O1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyh0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aCwgdGhpcy5kaWdpdHNJbWFnZXMuaGVpZ2h0IC8gKHRoaXMudG90YWxOdW1iZXJzICogdGhpcy5mcmFtZUZvck51bWJlciArIDEpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY29yZUFycmF5ID0gZ2FtZVdvcmxkLnNjb3JlLmdldFNjb3JlQXNBcnJheSgpO1xuICAgICAgICBzY29yZUFycmF5LmZvckVhY2goKG51bWJlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGxldCBtYXhGcmFtZSA9IG51bWJlciAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICBsZXQgZnJhbWUgPSBtYXhGcmFtZTtcbiAgICAgICAgICAgIGlmIChmcmFtZSA+IDAgJiYgZ2FtZVdvcmxkLnNjb3JlLnNob3VsZEFuaW1hdGVJbmRleChpbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5GcmFtZSA9IChudW1iZXIgLSAxKSAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICAgICAgZnJhbWUgPVxuICAgICAgICAgICAgICAgICAgICBtaW5GcmFtZSArXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmZsb29yKChEYXRlLm5vdygpIC0gZ2FtZVdvcmxkLnNjb3JlLmxhc3RVcGRhdGUpIC8gdGhpcy5mcmFtZVRpbWUpO1xuICAgICAgICAgICAgICAgIGZyYW1lID0gTWF0aC5taW4oZnJhbWUsIG1heEZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmRpZ2l0c0ltYWdlcywgMCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQgKiBmcmFtZSwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy5oZWlnaHQsIHRoaXMucG9zaXRpb25BcnJheVtpbmRleF0ueCwgdGhpcy5wb3NpdGlvbkFycmF5W2luZGV4XS55LCB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgdGhpcy5zY29yZURpbWVuc2lvbnMuaGVpZ2h0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TY29yZVJlbmRlciA9IFNjb3JlUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRvbUhhbmRsZXIgPSB2b2lkIDA7XG5jbGFzcyBEb21IYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgW3RoaXMuYmFja2dyb3VuZENhbnZhcywgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImJhY2tncm91bmRDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLnNjb3JlQ2FudmFzLCB0aGlzLnNjb3JlQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcInNjb3JlQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5nYW1lQ2FudmFzLCB0aGlzLmdhbWVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiZ2FtZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMubWVudUNhbnZhcywgdGhpcy5tZW51Q29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcIm1lbnVDYW52YXNcIik7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRDYW52YXMoaWQpIHtcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IGNvbnRleHQgbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtjYW52YXMsIGNvbnRleHRdO1xuICAgIH1cbn1cbmV4cG9ydHMuRG9tSGFuZGxlciA9IERvbUhhbmRsZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IHZvaWQgMDtcbmNsYXNzIFVJSW50ZXJhY3Rpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB9XG4gICAgdXBkYXRlKGhvdmVyYWJsZSwgb25DbGljaywgZGVsdGFNcykge1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJlZCA9IGhvdmVyYWJsZS5jb250YWlucyh0aGlzLmlucHV0Lm1vdXNlUG9zaXRpb24pO1xuICAgICAgICBpZiAoaG92ZXJhYmxlLmhvdmVyZWQgJiYgdGhpcy5pbnB1dC5pc01vdXNlUHJlc3NlZCkge1xuICAgICAgICAgICAgb25DbGljaygpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0ZXAgPSAoZGVsdGFNcyAvIGhvdmVyYWJsZS5nZXRUcmFuc2l0aW9uVGltZSgpKSAqIChob3ZlcmFibGUuaG92ZXJlZCA/IDEgOiAtMSk7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgKyBzdGVwKSk7XG4gICAgfVxufVxuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gVUlJbnRlcmFjdGlvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FdmVudEJ1c1V0aWxpdGllcyA9IHZvaWQgMDtcbmNvbnN0IHRzX2J1c18xID0gcmVxdWlyZShcInRzLWJ1c1wiKTtcbmNsYXNzIEV2ZW50QnVzVXRpbGl0aWVzIHtcbn1cbmV4cG9ydHMuRXZlbnRCdXNVdGlsaXRpZXMgPSBFdmVudEJ1c1V0aWxpdGllcztcbkV2ZW50QnVzVXRpbGl0aWVzLnN0YXR1c0NoYW5nZWRFdmVudCA9ICgwLCB0c19idXNfMS5jcmVhdGVFdmVudERlZmluaXRpb24pKCkoXCJzdGF0dXNDaGFuZ2VkXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVDb25maWdzID0gdm9pZCAwO1xuY2xhc3MgR2FtZUNvbmZpZ3Mge1xuICAgIGNvbnN0cnVjdG9yKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJCb3JkZXIgPSAyO1xuICAgICAgICB0aGlzLmJhbGxCb3JkZXIgPSAxO1xuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgKiA0LjUpIC8gNik7XG4gICAgICAgIHRoaXMuZmllbGRYT2Zmc2V0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gMTYpO1xuICAgICAgICB0aGlzLmZpZWxkV2lkdGggPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLSB0aGlzLmZpZWxkWE9mZnNldCAqIDIpO1xuICAgICAgICB0aGlzLmdvYWxIZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA1KTtcbiAgICAgICAgdGhpcy5nb2FsWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmdvYWxIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMuZ29hbFBvc3RSYWRpdXMgPSBNYXRoLnJvdW5kKHRoaXMuZ29hbEhlaWdodCAvIDIwKTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0ID0gTWF0aC5yb3VuZCgoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCkgKiA1KSAvIDcpO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyID0gTWF0aC5mbG9vcih0aGlzLmZpZWxkSGVpZ2h0IC8gMjYpO1xuICAgICAgICB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciArIHRoaXMucGxheWVyQm9yZGVyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFggPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRXaWR0aCAvIDQpO1xuICAgICAgICB0aGlzLnBsYXllclN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgdGhpcy5jcHVTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyAodGhpcy5maWVsZFdpZHRoIC0gdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYKTtcbiAgICAgICAgdGhpcy5zaGFkb3dCbHVyID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgdGhpcy5zaGFkb3dPZmZzZXQgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogMC4zO1xuICAgICAgICB0aGlzLmZpZWxkQm9yZGVyU2l6ZSA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDEwMCk7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvblhPZmZzZXQgPSB0aGlzLmZpZWxkV2lkdGggLyA4O1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID0gdGhpcy5maWVsZEhlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0ZVN0YXJ0UG9zaXRpb25ZT2Zmc2V0ID1cbiAgICAgICAgICAgIHRoaXMuZmllbGRIZWlnaHQgKyB0aGlzLmF0aGxldGljVHJhY2tZT2Zmc2V0ICsgdGhpcy5hdGhsZXRpY1RyYWNrSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5nYXRlc0xlbmd0aCA9IHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgKiAzO1xuICAgICAgICB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDgwKTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciArIHRoaXMuYmFsbEJvcmRlcjtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVDb25maWdzID0gR2FtZUNvbmZpZ3M7XG5HYW1lQ29uZmlncy5JU19ERUJVRyA9IHRydWU7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jb25zdCBHYW1lTG9vcF8xID0gcmVxdWlyZShcIi4vY29yZS9HYW1lTG9vcFwiKTtcbmNvbnN0IERvbUhhbmRsZXJfMSA9IHJlcXVpcmUoXCIuL3VpL0RvbUhhbmRsZXJcIik7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBNYWluIHtcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBhc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGF3YWl0IGFzc2V0TG9hZGVyLmluaXQoKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY2xvc2VMb2FkaW5nV2luZG93KCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgZ2FtZUxvb3AubWFpbigpO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICAgICAgLy9kb21IYW5kbGVyLm1lbnVDYW52YXMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbn1cbmNvbnN0IG1haW4gPSBuZXcgTWFpbigpO1xubWFpbi5pbml0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
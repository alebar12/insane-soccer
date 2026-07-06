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
    kick() {
        let speedFactor = 1;
        if (this.attachedPlayer?.powerShotWrapper.getPowerShot()) {
            this.ballPowerShot.enablePowerShot(this.attachedPlayer);
            speedFactor = PowerShotType_1.PowerShotUtilities.getSpeedFactor(this.ballPowerShot.getPowerShotType());
        }
        this.attachedPlayer?.powerShotWrapper.resetPowerShot();
        this.releaseFromPlayer();
        this.movementPosition.setSpeed(this.maxSpeed * speedFactor, this.angleWithPlayer);
    }
    releaseFromPlayer() {
        this.attachedPlayer = null;
        this.ballStatus = BallStatus_1.BallStatus.FREE;
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
        return this.bouncingTime < this.bouncingDuration;
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
    GameStatus["SUBSTITUTION"] = "SUBSTITUTION";
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
        if (speed === 0 || this.acceleration <= 0)
            return position;
        const absSpeed = Math.abs(speed);
        const n = Math.ceil(absSpeed / this.acceleration);
        const distance = (n * (2 * absSpeed - (n - 1) * this.acceleration)) / 2;
        return position + Math.sign(speed) * distance;
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
        this.publishStatusChange();
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
                this.publishStatusChange();
            }
        }
        this.scheduledEvents = this.scheduledEvents.filter(e => this.time < e.time);
    }
    publishStatusChange() {
        this.bus.publish(EventBusUtilities_1.EventBusUtilities.statusChangedEvent(this.gameStatus));
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
        this.lastSideUpdated = PlayerSide_1.PlayerSide.LEFT;
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
        gameWorld.gates.update(deltaMs, gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION);
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
        return gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION;
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
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION) &&
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
            const avoidBounceOnSubstitution = gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION;
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
                ball.releaseFromPlayer();
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
const CpuMovementStrategy_1 = __webpack_require__(/*! ./playersStrategies/CpuMovementStrategy */ "./src/game/systems/movement/playersStrategies/CpuMovementStrategy.ts");
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
        this.playerStrategies.push(new CpuMovementStrategy_1.CpuMovementStrategy(gameConfigs));
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
        ball.kick();
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
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION);
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

/***/ "./src/game/systems/movement/playersStrategies/CpuMovementStrategy.ts"
/*!****************************************************************************!*\
  !*** ./src/game/systems/movement/playersStrategies/CpuMovementStrategy.ts ***!
  \****************************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CpuMovementStrategy = void 0;
const BallStatus_1 = __webpack_require__(/*! ../../../enums/BallStatus */ "./src/game/enums/BallStatus.ts");
const GameStatus_1 = __webpack_require__(/*! ../../../enums/GameStatus */ "./src/game/enums/GameStatus.ts");
const PlayerStatus_1 = __webpack_require__(/*! ../../../enums/PlayerStatus */ "./src/game/enums/PlayerStatus.ts");
const MovementPoint_1 = __webpack_require__(/*! ../../../geometry/MovementPoint */ "./src/game/geometry/MovementPoint.ts");
const Point_1 = __webpack_require__(/*! ../../../geometry/Point */ "./src/game/geometry/Point.ts");
class CpuMovementStrategy {
    constructor(gameConfigs) {
        this.rotateDirection = 0;
        this.rotateAngle = 0;
        this.gameConfigs = gameConfigs;
        this.centerFieldX = gameConfigs.fieldXOffset + gameConfigs.fieldWidth / 2;
        this.goalOffset = this.gameConfigs.goalHeight * 0.5;
    }
    canBeApplied(player, gameWorld) {
        return (!player.isSubstitute &&
            player.isCpu &&
            gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.PLAYING &&
            player.playerStatus === PlayerStatus_1.PlayerStatus.NORMAL);
    }
    apply(player, gameWorld, deltaMs) {
        const ball = gameWorld.ball;
        const attachedPlayer = ball.attachedPlayer;
        player.currentMaxSpeed = player.normalMaxSpeed;
        let destinationPosition = null;
        if (ball.ballStatus === BallStatus_1.BallStatus.FREE) {
            destinationPosition = ball.movementPosition.clone();
            this.rotateDirection = 0;
        }
        else if (ball.ballStatus === BallStatus_1.BallStatus.ATTACHED && attachedPlayer !== null) {
            if (!attachedPlayer.isCpu) {
                destinationPosition = attachedPlayer.movementPosition.clone();
                destinationPosition.velocity = new Point_1.Point(0, 0);
                destinationPosition.acceleration = 0;
            }
            else {
                if (player.movementPosition.position.x > this.centerFieldX) {
                    destinationPosition = new MovementPoint_1.MovementPoint(new Point_1.Point(this.gameConfigs.fieldXOffset, this.gameConfigs.fieldHeight / 2), new Point_1.Point(0, 0), 0, 0);
                }
                else {
                    this.rotateCpu(player, deltaMs);
                }
                this.tryKick(player, ball);
            }
        }
        if (destinationPosition !== null) {
            player.destinationPosition = destinationPosition;
            player.adjustSpeedToDestinationPoint(deltaMs);
        }
    }
    rotateCpu(player, deltaMs) {
        if (this.rotateDirection === 0) {
            this.rotateDirection = Math.random() < 0.5 ? -1 : 1;
            this.rotateAngle =
                (Math.random() * (Math.PI / 50 - Math.PI / 100) + Math.PI / 100) * 0.07;
        }
        let speed = player.movementPosition.getSpeed();
        let angle = player.movementPosition.getSpeedAngle();
        speed = speed + player.movementPosition.acceleration * deltaMs;
        angle = angle + this.rotateDirection * this.rotateAngle * deltaMs;
        player.movementPosition.setSpeed(speed, angle);
        player.movementPosition.adjustToMaxSpeed(player.currentMaxSpeed);
    }
    tryKick(player, ball) {
        if (ball.movementPosition.position.x < player.movementPosition.position.x) {
            const m = (ball.movementPosition.position.y - player.movementPosition.position.y) /
                (ball.movementPosition.position.x - player.movementPosition.position.x);
            const y = m * (this.gameConfigs.fieldXOffset - player.movementPosition.position.x) +
                player.movementPosition.position.y;
            if (y >= this.gameConfigs.goalYOffset - this.goalOffset &&
                y <= this.gameConfigs.goalYOffset + this.gameConfigs.goalHeight + this.goalOffset) {
                ball.kick();
            }
        }
    }
}
exports.CpuMovementStrategy = CpuMovementStrategy;


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
        return (gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION &&
            !player.isSubstitute);
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
            this.gameStatusManager.changeStatus(GameStatus_1.GameStatus.SUBSTITUTION);
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
    dispose() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("keyup", this.onKeyUp);
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
    dispose() {
        this.element.removeEventListener("mousemove", this.onMouseMove);
        this.element.removeEventListener("click", this.onClick);
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
                gameWorld.gameStatusManager.gameStatus === GameStatus_1.GameStatus.SUBSTITUTION) &&
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QzVCO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsNkNBQTZDO0FBQzdDLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBO0FBQ0Esc0JBQXNCLG9CQUFvQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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LG1CQUFtQixtQkFBTyxDQUFDLCtDQUFpQjtBQUM1QyxxQkFBcUIsbUJBQU8sQ0FBQywrQ0FBaUI7QUFDOUMsc0JBQXNCLG1CQUFPLENBQUMsdURBQXFCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksWUFBWTtBQUN6QjtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIyL2xpYi9ldmVudGVtaXR0ZXIyLmpzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy90cy1idXMvRXZlbnRCdXMuanMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vbm9kZV9tb2R1bGVzL3RzLWJ1cy9pbmRleC5qcyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvYXNzZXRzL0Fzc2V0TG9hZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9jb3JlL0dhbWVMb29wLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0JhbGwudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvRXhwbG9zaW9uLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0ZpcmV3b3Jrcy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9HYXRlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0dvYWxQb3N0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Ib3ZlcmFibGVFbnRpdHkudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvTWVudUJ1dHRvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9QbGF5ZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvYm91bmNlL0JvdW5jZVdyYXBwZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9CYWxsUG93ZXJTaG90LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRWxlY3RyaWNQb3dlclNob3QudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9GaXJlUG93ZXJTaG90LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvUG93ZXJTaG90V3JhcHBlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9zdHVubmVkL1N0dW5uZWRTdGFycy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9zdHVubmVkL1N0dW5uZWRXcmFwcGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0JhbGxTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvR2FtZVN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9LZXlzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL1BsYXllclNpZGUudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvUGxheWVyU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL1Bvd2VyU2hvdFR5cGUudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvQm9yZGVyTGltaXRzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvTW92ZW1lbnRQb2ludC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Qb2ludC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9Qb3NpdGlvbkhpc3RvcnkudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvbWFuYWdlcnMvR2FtZVN0YXR1c01hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvbWFuYWdlcnMvU2NvcmVNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvR2F0ZVN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL01haW5TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jaGVja2Vycy9DaGVja2VyU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY2hlY2tlcnMvc3RyYXRlZ2llcy9TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jaGVja2Vycy9zdHJhdGVnaWVzL1dhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL0NvbGxpc2lvblN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL1BsYXllckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvTW92ZW1lbnRTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L2JhbGxTdHJhdGVnaWVzL1BsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvQ3B1TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS93b3JsZC9HYW1lV29ybGQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2lucHV0L0tleWJvYXJkSW5wdXRNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL01haW5SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0JhbGxSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0JhbGxUcmFqZWN0b3J5UmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9FeHBsb3Npb25SZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0ZpZWxkUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9GaXJld29ya3NSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL0dhdGVzUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9NZW51UmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9QbGF5ZXJQb3dlclNob3RSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL1BsYXllclJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvU2NvcmVSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3VpL0RvbUhhbmRsZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3VpL1VJSW50ZXJhY3Rpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3V0aWxzL0V2ZW50QnVzVXRpbGl0aWVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9HYW1lQ29uZmlncy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyohXHJcbiAqIEV2ZW50RW1pdHRlcjJcclxuICogaHR0cHM6Ly9naXRodWIuY29tL2hpajFueC9FdmVudEVtaXR0ZXIyXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxMyBoaWoxbnhcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG4gKi9cclxuOyFmdW5jdGlvbih1bmRlZmluZWQpIHtcclxuXHJcbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5ID8gQXJyYXkuaXNBcnJheSA6IGZ1bmN0aW9uIF9pc0FycmF5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XHJcbiAgfTtcclxuICB2YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xyXG5cclxuICBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICBpZiAodGhpcy5fY29uZikge1xyXG4gICAgICBjb25maWd1cmUuY2FsbCh0aGlzLCB0aGlzLl9jb25mKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZShjb25mKSB7XHJcbiAgICBpZiAoY29uZikge1xyXG4gICAgICB0aGlzLl9jb25mID0gY29uZjtcclxuXHJcbiAgICAgIGNvbmYuZGVsaW1pdGVyICYmICh0aGlzLmRlbGltaXRlciA9IGNvbmYuZGVsaW1pdGVyKTtcclxuICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID0gY29uZi5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCA/IGNvbmYubWF4TGlzdGVuZXJzIDogZGVmYXVsdE1heExpc3RlbmVycztcclxuXHJcbiAgICAgIGNvbmYud2lsZGNhcmQgJiYgKHRoaXMud2lsZGNhcmQgPSBjb25mLndpbGRjYXJkKTtcclxuICAgICAgY29uZi5uZXdMaXN0ZW5lciAmJiAodGhpcy5fbmV3TGlzdGVuZXIgPSBjb25mLm5ld0xpc3RlbmVyKTtcclxuICAgICAgY29uZi5yZW1vdmVMaXN0ZW5lciAmJiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIgPSBjb25mLnJlbW92ZUxpc3RlbmVyKTtcclxuICAgICAgY29uZi52ZXJib3NlTWVtb3J5TGVhayAmJiAodGhpcy52ZXJib3NlTWVtb3J5TGVhayA9IGNvbmYudmVyYm9zZU1lbW9yeUxlYWspO1xyXG5cclxuICAgICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVyVHJlZSA9IHt9O1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbG9nUG9zc2libGVNZW1vcnlMZWFrKGNvdW50LCBldmVudE5hbWUpIHtcclxuICAgIHZhciBlcnJvck1zZyA9ICcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcclxuICAgICAgICAnbGVhayBkZXRlY3RlZC4gJyArIGNvdW50ICsgJyBsaXN0ZW5lcnMgYWRkZWQuICcgK1xyXG4gICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nO1xyXG5cclxuICAgIGlmKHRoaXMudmVyYm9zZU1lbW9yeUxlYWspe1xyXG4gICAgICBlcnJvck1zZyArPSAnIEV2ZW50IG5hbWU6ICcgKyBldmVudE5hbWUgKyAnLic7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHByb2Nlc3MuZW1pdFdhcm5pbmcpe1xyXG4gICAgICB2YXIgZSA9IG5ldyBFcnJvcihlcnJvck1zZyk7XHJcbiAgICAgIGUubmFtZSA9ICdNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcnO1xyXG4gICAgICBlLmVtaXR0ZXIgPSB0aGlzO1xyXG4gICAgICBlLmNvdW50ID0gY291bnQ7XHJcbiAgICAgIHByb2Nlc3MuZW1pdFdhcm5pbmcoZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yTXNnKTtcclxuXHJcbiAgICAgIGlmIChjb25zb2xlLnRyYWNlKXtcclxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIEV2ZW50RW1pdHRlcihjb25mKSB7XHJcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcclxuICAgIHRoaXMuX25ld0xpc3RlbmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLl9yZW1vdmVMaXN0ZW5lciA9IGZhbHNlO1xyXG4gICAgdGhpcy52ZXJib3NlTWVtb3J5TGVhayA9IGZhbHNlO1xyXG4gICAgY29uZmlndXJlLmNhbGwodGhpcywgY29uZik7XHJcbiAgfVxyXG4gIEV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyOyAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3IgZXhwb3J0aW5nIEV2ZW50RW1pdHRlciBwcm9wZXJ0eVxyXG5cclxuICAvL1xyXG4gIC8vIEF0dGVudGlvbiwgZnVuY3Rpb24gcmV0dXJuIHR5cGUgbm93IGlzIGFycmF5LCBhbHdheXMgIVxyXG4gIC8vIEl0IGhhcyB6ZXJvIGVsZW1lbnRzIGlmIG5vIGFueSBtYXRjaGVzIGZvdW5kIGFuZCBvbmUgb3IgbW9yZVxyXG4gIC8vIGVsZW1lbnRzIChsZWFmcykgaWYgdGhlcmUgYXJlIG1hdGNoZXNcclxuICAvL1xyXG4gIGZ1bmN0aW9uIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZSwgaSkge1xyXG4gICAgaWYgKCF0cmVlKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICAgIHZhciBsaXN0ZW5lcnM9W10sIGxlYWYsIGxlbiwgYnJhbmNoLCB4VHJlZSwgeHhUcmVlLCBpc29sYXRlZEJyYW5jaCwgZW5kUmVhY2hlZCxcclxuICAgICAgICB0eXBlTGVuZ3RoID0gdHlwZS5sZW5ndGgsIGN1cnJlbnRUeXBlID0gdHlwZVtpXSwgbmV4dFR5cGUgPSB0eXBlW2krMV07XHJcbiAgICBpZiAoaSA9PT0gdHlwZUxlbmd0aCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQocykgbGlzdCBhbmQgdGhlIHRyZWUgaGFzIGxpc3RlbmVyc1xyXG4gICAgICAvLyBpbnZva2UgdGhvc2UgbGlzdGVuZXJzLlxyXG4gICAgICAvL1xyXG4gICAgICBpZiAodHlwZW9mIHRyZWUuX2xpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGhhbmRsZXJzICYmIGhhbmRsZXJzLnB1c2godHJlZS5fbGlzdGVuZXJzKTtcclxuICAgICAgICByZXR1cm4gW3RyZWVdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZvciAobGVhZiA9IDAsIGxlbiA9IHRyZWUuX2xpc3RlbmVycy5sZW5ndGg7IGxlYWYgPCBsZW47IGxlYWYrKykge1xyXG4gICAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnNbbGVhZl0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW3RyZWVdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKChjdXJyZW50VHlwZSA9PT0gJyonIHx8IGN1cnJlbnRUeXBlID09PSAnKionKSB8fCB0cmVlW2N1cnJlbnRUeXBlXSkge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBJZiB0aGUgZXZlbnQgZW1pdHRlZCBpcyAnKicgYXQgdGhpcyBwYXJ0XHJcbiAgICAgIC8vIG9yIHRoZXJlIGlzIGEgY29uY3JldGUgbWF0Y2ggYXQgdGhpcyBwYXRjaFxyXG4gICAgICAvL1xyXG4gICAgICBpZiAoY3VycmVudFR5cGUgPT09ICcqJykge1xyXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcclxuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcclxuICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSsxKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XHJcbiAgICAgIH0gZWxzZSBpZihjdXJyZW50VHlwZSA9PT0gJyoqJykge1xyXG4gICAgICAgIGVuZFJlYWNoZWQgPSAoaSsxID09PSB0eXBlTGVuZ3RoIHx8IChpKzIgPT09IHR5cGVMZW5ndGggJiYgbmV4dFR5cGUgPT09ICcqJykpO1xyXG4gICAgICAgIGlmKGVuZFJlYWNoZWQgJiYgdHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAvLyBUaGUgbmV4dCBlbGVtZW50IGhhcyBhIF9saXN0ZW5lcnMsIGFkZCBpdCB0byB0aGUgaGFuZGxlcnMuXHJcbiAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZSwgdHlwZUxlbmd0aCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xyXG4gICAgICAgICAgaWYgKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBpZihicmFuY2ggPT09ICcqJyB8fCBicmFuY2ggPT09ICcqKicpIHtcclxuICAgICAgICAgICAgICBpZih0cmVlW2JyYW5jaF0uX2xpc3RlbmVycyAmJiAhZW5kUmVhY2hlZCkge1xyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgdHlwZUxlbmd0aCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSsyKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gTm8gbWF0Y2ggb24gdGhpcyBvbmUsIHNoaWZ0IGludG8gdGhlIHRyZWUgYnV0IG5vdCBpbiB0aGUgdHlwZSBhcnJheS5cclxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcclxuICAgICAgfVxyXG5cclxuICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbY3VycmVudFR5cGVdLCBpKzEpKTtcclxuICAgIH1cclxuXHJcbiAgICB4VHJlZSA9IHRyZWVbJyonXTtcclxuICAgIGlmICh4VHJlZSkge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgdHJlZSB3aWxsIGFsbG93IGFueSBtYXRjaCBmb3IgdGhpcyBwYXJ0LFxyXG4gICAgICAvLyB0aGVuIHJlY3Vyc2l2ZWx5IGV4cGxvcmUgYWxsIGJyYW5jaGVzIG9mIHRoZSB0cmVlXHJcbiAgICAgIC8vXHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeFRyZWUsIGkrMSk7XHJcbiAgICB9XHJcblxyXG4gICAgeHhUcmVlID0gdHJlZVsnKionXTtcclxuICAgIGlmKHh4VHJlZSkge1xyXG4gICAgICBpZihpIDwgdHlwZUxlbmd0aCkge1xyXG4gICAgICAgIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgbGlzdGVuZXIgb24gYSAnKionLCBpdCB3aWxsIGNhdGNoIGFsbCwgc28gYWRkIGl0cyBoYW5kbGVyLlxyXG4gICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQnVpbGQgYXJyYXlzIG9mIG1hdGNoaW5nIG5leHQgYnJhbmNoZXMgYW5kIG90aGVycy5cclxuICAgICAgICBmb3IoYnJhbmNoIGluIHh4VHJlZSkge1xyXG4gICAgICAgICAgaWYoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgeHhUcmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcclxuICAgICAgICAgICAgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xyXG4gICAgICAgICAgICAgIC8vIFdlIGtub3cgdGhlIG5leHQgZWxlbWVudCB3aWxsIG1hdGNoLCBzbyBqdW1wIHR3aWNlLlxyXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihicmFuY2ggPT09IGN1cnJlbnRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ3VycmVudCBub2RlIG1hdGNoZXMsIG1vdmUgaW50byB0aGUgdHJlZS5cclxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVticmFuY2hdLCBpKzEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoID0ge307XHJcbiAgICAgICAgICAgICAgaXNvbGF0ZWRCcmFuY2hbYnJhbmNoXSA9IHh4VHJlZVticmFuY2hdO1xyXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeyAnKionOiBpc29sYXRlZEJyYW5jaCB9LCBpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIHJlYWNoZWQgdGhlIGVuZCBhbmQgc3RpbGwgb24gYSAnKionXHJcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWUsIHR5cGVMZW5ndGgpO1xyXG4gICAgICB9IGVsc2UgaWYoeHhUcmVlWycqJ10gJiYgeHhUcmVlWycqJ10uX2xpc3RlbmVycykge1xyXG4gICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlWycqJ10sIHR5cGVMZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxpc3RlbmVycztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdyb3dMaXN0ZW5lclRyZWUodHlwZSwgbGlzdGVuZXIpIHtcclxuXHJcbiAgICB0eXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcblxyXG4gICAgLy9cclxuICAgIC8vIExvb2tzIGZvciB0d28gY29uc2VjdXRpdmUgJyoqJywgaWYgc28sIGRvbid0IGFkZCB0aGUgZXZlbnQgYXQgYWxsLlxyXG4gICAgLy9cclxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHR5cGUubGVuZ3RoOyBpKzEgPCBsZW47IGkrKykge1xyXG4gICAgICBpZih0eXBlW2ldID09PSAnKionICYmIHR5cGVbaSsxXSA9PT0gJyoqJykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciB0cmVlID0gdGhpcy5saXN0ZW5lclRyZWU7XHJcbiAgICB2YXIgbmFtZSA9IHR5cGUuc2hpZnQoKTtcclxuXHJcbiAgICB3aGlsZSAobmFtZSAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICBpZiAoIXRyZWVbbmFtZV0pIHtcclxuICAgICAgICB0cmVlW25hbWVdID0ge307XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRyZWUgPSB0cmVlW25hbWVdO1xyXG5cclxuICAgICAgaWYgKHR5cGUubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGlmICghdHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBsaXN0ZW5lcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpZiAodHlwZW9mIHRyZWUuX2xpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBbdHJlZS5fbGlzdGVuZXJzXTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XHJcblxyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAhdHJlZS5fbGlzdGVuZXJzLndhcm5lZCAmJlxyXG4gICAgICAgICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPiAwICYmXHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5sZW5ndGggPiB0aGlzLl9tYXhMaXN0ZW5lcnNcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMud2FybmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgbG9nUG9zc2libGVNZW1vcnlMZWFrLmNhbGwodGhpcywgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCwgbmFtZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIG5hbWUgPSB0eXBlLnNoaWZ0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cclxuICAvLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcclxuICAvLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cclxuICAvL1xyXG4gIC8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xyXG4gIC8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmRlbGltaXRlciA9ICcuJztcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XHJcbiAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuX21heExpc3RlbmVycyA9IG47XHJcbiAgICAgIGlmICghdGhpcy5fY29uZikgdGhpcy5fY29uZiA9IHt9O1xyXG4gICAgICB0aGlzLl9jb25mLm1heExpc3RlbmVycyA9IG47XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudCA9ICcnO1xyXG5cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25jZShldmVudCwgZm4sIGZhbHNlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbmNlKGV2ZW50LCBmbiwgdHJ1ZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fb25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbiwgcHJlcGVuZCkge1xyXG4gICAgdGhpcy5fbWFueShldmVudCwgMSwgZm4sIHByZXBlbmQpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5tYW55ID0gZnVuY3Rpb24oZXZlbnQsIHR0bCwgZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9tYW55KGV2ZW50LCB0dGwsIGZuLCBmYWxzZSk7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRNYW55ID0gZnVuY3Rpb24oZXZlbnQsIHR0bCwgZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9tYW55KGV2ZW50LCB0dGwsIGZuLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbiwgcHJlcGVuZCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcclxuICAgICAgaWYgKC0tdHRsID09PSAwKSB7XHJcbiAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW5lci5fb3JpZ2luID0gZm47XHJcblxyXG4gICAgdGhpcy5fb24oZXZlbnQsIGxpc3RlbmVyLCBwcmVwZW5kKTtcclxuXHJcbiAgICByZXR1cm4gc2VsZjtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHZhciB0eXBlID0gYXJndW1lbnRzWzBdO1xyXG5cclxuICAgIGlmICh0eXBlID09PSAnbmV3TGlzdGVuZXInICYmICF0aGlzLl9uZXdMaXN0ZW5lcikge1xyXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBhbCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICB2YXIgYXJncyxsLGksajtcclxuICAgIHZhciBoYW5kbGVyO1xyXG5cclxuICAgIGlmICh0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCkge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fYWxsLnNsaWNlKCk7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsKTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgYWw7IGorKykgYXJnc1tqXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChpID0gMCwgbCA9IGhhbmRsZXIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXIsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAvLyBuZWVkIHRvIG1ha2UgY29weSBvZiBoYW5kbGVycyBiZWNhdXNlIGxpc3QgY2FuIGNoYW5nZSBpbiB0aGUgbWlkZGxlXHJcbiAgICAgICAgLy8gb2YgZW1pdCBjYWxsXHJcbiAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYW5kbGVyICYmIGhhbmRsZXIubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9hbGwgJiYgdHlwZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gISF0aGlzLl9hbGw7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0QXN5bmMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHZhciB0eXBlID0gYXJndW1lbnRzWzBdO1xyXG5cclxuICAgIGlmICh0eXBlID09PSAnbmV3TGlzdGVuZXInICYmICF0aGlzLl9uZXdMaXN0ZW5lcikge1xyXG4gICAgICAgIGlmICghdGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKSB7IHJldHVybiBQcm9taXNlLnJlc29sdmUoW2ZhbHNlXSk7IH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgcHJvbWlzZXM9IFtdO1xyXG5cclxuICAgIHZhciBhbCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICB2YXIgYXJncyxsLGksajtcclxuICAgIHZhciBoYW5kbGVyO1xyXG5cclxuICAgIGlmICh0aGlzLl9hbGwpIHtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2pdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLl9hbGwubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmNhbGwodGhpcywgdHlwZSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0pKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgaGFuZGxlciA9IFtdO1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlciwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgIGNhc2UgMTpcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXIuY2FsbCh0aGlzKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgMjpcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAzOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXIuYXBwbHkodGhpcywgYXJncykpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5sZW5ndGgpIHtcclxuICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKTtcclxuICAgICAgaWYgKGFsID4gMykge1xyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IGhhbmRsZXIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5jYWxsKHRoaXMpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uYXBwbHkodGhpcywgYXJncykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICghdGhpcy5fYWxsICYmIHR5cGUgPT09ICdlcnJvcicpIHtcclxuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGFyZ3VtZW50c1sxXSk7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcclxuICAgIHJldHVybiB0aGlzLl9vbih0eXBlLCBsaXN0ZW5lciwgZmFsc2UpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcclxuICAgIHJldHVybiB0aGlzLl9vbih0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbkFueSA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25BbnkoZm4sIGZhbHNlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRBbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uQW55KGZuLCB0cnVlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fb25BbnkgPSBmdW5jdGlvbihmbiwgcHJlcGVuZCl7XHJcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignb25Bbnkgb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5fYWxsKSB7XHJcbiAgICAgIHRoaXMuX2FsbCA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCB0aGUgZnVuY3Rpb24gdG8gdGhlIGV2ZW50IGxpc3RlbmVyIGNvbGxlY3Rpb24uXHJcbiAgICBpZihwcmVwZW5kKXtcclxuICAgICAgdGhpcy5fYWxsLnVuc2hpZnQoZm4pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuX2FsbC5wdXNoKGZuKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX29uID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIsIHByZXBlbmQpIHtcclxuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aGlzLl9vbkFueSh0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbiBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXHJcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxyXG4gICAgaWYgKHRoaXMuX25ld0xpc3RlbmVyKVxyXG4gICAgICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBncm93TGlzdGVuZXJUcmVlLmNhbGwodGhpcywgdHlwZSwgbGlzdGVuZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xyXG4gICAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHNbdHlwZV0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAvLyBDaGFuZ2UgdG8gYXJyYXkuXHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFkZFxyXG4gICAgICBpZihwcmVwZW5kKXtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0udW5zaGlmdChsaXN0ZW5lcik7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcclxuICAgICAgaWYgKFxyXG4gICAgICAgICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkICYmXHJcbiAgICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID4gMCAmJlxyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiB0aGlzLl9tYXhMaXN0ZW5lcnNcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XHJcbiAgICAgICAgbG9nUG9zc2libGVNZW1vcnlMZWFrLmNhbGwodGhpcywgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCwgdHlwZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcclxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBoYW5kbGVycyxsZWFmcz1bXTtcclxuXHJcbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXHJcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcclxuICAgICAgaGFuZGxlcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgIGxlYWZzLnB1c2goe19saXN0ZW5lcnM6aGFuZGxlcnN9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcclxuICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XHJcbiAgICAgIGhhbmRsZXJzID0gbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICBpZiAoaXNBcnJheShoYW5kbGVycykpIHtcclxuXHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBsaXN0ZW5lciB8fFxyXG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0ubGlzdGVuZXIgJiYgaGFuZGxlcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB8fFxyXG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0uX29yaWdpbiAmJiBoYW5kbGVyc1tpXS5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgbGVhZi5fbGlzdGVuZXJzLnNwbGljZShwb3NpdGlvbiwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnNwbGljZShwb3NpdGlvbiwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaGFuZGxlcnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKVxyXG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgdHlwZSwgbGlzdGVuZXIpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChoYW5kbGVycyA9PT0gbGlzdGVuZXIgfHxcclxuICAgICAgICAoaGFuZGxlcnMubGlzdGVuZXIgJiYgaGFuZGxlcnMubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB8fFxyXG4gICAgICAgIChoYW5kbGVycy5fb3JpZ2luICYmIGhhbmRsZXJzLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xyXG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyKVxyXG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgdHlwZSwgbGlzdGVuZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdChyb290KSB7XHJcbiAgICAgIGlmIChyb290ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb290KTtcclxuICAgICAgZm9yICh2YXIgaSBpbiBrZXlzKSB7XHJcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XHJcbiAgICAgICAgdmFyIG9iaiA9IHJvb3Rba2V5XTtcclxuICAgICAgICBpZiAoKG9iaiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB8fCAodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIikgfHwgKG9iaiA9PT0gbnVsbCkpXHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICBpZiAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHJvb3Rba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgZGVsZXRlIHJvb3Rba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3QodGhpcy5saXN0ZW5lclRyZWUpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmQW55ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIHZhciBpID0gMCwgbCA9IDAsIGZucztcclxuICAgIGlmIChmbiAmJiB0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCA+IDApIHtcclxuICAgICAgZm5zID0gdGhpcy5fYWxsO1xyXG4gICAgICBmb3IoaSA9IDAsIGwgPSBmbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYoZm4gPT09IGZuc1tpXSkge1xyXG4gICAgICAgICAgZm5zLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcilcclxuICAgICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJBbnlcIiwgZm4pO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XHJcbiAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcikge1xyXG4gICAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspXHJcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lckFueVwiLCBmbnNbaV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX2FsbCA9IFtdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmO1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIGlmICh0eXBlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgIXRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICB2YXIgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG5cclxuICAgICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XHJcbiAgICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XHJcbiAgICAgICAgbGVhZi5fbGlzdGVuZXJzID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzKSB7XHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBoYW5kbGVycyA9IFtdO1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlcnMsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICAgIHJldHVybiBoYW5kbGVycztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcclxuICAgIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX2V2ZW50cyk7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnModHlwZSkubGVuZ3RoO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzQW55ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgaWYodGhpcy5fYWxsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9hbGw7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxyXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgIC8vIENvbW1vbkpTXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICAvLyBCcm93c2VyIGdsb2JhbC5cclxuICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyO1xyXG4gIH1cclxufSgpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyBVc2luZyBFdmVudEVtaXR0ZXIyIGluIG9yZGVyIHRvIGJlIGFibGUgdG8gdXNlIHdpbGRjYXJkcyB0byBzdWJzY3JpYmUgdG8gYWxsIGV2ZW50c1xudmFyIGV2ZW50ZW1pdHRlcjJfMSA9IHJlcXVpcmUoXCJldmVudGVtaXR0ZXIyXCIpO1xuZnVuY3Rpb24gc2hvd1dhcm5pbmcobXNnKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAocHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNFdmVudERlc2NyaXB0b3IoZGVzY3JpcHRvcikge1xuICAgIHJldHVybiAhIWRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci5ldmVudFR5cGU7XG59XG5mdW5jdGlvbiBpc1ByZWRpY2F0ZUZuKGRlc2NyaXB0b3IpIHtcbiAgICByZXR1cm4gIWlzRXZlbnREZXNjcmlwdG9yKGRlc2NyaXB0b3IpICYmIHR5cGVvZiBkZXNjcmlwdG9yID09PSBcImZ1bmN0aW9uXCI7XG59XG5mdW5jdGlvbiBjcmVhdGVFdmVudERlZmluaXRpb24ob3B0aW9ucykge1xuICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSkge1xuICAgICAgICBmdW5jdGlvbiBldmVudENyZWF0b3IocGF5bG9hZCkge1xuICAgICAgICAgICAgLy8gQWxsb3cgcnVudGltZSBwYXlsb2FkIGNoZWNraW5nIGZvciBwbGFpbiBKYXZhU2NyaXB0IHVzYWdlXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlc3RGbiA9IHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIgPyBvcHRpb25zIDogb3B0aW9ucy50ZXN0O1xuICAgICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgICAgICAgaWYgKHRlc3RGbiAmJiAhdGVzdEZuKHBheWxvYWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dXYXJuaW5nKEpTT04uc3RyaW5naWZ5KHBheWxvYWQpICsgXCIgZG9lcyBub3QgbWF0Y2ggZXhwZWN0ZWQgcGF5bG9hZC5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnRDcmVhdG9yLmV2ZW50VHlwZSA9IHR5cGU7XG4gICAgICAgIGV2ZW50Q3JlYXRvci50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHR5cGU7IH07IC8vIGFsbG93IFN0cmluZyBjb2VyY2lvbiB0byBkZWxpdmVyIHRoZSBldmVudFR5cGVcbiAgICAgICAgcmV0dXJuIGV2ZW50Q3JlYXRvcjtcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVFdmVudERlZmluaXRpb24gPSBjcmVhdGVFdmVudERlZmluaXRpb247XG5mdW5jdGlvbiBkZWZpbmVFdmVudCh0eXBlKSB7XG4gICAgc2hvd1dhcm5pbmcoXCJkZWZpbmVFdmVudCBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIGZ1dHVyZS4gUGxlYXNlIHVzZSBjcmVhdGVFdmVudERlZmluaXRpb24gaW5zdGVhZC5cIik7XG4gICAgdmFyIGV2ZW50Q3JlYXRvciA9IGZ1bmN0aW9uIChwYXlsb2FkKSB7IHJldHVybiAoe1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBwYXlsb2FkOiBwYXlsb2FkXG4gICAgfSk7IH07XG4gICAgZXZlbnRDcmVhdG9yLmV2ZW50VHlwZSA9IHR5cGU7XG4gICAgcmV0dXJuIGV2ZW50Q3JlYXRvcjtcbn1cbmV4cG9ydHMuZGVmaW5lRXZlbnQgPSBkZWZpbmVFdmVudDtcbmZ1bmN0aW9uIGdldEV2ZW50VHlwZShkZXNjcmlwdG9yKSB7XG4gICAgaWYgKGlzRXZlbnREZXNjcmlwdG9yKGRlc2NyaXB0b3IpKVxuICAgICAgICByZXR1cm4gZGVzY3JpcHRvci5ldmVudFR5cGU7XG4gICAgcmV0dXJuIGRlc2NyaXB0b3I7XG59XG5mdW5jdGlvbiBmaWx0ZXIocHJlZGljYXRlLCBoYW5kbGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAocHJlZGljYXRlKGV2ZW50KSlcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKGV2ZW50KTtcbiAgICB9O1xufVxudmFyIEV2ZW50QnVzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50QnVzKCkge1xuICAgICAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgZXZlbnRlbWl0dGVyMl8xLkV2ZW50RW1pdHRlcjIoeyB3aWxkY2FyZDogdHJ1ZSB9KTtcbiAgICB9XG4gICAgRXZlbnRCdXMucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbiAoZXZlbnQsIG1ldGEpIHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoZXZlbnQudHlwZSwgIW1ldGEgPyBldmVudCA6IF9fYXNzaWduKHt9LCBldmVudCwgeyBtZXRhOiBfX2Fzc2lnbih7fSwgZXZlbnQubWV0YSwgbWV0YSkgfSkpO1xuICAgIH07XG4gICAgRXZlbnRCdXMucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChzdWJzY3JpcHRpb24sIGhhbmRsZXIpIHtcbiAgICAgICAgLy8gc3RvcmUgZW1pdHRlciBvbiBjbG9zdXJlXG4gICAgICAgIHZhciBlbWl0dGVyID0gdGhpcy5lbWl0dGVyO1xuICAgICAgICB2YXIgc3Vic2NyaWJlVG9TdWJkZWYgPSBmdW5jdGlvbiAoc3ViZGVmKSB7XG4gICAgICAgICAgICBpZiAoaXNQcmVkaWNhdGVGbihzdWJkZWYpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkSGFuZGxlcl8xID0gZmlsdGVyKHN1YmRlZiwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5vbihcIioqXCIsIGZpbHRlcmVkSGFuZGxlcl8xKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gZW1pdHRlci5vZmYoXCIqKlwiLCBmaWx0ZXJlZEhhbmRsZXJfMSk7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdHlwZSA9IGdldEV2ZW50VHlwZShzdWJkZWYpO1xuICAgICAgICAgICAgZW1pdHRlci5vbih0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiBlbWl0dGVyLm9mZih0eXBlLCBoYW5kbGVyKTsgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN1YnMgPSBBcnJheS5pc0FycmF5KHN1YnNjcmlwdGlvbikgPyBzdWJzY3JpcHRpb24gOiBbc3Vic2NyaXB0aW9uXTtcbiAgICAgICAgdmFyIHVuc3Vic2NyaWJlcnMgPSBzdWJzLm1hcChzdWJzY3JpYmVUb1N1YmRlZik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiB1bnN1YnNjcmliZXJzLmZvckVhY2goZnVuY3Rpb24gKHUpIHsgcmV0dXJuIHUoKTsgfSk7IH07XG4gICAgfTtcbiAgICByZXR1cm4gRXZlbnRCdXM7XG59KCkpO1xuZXhwb3J0cy5FdmVudEJ1cyA9IEV2ZW50QnVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXZlbnRCdXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgRXZlbnRCdXNfMSA9IHJlcXVpcmUoXCIuL0V2ZW50QnVzXCIpO1xuZXhwb3J0cy5FdmVudEJ1cyA9IEV2ZW50QnVzXzEuRXZlbnRCdXM7XG5leHBvcnRzLmRlZmluZUV2ZW50ID0gRXZlbnRCdXNfMS5kZWZpbmVFdmVudDtcbmV4cG9ydHMuY3JlYXRlRXZlbnREZWZpbml0aW9uID0gRXZlbnRCdXNfMS5jcmVhdGVFdmVudERlZmluaXRpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXNzZXRMb2FkZXIgPSB2b2lkIDA7XG5jbGFzcyBBc3NldExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuSU1BR0VfRk9MREVSID0gXCJpbWFnZXMvXCI7XG4gICAgICAgIHRoaXMuSU1BR0VfTkFNRVMgPSBbXG4gICAgICAgICAgICBcImJhbGxzLnBuZ1wiLFxuICAgICAgICAgICAgXCJmaWVsZC5wbmdcIixcbiAgICAgICAgICAgIFwidHJhY2suanBnXCIsXG4gICAgICAgICAgICBcIlJlZFBhcnRpY2xlLnBuZ1wiLFxuICAgICAgICAgICAgXCJkaWdpdHMucG5nXCIsXG4gICAgICAgICAgICBcImdvYWxfZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInN0YXIucG5nXCIsXG4gICAgICAgICAgICBcInBsYXkucG5nXCIsXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLklNQUdFX05BTUVTLm1hcChmaWxlTmFtZSA9PiB0aGlzLmxvYWRJbWFnZShmaWxlTmFtZSwgYCR7dGhpcy5JTUFHRV9GT0xERVJ9JHtmaWxlTmFtZX1gKSkpO1xuICAgIH1cbiAgICBnZXRJbWFnZShpbWFnZU5hbWUpIHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSB0aGlzLmltYWdlcy5nZXQoaW1hZ2VOYW1lKTtcbiAgICAgICAgaWYgKGltYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpbWFnZU5hbWV9IGltYWdlIG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9XG4gICAgbG9hZEltYWdlKG5hbWUsIHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChuYW1lLCBpbWcpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gQXNzZXRMb2FkZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUxvb3AgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTWFpblN5c3RlbV8xID0gcmVxdWlyZShcIi4uL2dhbWUvc3lzdGVtcy9NYWluU3lzdGVtXCIpO1xuY29uc3QgR2FtZVdvcmxkXzEgPSByZXF1aXJlKFwiLi4vZ2FtZS93b3JsZC9HYW1lV29ybGRcIik7XG5jb25zdCBNb3VzZUlucHV0TWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL2lucHV0L01vdXNlSW5wdXRNYW5hZ2VyXCIpO1xuY29uc3QgTWFpblJlbmRlcl8xID0gcmVxdWlyZShcIi4uL3JlbmRlcmluZy9NYWluUmVuZGVyXCIpO1xuY29uc3QgVUlJbnRlcmFjdGlvblN5c3RlbV8xID0gcmVxdWlyZShcIi4uL3VpL1VJSW50ZXJhY3Rpb25TeXN0ZW1cIik7XG5jbGFzcyBHYW1lTG9vcCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucHJldlRpbWUgPSAwO1xuICAgICAgICB0aGlzLm1haW5SZW5kZXIgPSBuZXcgTWFpblJlbmRlcl8xLk1haW5SZW5kZXIoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQgPSBuZXcgR2FtZVdvcmxkXzEuR2FtZVdvcmxkKGdhbWVDb25maWdzLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbSA9IG5ldyBVSUludGVyYWN0aW9uU3lzdGVtXzEuVUlJbnRlcmFjdGlvblN5c3RlbShuZXcgTW91c2VJbnB1dE1hbmFnZXJfMS5Nb3VzZUlucHV0TWFuYWdlcihkb21IYW5kbGVyLm1lbnVDYW52YXMpKTtcbiAgICAgICAgdGhpcy5tYWluU3lzdGVtID0gbmV3IE1haW5TeXN0ZW1fMS5NYWluU3lzdGVtKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgbWFpbigpIHtcbiAgICAgICAgY29uc3QgdGljayA9ICh0aW1lKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2VGltZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdGltZSAtIHRoaXMucHJldlRpbWU7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJbnB1dHMoZGVsdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKGRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgIHRoaXMubWFpblN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQsIGRlbHRhKTtcbiAgICAgICAgdGhpcy5nYW1lV29ybGQuZmlyZXdvcmtzLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmV4cGxvc2lvbi51cGRhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5zY29yZS51cGRhdGUoZGVsdGEpO1xuICAgIH1cbiAgICB1cGRhdGVJbnB1dHMoZGVsdGEpIHtcbiAgICAgICAgdGhpcy51aUludGVyYWN0aW9uU3lzdGVtLnVwZGF0ZSh0aGlzLmdhbWVXb3JsZC5tZW51QnV0dG9uLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5nYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZVdvcmxkLmZpcmV3b3Jrcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbS5pbnB1dC5yZXNldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBkZWx0YSk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyLnJlbmRlcih0aGlzLmdhbWVXb3JsZCk7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lTG9vcCA9IEdhbWVMb29wO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGwgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgUG9zaXRpb25IaXN0b3J5XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9zaXRpb25IaXN0b3J5XCIpO1xuY29uc3QgQmFsbFBvd2VyU2hvdF8xID0gcmVxdWlyZShcIi4vcG93ZXJTaG90cy9CYWxsUG93ZXJTaG90XCIpO1xuY2xhc3MgQmFsbCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5nbGVXaXRoUGxheWVyID0gMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBvc2l0aW9uSGlzdG9yeSA9IG5ldyBQb3NpdGlvbkhpc3RvcnlfMS5Qb3NpdGlvbkhpc3RvcnkoNTAwMCk7XG4gICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdCA9IG5ldyBCYWxsUG93ZXJTaG90XzEuQmFsbFBvd2VyU2hvdCgpO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplID0gZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRoQm9yZGVyO1xuICAgICAgICB0aGlzLm1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA0MDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gPSB0aGlzLm1heFNwZWVkIC8gMjAwMDtcbiAgICB9XG4gICAgc2V0Rm9yU3RhcnRHYW1lKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNTZXRGb3JTdGFydCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSArIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplKTtcbiAgICAgICAgICAgIGNvbnN0IHNwZWVkID0gTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heFNwZWVkIC0gdGhpcy5tYXhTcGVlZCAvIDMuMzMpICsgdGhpcy5tYXhTcGVlZCAvIDMuMzM7XG4gICAgICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGguUEkgLyAyICsgKChNYXRoLnJhbmRvbSgpICogTWF0aC5QSSkgLyA0LjUgLSBNYXRoLlBJIC8gOSk7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRUb1N0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5pc1NldEZvclN0YXJ0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZCgwLCAwKTtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IG51bGw7XG4gICAgfVxuICAgIG1vdmUoZGVsdGFNcykge1xuICAgICAgICBpZiAodGhpcy5iYWxsUG93ZXJTaG90LmlzUG93ZXJTaG90KSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uSGlzdG9yeS5hZGRQb3NpdGlvbihuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCwgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udXBkYXRlUG9zaXRpb24oZGVsdGFNcyk7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5kZWNyZW1lbnRTcGVlZChkZWx0YU1zKTtcbiAgICAgICAgaWYgKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpIDwgdGhpcy5tYXhTcGVlZCAvIDIpIHtcbiAgICAgICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdC5yZXNldFBvd2VyU2hvdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZVRyYWplY3RvcnkoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uSGlzdG9yeS51cGRhdGUoZGVsdGFNcyk7XG4gICAgfVxuICAgIGF0dGFjaFRvUGxheWVyKHBsYXllcikge1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gcGxheWVyO1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRDtcbiAgICAgICAgdGhpcy5hbmdsZVdpdGhQbGF5ZXIgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LnJlc2V0UG93ZXJTaG90KCk7XG4gICAgfVxuICAgIGtpY2soKSB7XG4gICAgICAgIGxldCBzcGVlZEZhY3RvciA9IDE7XG4gICAgICAgIGlmICh0aGlzLmF0dGFjaGVkUGxheWVyPy5wb3dlclNob3RXcmFwcGVyLmdldFBvd2VyU2hvdCgpKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QuZW5hYmxlUG93ZXJTaG90KHRoaXMuYXR0YWNoZWRQbGF5ZXIpO1xuICAgICAgICAgICAgc3BlZWRGYWN0b3IgPSBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLmdldFNwZWVkRmFjdG9yKHRoaXMuYmFsbFBvd2VyU2hvdC5nZXRQb3dlclNob3RUeXBlKCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXI/LnBvd2VyU2hvdFdyYXBwZXIucmVzZXRQb3dlclNob3QoKTtcbiAgICAgICAgdGhpcy5yZWxlYXNlRnJvbVBsYXllcigpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQodGhpcy5tYXhTcGVlZCAqIHNwZWVkRmFjdG9yLCB0aGlzLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgfVxuICAgIHJlbGVhc2VGcm9tUGxheWVyKCkge1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRTtcbiAgICB9XG4gICAgcmVzZXRPbkdvYWwoKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QucmVzZXRQb3dlclNob3QoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGwgPSBCYWxsO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkV4cGxvc2lvbkNvbXBvbmVudCA9IGV4cG9ydHMuRXhwbG9zaW9uID0gdm9pZCAwO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRXhwbG9zaW9uIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLm1heENvbXBvbmVudHMgPSA0MDtcbiAgICAgICAgdGhpcy5taW5Db21wb25lbnRzID0gMjA7XG4gICAgICAgIHRoaXMubWF4VGltZSA9IDEwMDA7XG4gICAgICAgIHRoaXMuY29sb3JPZmZzZXQgPSA4MDtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5tYXhTaXplID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyAyNjtcbiAgICAgICAgdGhpcy5tYXhEaXN0YW5jZSA9IHRoaXMubWF4U2l6ZSAqIDM7XG4gICAgfVxuICAgIGFkZEV4cGxvc2lvbihwb3NpdGlvbiwgcG93ZXJTaG90VHlwZSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQocG9zaXRpb24ueCwgcG9zaXRpb24ueSk7XG4gICAgICAgIGNvbnN0IG51bWJlck9mQ29tcG9uZW50cyA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heENvbXBvbmVudHMgLSB0aGlzLm1pbkNvbXBvbmVudHMpICsgdGhpcy5taW5Db21wb25lbnRzKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZDb21wb25lbnRzOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gTWF0aC5yYW5kb20oKSAqIHRoaXMubWF4VGltZTtcbiAgICAgICAgICAgIGNvbnN0IGFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgY29uc3QgZyA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgbGV0IHIsIGI7XG4gICAgICAgICAgICBpZiAocG93ZXJTaG90VHlwZSA9PT0gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFR5cGUuRklSRSkge1xuICAgICAgICAgICAgICAgIHIgPSAyNTUgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBiID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICAgICAgYiA9IDI1NSAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBcIiNcIiArXG4gICAgICAgICAgICAgICAgci50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpICtcbiAgICAgICAgICAgICAgICBnLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgIGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKG5ldyBFeHBsb3Npb25Db21wb25lbnQoZHVyYXRpb24sIGFuZ2xlLCBjb2xvcikpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgY29tcG9uZW50LnVwZGF0ZShkZWx0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSB0aGlzLmNvbXBvbmVudHMuZmlsdGVyKGNvbXBvbmVudCA9PiAhY29tcG9uZW50LmlzRmluaXNoZWQoKSk7XG4gICAgfVxufVxuZXhwb3J0cy5FeHBsb3Npb24gPSBFeHBsb3Npb247XG5jbGFzcyBFeHBsb3Npb25Db21wb25lbnQge1xuICAgIGNvbnN0cnVjdG9yKGR1cmF0aW9uLCBhbmdsZSwgY29sb3IpIHtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5kZWx0YSA9IDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmRlbHRhICs9IGRlbHRhO1xuICAgIH1cbiAgICBpc0ZpbmlzaGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWx0YSA+PSB0aGlzLmR1cmF0aW9uO1xuICAgIH1cbiAgICBnZXRGYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbHRhIC8gdGhpcy5kdXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLkV4cGxvc2lvbkNvbXBvbmVudCA9IEV4cGxvc2lvbkNvbXBvbmVudDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GaXJld29ya0NvbXBvbmVudER0byA9IGV4cG9ydHMuRmlyZXdvcmtEdG8gPSBleHBvcnRzLkZpcmV3b3JrcyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBGaXJld29ya3Mge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuY29sb3JPZmZzZXQgPSAxMDA7XG4gICAgICAgIHRoaXMubWF4Q29tcG9uZW50cyA9IDIwO1xuICAgICAgICB0aGlzLm1pbkNvbXBvbmVudHMgPSAyMDtcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IDEwMDtcbiAgICAgICAgdGhpcy5udW1iZXJPZkZpcmV3b3JrcyA9IE1hdGgucm91bmQoRmlyZXdvcmtzLmFuaW1hdGlvblRpbWUgLyB0aGlzLmludGVydmFsKTtcbiAgICAgICAgdGhpcy5maXJld29ya3MgPSBbXTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1heERpc3RhbmNlID0gZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKiA3O1xuICAgICAgICB0aGlzLm1pbkRpc3RhbmNlID0gdGhpcy5tYXhEaXN0YW5jZSAvIDU7XG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gTWF0aC5jZWlsKGdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyIC8gMTIpO1xuICAgIH1cbiAgICBpbml0RmlyZXdvcmtzKCkge1xuICAgICAgICB0aGlzLmZpcmV3b3JrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubnVtYmVyT2ZGaXJld29ya3M7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcmVkID0gdGhpcy5nZXRSYW5kb21Db2xvclZhbHVlKCk7XG4gICAgICAgICAgICBjb25zdCBncmVlbiA9IHRoaXMuZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpO1xuICAgICAgICAgICAgY29uc3QgYmx1ZSA9IHRoaXMuZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50c19udW1iZXIgPSBNYXRoLnJhbmRvbSgpICogKHRoaXMubWF4Q29tcG9uZW50cyAtIHRoaXMubWluQ29tcG9uZW50cykgKyB0aGlzLm1pbkNvbXBvbmVudHM7XG4gICAgICAgICAgICBsZXQgY29tcG9uZW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb21wb25lbnRzX251bWJlcjsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuZ2V0Q29sb3JWYWx1ZVdpdGhPZmZzZXQocmVkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gdGhpcy5nZXRDb2xvclZhbHVlV2l0aE9mZnNldChncmVlbik7XG4gICAgICAgICAgICAgICAgY29uc3QgYiA9IHRoaXMuZ2V0Q29sb3JWYWx1ZVdpdGhPZmZzZXQoYmx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3IgPSBcIiNcIiArXG4gICAgICAgICAgICAgICAgICAgIHIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSArXG4gICAgICAgICAgICAgICAgICAgIGcudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSArXG4gICAgICAgICAgICAgICAgICAgIGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzLnB1c2gobmV3IEZpcmV3b3JrQ29tcG9uZW50RHRvKGNvbG9yLCBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAqIDIsIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heERpc3RhbmNlIC0gdGhpcy5taW5EaXN0YW5jZSkgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbkRpc3RhbmNlKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5maXJld29ya3MucHVzaChuZXcgRmlyZXdvcmtEdG8obmV3IFBvaW50XzEuUG9pbnQodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBNYXRoLnJhbmRvbSgpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0ICogTWF0aC5yYW5kb20oKSksIC1pICogdGhpcy5pbnRlcnZhbCwgY29tcG9uZW50cykpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmZpcmV3b3Jrcy5mb3JFYWNoKGZpcmV3b3JrID0+IHtcbiAgICAgICAgICAgIGZpcmV3b3JrLnN0YXJ0VGltZSArPSBkZWx0YTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmZpcmV3b3JrcyA9IFtdO1xuICAgIH1cbiAgICBnZXRSYW5kb21Db2xvclZhbHVlKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMjU1KTtcbiAgICB9XG4gICAgZ2V0Q29sb3JWYWx1ZVdpdGhPZmZzZXQoY29sb1ZhbHVlKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChjb2xvVmFsdWUgK1xuICAgICAgICAgICAgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKHRoaXMuY29sb3JPZmZzZXQgLyAyKSAtIHRoaXMuY29sb3JPZmZzZXQgLyAyKSwgMCksIDI1NSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya3MgPSBGaXJld29ya3M7XG5GaXJld29ya3MuYW5pbWF0aW9uVGltZSA9IDUwMDA7XG5jbGFzcyBGaXJld29ya0R0byB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIHN0YXJ0VGltZSwgY29tcG9uZW50cyA9IFtdKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBzdGFydFRpbWU7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IGNvbXBvbmVudHM7XG4gICAgICAgIHRoaXMuc2luZ2xlRHVyYXRpb24gPSA3MDA7XG4gICAgICAgIHRoaXMubWF4TGVuZ3RoRmFjdG9yID0gMC4zO1xuICAgIH1cbiAgICBpc0ZpcmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRUaW1lID49IDAgJiYgdGhpcy5zdGFydFRpbWUgPD0gdGhpcy5zaW5nbGVEdXJhdGlvbjtcbiAgICB9XG4gICAgZ2V0TGVuZ2h0KCkge1xuICAgICAgICBjb25zdCBmYWN0b3IgPSB0aGlzLnN0YXJ0VGltZSA+PSB0aGlzLnNpbmdsZUR1cmF0aW9uIC8gMlxuICAgICAgICAgICAgPyAodGhpcy5zaW5nbGVEdXJhdGlvbiAtIHRoaXMuc3RhcnRUaW1lKSAvICh0aGlzLnNpbmdsZUR1cmF0aW9uIC8gMilcbiAgICAgICAgICAgIDogdGhpcy5zdGFydFRpbWUgLyAodGhpcy5zaW5nbGVEdXJhdGlvbiAvIDIpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXhMZW5ndGhGYWN0b3IgKiBmYWN0b3I7XG4gICAgfVxuICAgIGdldFRpbWVGYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0VGltZSAvIHRoaXMuc2luZ2xlRHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya0R0byA9IEZpcmV3b3JrRHRvO1xuY2xhc3MgRmlyZXdvcmtDb21wb25lbnREdG8ge1xuICAgIGNvbnN0cnVjdG9yKGNvbG9yLCBhbmdsZSwgZGlzdGFuY2UpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gICAgICAgIHRoaXMuZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICB9XG59XG5leHBvcnRzLkZpcmV3b3JrQ29tcG9uZW50RHRvID0gRmlyZXdvcmtDb21wb25lbnREdG87XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2F0ZSA9IHZvaWQgMDtcbmNsYXNzIEdhdGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gMDtcbiAgICAgICAgdGhpcy5tYXhBbmdsZSA9IE1hdGguUEkgLyAyO1xuICAgICAgICB0aGlzLm9wZW5UaW1lID0gMzAwO1xuICAgICAgICB0aGlzLnN0ZXAgPSB0aGlzLm1heEFuZ2xlIC8gdGhpcy5vcGVuVGltZTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhLCBpc09wZW4pIHtcbiAgICAgICAgaWYgKGlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5hbmdsZSArPSB0aGlzLnN0ZXAgKiBkZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgLT0gdGhpcy5zdGVwICogZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hbmdsZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHRoaXMubWF4QW5nbGUsIHRoaXMuYW5nbGUpKTtcbiAgICB9XG4gICAgZ2V0IGN1cnJlbnRBbmdsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYW5nbGU7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlID0gR2F0ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Hb2FsUG9zdHMgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgR29hbFBvc3RzIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyBnYW1lQ29uZmlncy5nb2FsSGVpZ2h0KSk7XG4gICAgICAgIHRoaXMucmFkaXVzID0gZ2FtZUNvbmZpZ3MuZ29hbFBvc3RSYWRpdXM7XG4gICAgfVxufVxuZXhwb3J0cy5Hb2FsUG9zdHMgPSBHb2FsUG9zdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gdm9pZCAwO1xuY2xhc3MgSG92ZXJhYmxlRW50aXR5IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ob3ZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaG92ZXJQcm9ncmVzcyA9IDA7XG4gICAgfVxufVxuZXhwb3J0cy5Ib3ZlcmFibGVFbnRpdHkgPSBIb3ZlcmFibGVFbnRpdHk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudUJ1dHRvbiA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEhvdmVyYWJsZUVudGl0eV8xID0gcmVxdWlyZShcIi4vSG92ZXJhYmxlRW50aXR5XCIpO1xuY2xhc3MgTWVudUJ1dHRvbiBleHRlbmRzIEhvdmVyYWJsZUVudGl0eV8xLkhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIHJlZldpZHRoLCByZWZIZWlnaHQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1O1xuICAgICAgICB0aGlzLmRpbWVuc2lvbiA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyhoZWlnaHQgKiAocmVmV2lkdGggLyByZWZIZWlnaHQpLCBoZWlnaHQpO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgKGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSB0aGlzLmRpbWVuc2lvbi53aWR0aCkgLyAyLCAoZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLSB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpIC8gMik7XG4gICAgfVxuICAgIGNvbnRhaW5zKHBvaW50KSB7XG4gICAgICAgIHJldHVybiAocG9pbnQueCA+PSB0aGlzLnBvc2l0aW9uLnggJiZcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy5wb3NpdGlvbi54ICsgdGhpcy5kaW1lbnNpb24ud2lkdGggJiZcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy5wb3NpdGlvbi55ICYmXG4gICAgICAgICAgICBwb2ludC55IDw9IHRoaXMucG9zaXRpb24ueSArIHRoaXMuZGltZW5zaW9uLmhlaWdodCk7XG4gICAgfVxuICAgIGdldFRyYW5zaXRpb25UaW1lKCkge1xuICAgICAgICByZXR1cm4gMTAwO1xuICAgIH1cbn1cbmV4cG9ydHMuTWVudUJ1dHRvbiA9IE1lbnVCdXR0b247XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBCb3VuY2VXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9ib3VuY2UvQm91bmNlV3JhcHBlclwiKTtcbmNvbnN0IFBvd2VyU2hvdFdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL3Bvd2VyU2hvdHMvUG93ZXJTaG90V3JhcHBlclwiKTtcbmNvbnN0IFN0dW5uZWRXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9zdHVubmVkL1N0dW5uZWRXcmFwcGVyXCIpO1xuY2xhc3MgUGxheWVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgaXNDcHUsIGlzU3Vic3RpdHV0ZSwgc2lkZSwgY29sb3JJbmRleCkge1xuICAgICAgICB0aGlzLmJvdW5jZVdyYXBwZXIgPSBuZXcgQm91bmNlV3JhcHBlcl8xLkJvdW5jZVdyYXBwZXIoKTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXhTcGVlZCA9IDA7XG4gICAgICAgIHRoaXMucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTDtcbiAgICAgICAgdGhpcy5zdHVubmVkV3JhcHBlciA9IG5ldyBTdHVubmVkV3JhcHBlcl8xLlN0dW5uZWRXcmFwcGVyKHRoaXMpO1xuICAgICAgICB0aGlzLm5vcm1hbE1heFNwZWVkID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA3MDA7XG4gICAgICAgIGlmIChpc0NwdSkge1xuICAgICAgICAgICAgdGhpcy5ub3JtYWxNYXhTcGVlZCA9IHRoaXMubm9ybWFsTWF4U3BlZWQgKiAwLjg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5ub3JtYWxNYXhTcGVlZCAvIDMwMDtcbiAgICAgICAgdGhpcy5jbG9zZVRvUG9pbnREaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAxMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNpemUgPSBnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5pc0NwdSA9IGlzQ3B1O1xuICAgICAgICB0aGlzLmlzU3Vic3RpdHV0ZSA9IGlzU3Vic3RpdHV0ZTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gY29sb3JJbmRleDtcbiAgICAgICAgdGhpcy5pbml0UG9zaXRpb25zKGdhbWVDb25maWdzKTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RXcmFwcGVyID0gbmV3IFBvd2VyU2hvdFdyYXBwZXJfMS5Qb3dlclNob3RXcmFwcGVyKGdhbWVDb25maWdzLCBzaWRlKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUh1bWFuUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCB0cnVlLCBmYWxzZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQsIDApO1xuICAgIH1cbiAgICBzdGF0aWMgY3JlYXRlTGVmdFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAxKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZVJpZ2h0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIHRydWUsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAxKTtcbiAgICB9XG4gICAgcmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZSh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RlZFBvc2l0aW9uID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucHJvamVjdFRvRmluYWxQb3NpdGlvbigpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGFyZ2V0UG9zaXRpb24pO1xuICAgICAgICBpZiAoUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShwcm9qZWN0ZWRQb3NpdGlvbiwgdGFyZ2V0UG9zaXRpb24pIDwgdGhpcy5yZWFjaGVkRGlzdGFuY2VUb2xlcmFuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdTcGVlZCA9IE1hdGgubWF4KGN1cnJlbnRTcGVlZCAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgICAgICBjb25zdCByYXRpbyA9IG5ld1NwZWVkIC8gY3VycmVudFNwZWVkO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS54ICo9IHJhdGlvO1xuICAgICAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55ICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWCA9IE1hdGguY29zKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgY29uc3QgZGVzaXJlZFNwZWVkWSA9IE1hdGguc2luKGFuZ2xlKSAqIHRoaXMuY3VycmVudE1heFNwZWVkO1xuICAgICAgICAgICAgbGV0IHN0ZWVyWCA9IGRlc2lyZWRTcGVlZFggLSB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueDtcbiAgICAgICAgICAgIGxldCBzdGVlclkgPSBkZXNpcmVkU3BlZWRZIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lnk7XG4gICAgICAgICAgICBjb25zdCBzdGVlck1hZ25pdHVkZSA9IE1hdGguc3FydChzdGVlclggKiBzdGVlclggKyBzdGVlclkgKiBzdGVlclkpO1xuICAgICAgICAgICAgY29uc3QgbWF4U3RlZXIgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgICAgIGlmIChzdGVlck1hZ25pdHVkZSA+IG1heFN0ZWVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBtYXhTdGVlciAvIHN0ZWVyTWFnbml0dWRlO1xuICAgICAgICAgICAgICAgIHN0ZWVyWCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICBzdGVlclkgKj0gcmF0aW87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCArPSBzdGVlclg7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSArPSBzdGVlclk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5ID0gbmV3IFBvaW50XzEuUG9pbnQoMCwgMCk7XG4gICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24ueCwgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5hZGp1c3RUb01heFNwZWVkKHRoaXMuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgcmVzZXRUb1N0YXJ0R2FtZSgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICB9XG4gICAgc3dpdGNoQ29sb3JJbmRleCgpIHtcbiAgICAgICAgdGhpcy5jb2xvckluZGV4ID0gdGhpcy5jb2xvckluZGV4ID09PSAwID8gMSA6IDA7XG4gICAgfVxuICAgIHVwZGF0ZVBvd2VyU2hvdChkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG93ZXJTaG90V3JhcHBlci51cGRhdGUoZGVsdGFNcywgdGhpcyk7XG4gICAgfVxuICAgIHJlc2V0T25Hb2FsKCkge1xuICAgICAgICB0aGlzLmJvdW5jZVdyYXBwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5zdHVubmVkV3JhcHBlci5yZXNldCgpO1xuICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgIHRoaXMucmVzZXRUb1N0YXJ0R2FtZSgpO1xuICAgIH1cbiAgICBzdGFydEJvdW5jaW5nKCkge1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpIHtcbiAgICAgICAgICAgIHRoaXMuYm91bmNlV3JhcHBlci5zdGFydEJvdW5jaW5nKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncykge1xuICAgICAgICBsZXQgb2Zmc2V0WCA9IDA7XG4gICAgICAgIGlmICh0aGlzLmlzU3Vic3RpdHV0ZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0aWFsUG9zaXRpb24ueSA9IGdhbWVDb25maWdzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFhcbiAgICAgICAgICAgICAgICAgICAgOiBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldDtcbiAgICAgICAgICAgIG9mZnNldFggPVxuICAgICAgICAgICAgICAgIHRoaXMuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVFxuICAgICAgICAgICAgICAgICAgICA/IGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0XG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnggPSBnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBvZmZzZXRYO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmluaXRpYWxQb3NpdGlvbi54LCB0aGlzLmluaXRpYWxQb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXIgPSBQbGF5ZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQm91bmNlV3JhcHBlciA9IHZvaWQgMDtcbmNsYXNzIEJvdW5jZVdyYXBwZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmJvdW5jaW5nRHVyYXRpb24gPSAyMDAwO1xuICAgICAgICB0aGlzLmJvdW5jZU1heEFtcGxpdHVkZSA9IDAuNTtcbiAgICAgICAgdGhpcy5ib3VuY2VFeHBvbmVudGlhbEZhY3RvciA9IDAuMDAzNDY7XG4gICAgICAgIHRoaXMuYm91bmNlTnVtYmVyID0gNTtcbiAgICAgICAgdGhpcy5ib3VuY2luZ1RpbWUgPSB0aGlzLmJvdW5jaW5nRHVyYXRpb247XG4gICAgfVxuICAgIHN0YXJ0Qm91bmNpbmcoKSB7XG4gICAgICAgIGlmICh0aGlzLmJvdW5jaW5nVGltZSA+IHRoaXMuYm91bmNpbmdEdXJhdGlvbiAvIDIpIHtcbiAgICAgICAgICAgIHRoaXMuYm91bmNpbmdUaW1lID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLmJvdW5jaW5nVGltZSArPSBkZWx0YU1zO1xuICAgIH1cbiAgICBnZXRCb3VuY2luZ0FtcGxpdHVkZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQm91bmNpbmcoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0aGlzLmJvdW5jZU1heEFtcGxpdHVkZSAqXG4gICAgICAgICAgICBNYXRoLnBvdyhNYXRoLkUsIC10aGlzLmJvdW5jaW5nVGltZSAqIHRoaXMuYm91bmNlRXhwb25lbnRpYWxGYWN0b3IpICpcbiAgICAgICAgICAgIE1hdGguc2luKHRoaXMuYm91bmNpbmdUaW1lIC8gKDIgKiBNYXRoLlBJICogdGhpcy5ib3VuY2VOdW1iZXIpKSk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmJvdW5jaW5nVGltZSA9IHRoaXMuYm91bmNpbmdEdXJhdGlvbjtcbiAgICB9XG4gICAgaXNCb3VuY2luZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYm91bmNpbmdUaW1lIDwgdGhpcy5ib3VuY2luZ0R1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuQm91bmNlV3JhcHBlciA9IEJvdW5jZVdyYXBwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFBvd2VyU2hvdCA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jbGFzcyBCYWxsUG93ZXJTaG90IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RUeXBlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlID0gbnVsbDtcbiAgICB9XG4gICAgZ2V0IGlzUG93ZXJTaG90KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3Q7XG4gICAgfVxuICAgIGdldFBvd2VyU2hvdFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdFR5cGU7XG4gICAgfVxuICAgIGVuYWJsZVBvd2VyU2hvdChwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSB0cnVlO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFR5cGUgPSBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLmdldFBvd2VyU2hvdFR5cGUocGxheWVyLmNvbG9ySW5kZXgpO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZVV0aWxpdGllcy5nZXRPcHBvc2l0ZVNpZGUocGxheWVyLnNpZGUpO1xuICAgIH1cbiAgICByZXNldFBvd2VyU2hvdCgpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RUeXBlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlID0gbnVsbDtcbiAgICB9XG4gICAgc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKCkge1xuICAgICAgICBpZiAoIXRoaXMucG93ZXJTaG90IHx8IHRoaXMucG93ZXJTaG90VHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKHRoaXMucG93ZXJTaG90VHlwZSk7XG4gICAgfVxuICAgIHNob3VsZE1vdmVUb0dvYWwoKSB7XG4gICAgICAgIGlmICghdGhpcy5wb3dlclNob3QgfHwgdGhpcy5wb3dlclNob3RUeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuc2hvdWxkTW92ZVRvR29hbCh0aGlzLnBvd2VyU2hvdFR5cGUpO1xuICAgIH1cbiAgICBnZXRQb3dlclNob3REZXN0aW5hdGlvblNpZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGU7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUG93ZXJTaG90ID0gQmFsbFBvd2VyU2hvdDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FbGVjdHJpY1Bvd2VyU2hvdCA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBFbGVjdHJpY1Bvd2VyU2hvdCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IDUwO1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRTaXplID0gMTA7XG4gICAgICAgIHRoaXMubGFzdENoYW5nZURlbHRhVGltZSA9IHRoaXMuaW50ZXJ2YWw7XG4gICAgICAgIHRoaXMuYW5nbGVPZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5ID0gW107XG4gICAgICAgIHRoaXMud2hpdGVMaW5lVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLndpZHRoID0gTWF0aC5yb3VuZChNYXRoLmZsb29yKGdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogMi41KSk7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gNSk7XG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gTWF0aC5jZWlsKHRoaXMuaGVpZ2h0IC8gNCk7XG4gICAgICAgIHRoaXMuYmlnTGluZVdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLmxpbmVXaWR0aCAqIDMpO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgKz0gZGVsdGFNcztcbiAgICAgICAgdGhpcy53aGl0ZUxpbmVWaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMubGFzdENoYW5nZURlbHRhVGltZSA+PSB0aGlzLmludGVydmFsKSB7XG4gICAgICAgICAgICB0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgPSAwO1xuICAgICAgICAgICAgdGhpcy5yZWdlbmVyYXRlTGlnaHRuaW5nQm9sdFBvaW50cygpO1xuICAgICAgICAgICAgdGhpcy5hbmdsZU9mZnNldCArPSAoTWF0aC5QSSAvIDQ1KSAqIHRoaXMuaW50ZXJ2YWwgKiAwLjA1O1xuICAgICAgICAgICAgdGhpcy53aGl0ZUxpbmVWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdWxkUmVuZGVyKHBsYXllcikge1xuICAgICAgICByZXR1cm4gKHBsYXllci5jb2xvckluZGV4ID09PSAxICYmXG4gICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCk7XG4gICAgfVxuICAgIHJlZ2VuZXJhdGVMaWdodG5pbmdCb2x0UG9pbnRzKCkge1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5ID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saWdodG5pbmdCb2x0U2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5LnB1c2gobmV3IFBvaW50XzEuUG9pbnQoKHRoaXMud2lkdGggLyB0aGlzLmxpZ2h0bmluZ0JvbHRTaXplKSAqIGkgLSB0aGlzLndpZHRoIC8gMiwgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5oZWlnaHQpIC0gdGhpcy5oZWlnaHQgLyAyKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkVsZWN0cmljUG93ZXJTaG90ID0gRWxlY3RyaWNQb3dlclNob3Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmxhbWVEdG8gPSBleHBvcnRzLkZpcmVQb3dlclNob3QgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRmlyZVBvd2VyU2hvdCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhJbmRleCA9IDE2O1xuICAgICAgICB0aGlzLmludGVydmFsID0gMTtcbiAgICAgICAgdGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgPSB0aGlzLmludGVydmFsO1xuICAgICAgICB0aGlzLmZsYW1lcyA9IFtdO1xuICAgICAgICB0aGlzLm1heFNpemUgPSBNYXRoLnJvdW5kKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMik7XG4gICAgICAgIHRoaXMubWluU2l6ZSA9IHRoaXMubWF4U2l6ZSAvIDU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zLCBwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5mbGFtZXMuZm9yRWFjaChmbGFtZSA9PiB7XG4gICAgICAgICAgICBmbGFtZS51cGRhdGUoZGVsdGFNcyk7XG4gICAgICAgICAgICBpZiAoZmxhbWUuaXNGaW5pc2hlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mbGFtZXMuc3BsaWNlKHRoaXMuZmxhbWVzLmluZGV4T2YoZmxhbWUpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGFzdEFkZGVkRGVsdGFUaW1lICs9IGRlbHRhTXM7XG4gICAgICAgIGlmICh0aGlzLmxhc3RBZGRlZERlbHRhVGltZSA+PSB0aGlzLmludGVydmFsICYmXG4gICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSAmJlxuICAgICAgICAgICAgcGxheWVyLmNvbG9ySW5kZXggPT09IDAgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpIHtcbiAgICAgICAgICAgIHRoaXMuZmxhbWVzLnB1c2gobmV3IEZsYW1lRHRvKG5ldyBQb2ludF8xLlBvaW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpLCBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLm1heEluZGV4KSkpO1xuICAgICAgICAgICAgdGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3VsZFJlbmRlcihfcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZVBvd2VyU2hvdCA9IEZpcmVQb3dlclNob3Q7XG5jbGFzcyBGbGFtZUR0byB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGluZGV4KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5tYXhEdXJhdGlvbiA9IDEwMDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gKz0gZGVsdGFNcztcbiAgICB9XG4gICAgZ2V0RHVyYXRpb25GYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmR1cmF0aW9uIC8gdGhpcy5tYXhEdXJhdGlvbjtcbiAgICB9XG4gICAgaXNGaW5pc2hlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHVyYXRpb24gPj0gdGhpcy5tYXhEdXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLkZsYW1lRHRvID0gRmxhbWVEdG87XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUG93ZXJTaG90V3JhcHBlciA9IHZvaWQgMDtcbmNvbnN0IEVsZWN0cmljUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi9FbGVjdHJpY1Bvd2VyU2hvdFwiKTtcbmNvbnN0IEZpcmVQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuL0ZpcmVQb3dlclNob3RcIik7XG5jbGFzcyBQb3dlclNob3RXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgc2lkZSkge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHNUb1Bvd2VyU2hvdCA9IDI7XG4gICAgICAgIHRoaXMucG93ZXJTaG90cyA9IFtdO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMucHVzaChuZXcgRWxlY3RyaWNQb3dlclNob3RfMS5FbGVjdHJpY1Bvd2VyU2hvdChnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMucHVzaChuZXcgRmlyZVBvd2VyU2hvdF8xLkZpcmVQb3dlclNob3QoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMsIHBsYXllcikge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMuZm9yRWFjaChwb3dlclNob3QgPT4ge1xuICAgICAgICAgICAgcG93ZXJTaG90LnVwZGF0ZShkZWx0YU1zLCBwbGF5ZXIpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IHBvd2VyU2hvdEVudGl0aWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3RzO1xuICAgIH1cbiAgICB1cGRhdGVTY29yZWRHb2FsKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IHRoaXMuc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzKys7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zZWN1dGl2ZUdvYWxzID09PSB0aGlzLmNvbnNlY3V0aXZlR29hbHNUb1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG93ZXJTaG90ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRQb3dlclNob3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdDtcbiAgICB9XG4gICAgcmVzZXRQb3dlclNob3QoKSB7XG4gICAgICAgIGlmICh0aGlzLnBvd2VyU2hvdCkge1xuICAgICAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlBvd2VyU2hvdFdyYXBwZXIgPSBQb3dlclNob3RXcmFwcGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0YXJEdG8gPSBleHBvcnRzLlN0dW5uZWRTdGFycyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTdHVubmVkU3RhcnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRlbHRhQmV0d2VlblN0YXJzID0gMjAwO1xuICAgICAgICB0aGlzLmFuZ2xlU3RlcCA9IE1hdGguUEkgLyA4MDA7XG4gICAgICAgIHRoaXMuc3RhcnMgPSBbXTtcbiAgICAgICAgdGhpcy5zdGFyRGVsdGEgPSAwO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEsIHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuc3RhckRlbHRhICs9IGRlbHRhO1xuICAgICAgICBpZiAodGhpcy5zdGFyRGVsdGEgPj0gdGhpcy5kZWx0YUJldHdlZW5TdGFycykge1xuICAgICAgICAgICAgdGhpcy5zdGFycy5wdXNoKG5ldyBTdGFyRHRvKG5ldyBQb2ludF8xLlBvaW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpLCAwLCBNYXRoLnJhbmRvbSgpICogMiAqIE1hdGguUEkpKTtcbiAgICAgICAgICAgIHRoaXMuc3RhckRlbHRhID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXJzLmZvckVhY2goKHN0YXIsIF9pbmRleCkgPT4ge1xuICAgICAgICAgICAgc3Rhci51cGRhdGUoZGVsdGEpO1xuICAgICAgICAgICAgc3Rhci5hbmdsZSArPSB0aGlzLmFuZ2xlU3RlcCAqIGRlbHRhO1xuICAgICAgICAgICAgaWYgKHN0YXIuZ2V0RmFjdG9yKCkgPj0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnMuc3BsaWNlKHRoaXMuc3RhcnMuaW5kZXhPZihzdGFyKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFN0YXJzID0gU3R1bm5lZFN0YXJzO1xuU3R1bm5lZFN0YXJzLmR1cmF0aW9uID0gMjAwMDtcbmNsYXNzIFN0YXJEdG8ge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBhbmdsZSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmR1cmF0aW9uICs9IGRlbHRhO1xuICAgIH1cbiAgICBnZXRGYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmR1cmF0aW9uIC8gU3R1bm5lZFN0YXJzLmR1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuU3RhckR0byA9IFN0YXJEdG87XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3R1bm5lZFdyYXBwZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBTdHVubmVkU3RhcnNfMSA9IHJlcXVpcmUoXCIuL1N0dW5uZWRTdGFyc1wiKTtcbmNsYXNzIFN0dW5uZWRXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMgPSBuZXcgU3R1bm5lZFN0YXJzXzEuU3R1bm5lZFN0YXJzKCk7XG4gICAgICAgIHRoaXMuc3R1bm5lZE1heFZhbHVlID0gMjAwMDtcbiAgICAgICAgdGhpcy5zdHVubmVkU3RlcCA9IDEwMDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZER1cmF0aW9uID0gMzAwMDtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG4gICAgfVxuICAgIHVwZGF0ZVN0dW5uZWRWYWx1ZShvdGhlclBsYXllclNwZWVkKSB7XG4gICAgICAgIGlmICh0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgIT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEKSB7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMucGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChzcGVlZCA+IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gdGhpcy5zdHVubmVkU3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzcGVlZCA8IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSArPSB0aGlzLnN0dW5uZWRTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3R1bm5lZFZhbHVlID4gdGhpcy5zdHVubmVkTWF4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRUaW1lID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3JjZVN0dW5uZWQoKSB7XG4gICAgICAgIHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEO1xuICAgICAgICB0aGlzLnN0dW5uZWRUaW1lID0gMDtcbiAgICB9XG4gICAgZGVjcmVtZW50U3R1bm5lZFZhbHVlKGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCkge1xuICAgICAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSBNYXRoLm1heCgwLCB0aGlzLnN0dW5uZWRWYWx1ZSAtIGRlbHRhTXMgLyAyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEKSB7XG4gICAgICAgICAgICB0aGlzLnN0dW5uZWRUaW1lICs9IGRlbHRhTXM7XG4gICAgICAgICAgICB0aGlzLnN0dW5uZWRTdGFycy51cGRhdGUoZGVsdGFNcywgdGhpcy5wbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICBpZiAodGhpcy5zdHVubmVkVGltZSA+IHRoaXMuc3R1bm5lZER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMuc3RhcnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFycy5zdGFycyA9IFtdO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFdyYXBwZXIgPSBTdHVubmVkV3JhcHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsU3RhdHVzID0gdm9pZCAwO1xudmFyIEJhbGxTdGF0dXM7XG4oZnVuY3Rpb24gKEJhbGxTdGF0dXMpIHtcbiAgICBCYWxsU3RhdHVzW1wiRlJFRVwiXSA9IFwiRlJFRVwiO1xuICAgIEJhbGxTdGF0dXNbXCJBVFRBQ0hFRFwiXSA9IFwiQVRUQUNIRURcIjtcbiAgICBCYWxsU3RhdHVzW1wiR09BTF9TQ09SRURcIl0gPSBcIkdPQUxfU0NPUkVEXCI7XG59KShCYWxsU3RhdHVzIHx8IChleHBvcnRzLkJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzID0gdm9pZCAwO1xudmFyIEdhbWVTdGF0dXM7XG4oZnVuY3Rpb24gKEdhbWVTdGF0dXMpIHtcbiAgICBHYW1lU3RhdHVzW1wiTUVOVVwiXSA9IFwiTUVOVVwiO1xuICAgIEdhbWVTdGF0dXNbXCJXQUlUSU5HX0JBTExcIl0gPSBcIldBSVRJTkdfQkFMTFwiO1xuICAgIEdhbWVTdGF0dXNbXCJQTEFZSU5HXCJdID0gXCJQTEFZSU5HXCI7XG4gICAgR2FtZVN0YXR1c1tcIkVORF9HQU1FXCJdID0gXCJFTkRfR0FNRVwiO1xuICAgIEdhbWVTdGF0dXNbXCJTVUJTVElUVVRJT05cIl0gPSBcIlNVQlNUSVRVVElPTlwiO1xufSkoR2FtZVN0YXR1cyB8fCAoZXhwb3J0cy5HYW1lU3RhdHVzID0gR2FtZVN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IGV4cG9ydHMuS2V5cyA9IHZvaWQgMDtcbnZhciBLZXlzO1xuKGZ1bmN0aW9uIChLZXlzKSB7XG4gICAgS2V5c1tcIkFSUk9XX0RPV05cIl0gPSBcIkFycm93RG93blwiO1xuICAgIEtleXNbXCJBUlJPV19VUFwiXSA9IFwiQXJyb3dVcFwiO1xuICAgIEtleXNbXCJBUlJPV19MRUZUXCJdID0gXCJBcnJvd0xlZnRcIjtcbiAgICBLZXlzW1wiQVJST1dfUklHSFRcIl0gPSBcIkFycm93UmlnaHRcIjtcbiAgICBLZXlzW1wiU1BBQ0VcIl0gPSBcIiBcIjtcbn0pKEtleXMgfHwgKGV4cG9ydHMuS2V5cyA9IEtleXMgPSB7fSkpO1xudmFyIEtleXNEaXJlY3Rpb247XG4oZnVuY3Rpb24gKEtleXNEaXJlY3Rpb24pIHtcbiAgICBLZXlzRGlyZWN0aW9uW1wiSE9SSVpPTlRBTFwiXSA9IFwiSE9SSVpPTlRBTFwiO1xuICAgIEtleXNEaXJlY3Rpb25bXCJWRVJUSUNBTFwiXSA9IFwiVkVSVElDQUxcIjtcbn0pKEtleXNEaXJlY3Rpb24gfHwgKGV4cG9ydHMuS2V5c0RpcmVjdGlvbiA9IEtleXNEaXJlY3Rpb24gPSB7fSkpO1xuY2xhc3MgS2V5c1V0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldEtleURpcmVjdGlvbihrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gS2V5cy5BUlJPV19MRUZUIHx8IGtleSA9PT0gS2V5cy5BUlJPV19SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIEtleXNEaXJlY3Rpb24uSE9SSVpPTlRBTDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX1VQIHx8IGtleSA9PT0gS2V5cy5BUlJPV19ET1dOKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5WRVJUSUNBTDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleXNVdGlsaXRpZXMgPSBLZXlzVXRpbGl0aWVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclNpZGVVdGlsaXRpZXMgPSBleHBvcnRzLlBsYXllclNpZGUgPSB2b2lkIDA7XG52YXIgUGxheWVyU2lkZTtcbihmdW5jdGlvbiAoUGxheWVyU2lkZSkge1xuICAgIFBsYXllclNpZGVbXCJMRUZUXCJdID0gXCJMRUZUXCI7XG4gICAgUGxheWVyU2lkZVtcIlJJR0hUXCJdID0gXCJSSUdIVFwiO1xufSkoUGxheWVyU2lkZSB8fCAoZXhwb3J0cy5QbGF5ZXJTaWRlID0gUGxheWVyU2lkZSA9IHt9KSk7XG5jbGFzcyBQbGF5ZXJTaWRlVXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0T3Bwb3NpdGVTaWRlKHNpZGUpIHtcbiAgICAgICAgcmV0dXJuIHNpZGUgPT09IFBsYXllclNpZGUuTEVGVCA/IFBsYXllclNpZGUuUklHSFQgOiBQbGF5ZXJTaWRlLkxFRlQ7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJTaWRlVXRpbGl0aWVzID0gUGxheWVyU2lkZVV0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSB2b2lkIDA7XG52YXIgUGxheWVyU3RhdHVzO1xuKGZ1bmN0aW9uIChQbGF5ZXJTdGF0dXMpIHtcbiAgICBQbGF5ZXJTdGF0dXNbXCJOT1JNQUxcIl0gPSBcIk5PUk1BTFwiO1xuICAgIFBsYXllclN0YXR1c1tcIlNUVU5ORURcIl0gPSBcIlNUVU5ORURcIjtcbn0pKFBsYXllclN0YXR1cyB8fCAoZXhwb3J0cy5QbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXMgPSB7fSkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvd2VyU2hvdFV0aWxpdGllcyA9IGV4cG9ydHMuUG93ZXJTaG90VHlwZSA9IHZvaWQgMDtcbnZhciBQb3dlclNob3RUeXBlO1xuKGZ1bmN0aW9uIChQb3dlclNob3RUeXBlKSB7XG4gICAgUG93ZXJTaG90VHlwZVtcIkZJUkVcIl0gPSBcIkZJUkVcIjtcbiAgICBQb3dlclNob3RUeXBlW1wiRUxFQ1RSSUNcIl0gPSBcIkVMRUNUUklDXCI7XG59KShQb3dlclNob3RUeXBlIHx8IChleHBvcnRzLlBvd2VyU2hvdFR5cGUgPSBQb3dlclNob3RUeXBlID0ge30pKTtcbmNsYXNzIFBvd2VyU2hvdFV0aWxpdGllcyB7XG4gICAgc3RhdGljIGdldFBvd2VyU2hvdFR5cGUoY29sb3JJbmRleCkge1xuICAgICAgICBzd2l0Y2ggKGNvbG9ySW5kZXgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZS5GSVJFO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlLkVMRUNUUklDO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gUG93ZXJTaG90VHlwZS5GSVJFO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZXRTcGVlZEZhY3Rvcihwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRUxFQ1RSSUM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDEuMjtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIHNob3VsZFN0b3BPblBsYXllckJvdW5jZShwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkVMRUNUUklDOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgc2hvdWxkTW92ZVRvR29hbChwb3dlclNob3RUeXBlKSB7XG4gICAgICAgIHN3aXRjaCAocG93ZXJTaG90VHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkZJUkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY2FzZSBQb3dlclNob3RUeXBlLkVMRUNUUklDOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlBvd2VyU2hvdFV0aWxpdGllcyA9IFBvd2VyU2hvdFV0aWxpdGllcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSB2b2lkIDA7XG5jbGFzcyBCb3JkZXJMaW1pdHMge1xuICAgIGNvbnN0cnVjdG9yKGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSkge1xuICAgICAgICB0aGlzLmxlZnQgPSBsZWZ0O1xuICAgICAgICB0aGlzLnJpZ2h0ID0gcmlnaHQ7XG4gICAgICAgIHRoaXMudG9wID0gdG9wO1xuICAgICAgICB0aGlzLmJvdHRvbSA9IGJvdHRvbTtcbiAgICB9XG4gICAgaXNQb2ludEluc2lkZShwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5sZWZ0ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucmlnaHQgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPj0gdGhpcy50b3AgJiZcbiAgICAgICAgICAgIHBvaW50LnkgPD0gdGhpcy5ib3R0b20pO1xuICAgIH1cbn1cbmV4cG9ydHMuQm9yZGVyTGltaXRzID0gQm9yZGVyTGltaXRzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRpbWVuc2lvbnMgPSB2b2lkIDA7XG5jbGFzcyBEaW1lbnNpb25zIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfVxufVxuZXhwb3J0cy5EaW1lbnNpb25zID0gRGltZW5zaW9ucztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuL1BvaW50XCIpO1xuY2xhc3MgTW92ZW1lbnRQb2ludCB7XG4gICAgc3RhdGljIGFyZVRvdWNoaW5nKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHBvaW50MS5wb3NpdGlvbiwgcG9pbnQyLnBvc2l0aW9uKSA8IHBvaW50MS5zaXplICsgcG9pbnQyLnNpemU7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCB2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uLCBzaXplKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICB9XG4gICAgdXBkYXRlUG9zaXRpb24oZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gdGhpcy52ZWxvY2l0eS54ICogZGVsdGFNcztcbiAgICAgICAgdGhpcy5wb3NpdGlvbi55ICs9IHRoaXMudmVsb2NpdHkueSAqIGRlbHRhTXM7XG4gICAgfVxuICAgIHByb2plY3RUb0ZpbmFsUG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi54LCB0aGlzLnZlbG9jaXR5LngpLCB0aGlzLmNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24odGhpcy5wb3NpdGlvbi55LCB0aGlzLnZlbG9jaXR5LnkpKTtcbiAgICB9XG4gICAgZ2V0U3BlZWQoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy52ZWxvY2l0eS54LCAyKSArIE1hdGgucG93KHRoaXMudmVsb2NpdHkueSwgMikpO1xuICAgIH1cbiAgICBnZXRTcGVlZEFuZ2xlKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnZlbG9jaXR5LnksIHRoaXMudmVsb2NpdHkueCk7XG4gICAgfVxuICAgIGFkanVzdFRvTWF4U3BlZWQobWF4U3BlZWQpIHtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBNYXRoLm1pbih0aGlzLmdldFNwZWVkKCksIG1heFNwZWVkKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSB0aGlzLmdldFNwZWVkQW5nbGUoKTtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBzZXRTcGVlZChzcGVlZCwgYW5nbGUpIHtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS54ID0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHRoaXMudmVsb2NpdHkueSA9IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBkZWNyZW1lbnRTcGVlZChkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTcGVlZCA9IHRoaXMuZ2V0U3BlZWQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRTcGVlZCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NwZWVkID0gTWF0aC5tYXgoY3VycmVudFNwZWVkIC0gdGhpcy5hY2NlbGVyYXRpb24gKiBkZWx0YU1zLCAwKTtcbiAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbmV3U3BlZWQgLyBjdXJyZW50U3BlZWQ7XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnggKj0gcmF0aW87XG4gICAgICAgICAgICB0aGlzLnZlbG9jaXR5LnkgKj0gcmF0aW87XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xvbmUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSksIG5ldyBQb2ludF8xLlBvaW50KHRoaXMudmVsb2NpdHkueCwgdGhpcy52ZWxvY2l0eS55KSwgdGhpcy5hY2NlbGVyYXRpb24sIHRoaXMuc2l6ZSk7XG4gICAgfVxuICAgIGNhbGN1bGF0ZURlc3RpbmF0aW9uUG9zaXRpb24ocG9zaXRpb24sIHNwZWVkKSB7XG4gICAgICAgIGlmIChzcGVlZCA9PT0gMCB8fCB0aGlzLmFjY2VsZXJhdGlvbiA8PSAwKVxuICAgICAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgICAgICBjb25zdCBhYnNTcGVlZCA9IE1hdGguYWJzKHNwZWVkKTtcbiAgICAgICAgY29uc3QgbiA9IE1hdGguY2VpbChhYnNTcGVlZCAvIHRoaXMuYWNjZWxlcmF0aW9uKTtcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSAobiAqICgyICogYWJzU3BlZWQgLSAobiAtIDEpICogdGhpcy5hY2NlbGVyYXRpb24pKSAvIDI7XG4gICAgICAgIHJldHVybiBwb3NpdGlvbiArIE1hdGguc2lnbihzcGVlZCkgKiBkaXN0YW5jZTtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSBNb3ZlbWVudFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBvaW50ID0gdm9pZCAwO1xuY2xhc3MgUG9pbnQge1xuICAgIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgc3RhdGljIGdldERpc3RhbmNlKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnQxLnggLSBwb2ludDIueCwgMikgKyBNYXRoLnBvdyhwb2ludDEueSAtIHBvaW50Mi55LCAyKSk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXRBbmdsZUJldHdlZW5Qb2ludHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIocG9pbnQyLnkgLSBwb2ludDEueSwgcG9pbnQyLnggLSBwb2ludDEueCk7XG4gICAgfVxuICAgIHN0YXRpYyBhcmVQb2ludEVxdWFscyhwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gcG9pbnQxLnggPT09IHBvaW50Mi54ICYmIHBvaW50MS55ID09PSBwb2ludDIueTtcbiAgICB9XG59XG5leHBvcnRzLlBvaW50ID0gUG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuSGlzdG9yeVBvaW50ID0gZXhwb3J0cy5Qb3NpdGlvbkhpc3RvcnkgPSB2b2lkIDA7XG5jbGFzcyBQb3NpdGlvbkhpc3Rvcnkge1xuICAgIGNvbnN0cnVjdG9yKHJldGVudGlvblRpbWUpIHtcbiAgICAgICAgdGhpcy5yZXRlbnRpb25UaW1lID0gcmV0ZW50aW9uVGltZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB9XG4gICAgYWRkUG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgSGlzdG9yeVBvaW50KHBvc2l0aW9uLCAwKSk7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLmZvckVhY2gocCA9PiAocC5kZWx0YSArPSBkZWx0YU1zKSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gdGhpcy5wb3NpdGlvbnMuZmlsdGVyKHAgPT4gcC5kZWx0YSA8IHRoaXMucmV0ZW50aW9uVGltZSk7XG4gICAgfVxuICAgIGdldEZhY3RvcihpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3NpdGlvbnNbaW5kZXhdLmdldEZhY3Rvcih0aGlzLnJldGVudGlvblRpbWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuUG9zaXRpb25IaXN0b3J5ID0gUG9zaXRpb25IaXN0b3J5O1xuY2xhc3MgSGlzdG9yeVBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbiwgZGVsdGEpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLmRlbHRhID0gZGVsdGE7XG4gICAgfVxuICAgIGdldEZhY3RvcihyZXRlbnRpb25UaW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlbHRhIC8gcmV0ZW50aW9uVGltZTtcbiAgICB9XG59XG5leHBvcnRzLkhpc3RvcnlQb2ludCA9IEhpc3RvcnlQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzTWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEV2ZW50QnVzVXRpbGl0aWVzXzEgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRXZlbnRCdXNVdGlsaXRpZXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEdhbWVTdGF0dXNNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihidXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgICAgIHRoaXMuY3VycmVudFN0YXR1c1RpbWUgPSAwO1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cyA9IFtdO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmJ1cyA9IGJ1cztcbiAgICB9XG4gICAgY2hhbmdlU3RhdHVzKGdhbWVTdGF0dXMpIHtcbiAgICAgICAgdGhpcy5fZ2FtZVN0YXR1cyA9IGdhbWVTdGF0dXM7XG4gICAgICAgIHRoaXMuY3VycmVudFN0YXR1c1RpbWUgPSAwO1xuICAgICAgICB0aGlzLnB1Ymxpc2hTdGF0dXNDaGFuZ2UoKTtcbiAgICB9XG4gICAgZ2V0IGdhbWVTdGF0dXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nYW1lU3RhdHVzO1xuICAgIH1cbiAgICBpc1N0YXR1c0NoYW5nZWRSZWNlbnRseSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFN0YXR1c1RpbWUgPCAzMDA7XG4gICAgfVxuICAgIHNjaGVkdWxlU3RhdHVzQ2hhbmdlKGRlbGF5LCBnYW1lU3RhdHVzKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRXZlbnQgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maW5kKGUgPT4gZS5nYW1lU3RhdHVzID09PSBnYW1lU3RhdHVzKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0V2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZEV2ZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0aW1lOiB0aGlzLnRpbWUgKyBkZWxheSxcbiAgICAgICAgICAgICAgICBnYW1lU3RhdHVzOiBnYW1lU3RhdHVzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMudGltZSArPSBkZWx0YTtcbiAgICAgICAgdGhpcy5jdXJyZW50U3RhdHVzVGltZSArPSBkZWx0YTtcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIHRoaXMuc2NoZWR1bGVkRXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lID49IGUudGltZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlU3RhdHVzKGUuZ2FtZVN0YXR1cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoU3RhdHVzQ2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maWx0ZXIoZSA9PiB0aGlzLnRpbWUgPCBlLnRpbWUpO1xuICAgIH1cbiAgICBwdWJsaXNoU3RhdHVzQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLmJ1cy5wdWJsaXNoKEV2ZW50QnVzVXRpbGl0aWVzXzEuRXZlbnRCdXNVdGlsaXRpZXMuc3RhdHVzQ2hhbmdlZEV2ZW50KHRoaXMuZ2FtZVN0YXR1cykpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSBHYW1lU3RhdHVzTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZU1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNsYXNzIFNjb3JlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGVmdFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5yaWdodFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlRHVyYXRpb24gPSAwO1xuICAgICAgICB0aGlzLmxhc3RTaWRlVXBkYXRlZCA9IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQ7XG4gICAgICAgIHRoaXMubWF4U2NvcmUgPSAxMDtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25Hb2FscyA9IDM7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICBpZiAocGxheWVyU2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHRTY29yZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sZWZ0U2NvcmUrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc3RVcGRhdGVEdXJhdGlvbiA9IDA7XG4gICAgICAgIHRoaXMubGFzdFNpZGVVcGRhdGVkID0gcGxheWVyU2lkZTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhKSB7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZUR1cmF0aW9uICs9IGRlbHRhO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5sZWZ0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLnJpZ2h0U2NvcmUgPSAwO1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGVEdXJhdGlvbiA9IDA7XG4gICAgICAgIHRoaXMubGFzdFNpZGVVcGRhdGVkID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVDtcbiAgICB9XG4gICAgZ2V0U2NvcmVBc0FycmF5KCkge1xuICAgICAgICBjb25zdCBvdXRwdXRTdHJpbmcgPSBTdHJpbmcodGhpcy5sZWZ0U2NvcmUpLnBhZFN0YXJ0KDIsIFwiMFwiKSArIFN0cmluZyh0aGlzLnJpZ2h0U2NvcmUpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICAgICAgcmV0dXJuIG91dHB1dFN0cmluZy5zcGxpdChcIlwiKS5tYXAoTnVtYmVyKTtcbiAgICB9XG4gICAgc2hvdWxkQW5pbWF0ZUluZGV4KGluZGV4KSB7XG4gICAgICAgIGlmICh0aGlzLmxhc3RTaWRlVXBkYXRlZCA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA8IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPj0gMjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRMYXN0VXBkYXRlRHVyYXRpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxhc3RVcGRhdGVEdXJhdGlvbjtcbiAgICB9XG4gICAgZ2V0IGlzR2FtZU92ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxlZnRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSB8fCB0aGlzLnJpZ2h0U2NvcmUgPT09IHRoaXMubWF4U2NvcmU7XG4gICAgfVxuICAgIGdldFdpbm5pbmdQbGF5ZXJTaWRlKCkge1xuICAgICAgICBpZiAodGhpcy5sZWZ0U2NvcmUgPT09IHRoaXMubWF4U2NvcmUpIHtcbiAgICAgICAgICAgIHJldHVybiBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucmlnaHRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaXNTdWJzdGl0dXRpb25UaW1lKCkge1xuICAgICAgICBjb25zdCB0b3RhbFNjb3JlID0gdGhpcy5sZWZ0U2NvcmUgKyB0aGlzLnJpZ2h0U2NvcmU7XG4gICAgICAgIHJldHVybiB0b3RhbFNjb3JlID4gMCAmJiB0b3RhbFNjb3JlICUgdGhpcy5zdWJzdGl0dXRpb25Hb2FscyA9PT0gMDtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlTWFuYWdlciA9IFNjb3JlTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBHYXRlU3lzdGVtIHtcbiAgICB1cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5nYXRlcy51cGRhdGUoZGVsdGFNcywgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRVVElPTik7XG4gICAgfVxufVxuZXhwb3J0cy5HYXRlU3lzdGVtID0gR2F0ZVN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlclwiKTtcbmNvbnN0IENoZWNrZXJTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NoZWNrZXJzL0NoZWNrZXJTeXN0ZW1cIik7XG5jb25zdCBDb2xsaXNpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW1cIik7XG5jb25zdCBHYXRlU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9HYXRlU3lzdGVtXCIpO1xuY29uc3QgTW92ZW1lbnRTeXN0ZW1fMSA9IHJlcXVpcmUoXCIuL21vdmVtZW50L01vdmVtZW50U3lzdGVtXCIpO1xuY2xhc3MgTWFpblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBNb3ZlbWVudFN5c3RlbV8xLk1vdmVtZW50U3lzdGVtKGdhbWVDb25maWdzLCBuZXcgS2V5Ym9hcmRJbnB1dE1hbmFnZXJfMS5LZXlib2FyZElucHV0TWFuYWdlcigpKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBDb2xsaXNpb25TeXN0ZW1fMS5Db2xsaXNpb25TeXN0ZW0oZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IEdhdGVTeXN0ZW1fMS5HYXRlU3lzdGVtKCkpO1xuICAgICAgICB0aGlzLnN5c3RlbXMucHVzaChuZXcgQ2hlY2tlclN5c3RlbV8xLkNoZWNrZXJTeXN0ZW0oKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLmZvckVhY2goc3lzdGVtID0+IHN5c3RlbS51cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgfVxufVxuZXhwb3J0cy5NYWluU3lzdGVtID0gTWFpblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1N1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneVwiKTtcbmNvbnN0IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1dhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XCIpO1xuY2xhc3MgQ2hlY2tlclN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5XzEuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3lfMS5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSgpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCwgX2RlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkKSk7XG4gICAgfVxufVxuZXhwb3J0cy5DaGVja2VyU3lzdGVtID0gQ2hlY2tlclN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUVVRJT047XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBhcmVBbGxQbGF5ZXJzSW5Jbml0aWFsUG9zaXRpb24gPSBnYW1lV29ybGQucGxheWVycy5ldmVyeShwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuYXJlUG9pbnRFcXVhbHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBsYXllci5pbml0aWFsUG9zaXRpb24pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGFyZUFsbFBsYXllcnNJbkluaXRpYWxQb3NpdGlvbikge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3kgPSBTdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYXJlQWxsUGxheWVyc0luUG9zaXRpb24gPSBnYW1lV29ybGQucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZXZlcnkocGxheWVyID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwbGF5ZXIucmVhY2hlZERlc3RpbmF0aW9uUG9zaXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGlzQmFsbFN0b3BwZWQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPT09IDA7XG4gICAgICAgIGlmIChhcmVBbGxQbGF5ZXJzSW5Qb3NpdGlvbiAmJiBpc0JhbGxTdG9wcGVkKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuc2NoZWR1bGVTdGF0dXNDaGFuZ2UoMTUwMCwgR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLldhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ29sbGlzaW9uU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1BsYXllckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQ29sbGlzaW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5QbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMS5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneV8xLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3lfMS5Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQpKVxuICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkoZ2FtZVdvcmxkKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSBDb2xsaXNpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQm9yZGVyTGltaXRzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvQm9yZGVyTGltaXRzXCIpO1xuY2xhc3MgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBnZXRGaWVsZEJvcmRlckxpbWl0cyhzaXplKSB7XG4gICAgICAgIGNvbnN0IGNmZyA9IHRoaXMuZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKGNmZy5maWVsZFhPZmZzZXQgKyBzaXplLCBjZmcuZmllbGRYT2Zmc2V0ICsgY2ZnLmZpZWxkV2lkdGggLSBzaXplLCBjZmcuZmllbGRCb3JkZXJTaXplICsgc2l6ZSwgY2ZnLmZpZWxkSGVpZ2h0IC0gY2ZnLmZpZWxkQm9yZGVyU2l6ZSAtIHNpemUpO1xuICAgIH1cbiAgICBoYW5kbGVCb3JkZXJDb2xsaXNpb24obW92ZW1lbnRQb2ludCwgYm9yZGVyTGltaXRzLCBpbnZlcnRTcGVlZCwgYXZvaWRCb3VuY2VPbkdvYWwgPSB0cnVlLCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgY29uc3QgaXNJbkdvYWxZUmFuZ2UgPSAhYXZvaWRCb3VuY2VPbkdvYWwgJiZcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA+PSBjZmcuZ29hbFlPZmZzZXQgJiZcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8PSBjZmcuZ29hbFlPZmZzZXQgKyBjZmcuZ29hbEhlaWdodDtcbiAgICAgICAgY29uc3QgaXNJblN1YnN0aXR1dGlvbllSYW5nZSA9IGF2b2lkQm91bmNlT25TdWJzdGl0dXRpb24gJiZcbiAgICAgICAgICAgICgobW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID49IGNmZy5wbGF5ZXJTdWJzdGl0dXRpb25YIC0gY2ZnLmdhdGVzTGVuZ3RoIC8gMiAmJlxuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8PSBjZmcucGxheWVyU3Vic3RpdHV0aW9uWCArIGNmZy5nYXRlc0xlbmd0aCAvIDIpIHx8XG4gICAgICAgICAgICAgICAgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+PSBjZmcuY3B1U3Vic3RpdHV0aW9uWCAtIGNmZy5nYXRlc0xlbmd0aCAvIDIgJiZcbiAgICAgICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54IDw9IGNmZy5jcHVTdWJzdGl0dXRpb25YICsgY2ZnLmdhdGVzTGVuZ3RoIC8gMikpO1xuICAgICAgICBsZXQgaGFzQ29sbGlkZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFpc0luR29hbFlSYW5nZSAmJiBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPCBib3JkZXJMaW1pdHMubGVmdCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLmxlZnQ7XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gTWF0aC5tYXgoMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzSW5Hb2FsWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA+IGJvcmRlckxpbWl0cy5yaWdodCkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID0gYm9yZGVyTGltaXRzLnJpZ2h0O1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS54ID0gLU1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLm1pbigwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPCBib3JkZXJMaW1pdHMudG9wKSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnkgPSBib3JkZXJMaW1pdHMudG9wO1xuICAgICAgICAgICAgaGFzQ29sbGlkZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGludmVydFNwZWVkKSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGgubWF4KDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0luU3Vic3RpdHV0aW9uWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA+IGJvcmRlckxpbWl0cy5ib3R0b20pIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy5ib3R0b207XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSAtTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IE1hdGgubWluKDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhhc0NvbGxpZGVkO1xuICAgIH1cbiAgICBnZXRHb2FsQm9yZGVyTGltaXRzKHNpemUsIHBsYXllclNpZGUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgY29uc3QgdG9wID0gY2ZnLmdvYWxZT2Zmc2V0ICsgc2l6ZTtcbiAgICAgICAgY29uc3QgYm90dG9tID0gY2ZnLmdvYWxZT2Zmc2V0ICsgY2ZnLmdvYWxIZWlnaHQgLSBzaXplO1xuICAgICAgICBpZiAocGxheWVyU2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoc2l6ZSwgY2ZnLmZpZWxkWE9mZnNldCAtIHNpemUsIHRvcCwgYm90dG9tKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhjZmcuZmllbGRYT2Zmc2V0ICsgY2ZnLmZpZWxkV2lkdGggKyBzaXplLCBjZmcud2lkdGggLSBzaXplLCB0b3AsIGJvdHRvbSk7XG4gICAgfVxufVxuZXhwb3J0cy5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5ID0gQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGJhbGxNb3ZlbWVudCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb247XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgdGhpcy5nZXRGaWVsZEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSksIHRydWUsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5jaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKTtcbiAgICAgICAgdGhpcy5jaGVja0lmQmFsbEluc2lkZUdvYWwoZ2FtZVdvcmxkLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCk7XG4gICAgfVxuICAgIGNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIHBsYXllclNpZGUpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgcGxheWVyU2lkZSk7XG4gICAgICAgIGlmIChnb2FsQm9yZGVyLmlzUG9pbnRJbnNpZGUoYmFsbE1vdmVtZW50LnBvc2l0aW9uKSkge1xuICAgICAgICAgICAgZ2FtZVdvcmxkLmluY3JlYXNlU2NvcmUoUGxheWVyU2lkZV8xLlBsYXllclNpZGVVdGlsaXRpZXMuZ2V0T3Bwb3NpdGVTaWRlKHBsYXllclNpZGUpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIEJhbGxHb2FsQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRVVElPTikgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgbGV0IHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICBpZiAoYmFsbE1vdmVtZW50LnBvc2l0aW9uLnggPlxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyKSB7XG4gICAgICAgICAgICBzaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgc2lkZSk7XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgZ29hbEJvcmRlciwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSA8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplICsgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSAtIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCksIGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICsgTWF0aC5jb3MoYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArIE1hdGguc2luKGFuZ2xlKSAqIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmJhbGxQb3dlclNob3Quc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKCkpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5hdHRhY2hUb1BsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICAhZ2FtZVdvcmxkLmJhbGwuYmFsbFBvd2VyU2hvdC5zaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UoKSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pZGRsZVBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAgICAgMiwgKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAgICAgMik7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhtaWRkbGVQb2ludCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSwgYW5nbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgPSBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoX2dhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uID0gZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRVVElPTjtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbGxpZGVkID0gdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24ocGxheWVyLm1vdmVtZW50UG9zaXRpb24sIHRoaXMuZ2V0RmllbGRCb3JkZXJMaW1pdHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2l6ZSksIGZhbHNlLCB0cnVlLCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChoYXNDb2xsaWRlZCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zdGFydEJvdW5jaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoX2dhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGh1bWFuUGxheWVyID0gZ2FtZVdvcmxkLnBsYXllcnMuZmluZChwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgIXBsYXllci5pc0NwdSk7XG4gICAgICAgIGNvbnN0IGNwdVBsYXllciA9IGdhbWVXb3JsZC5wbGF5ZXJzLmZpbmQocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmIHBsYXllci5pc0NwdSk7XG4gICAgICAgIGlmIChodW1hblBsYXllciA9PT0gdW5kZWZpbmVkIHx8IGNwdVBsYXllciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24sIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKSB7XG4gICAgICAgICAgICAgICAgaHVtYW5QbGF5ZXIuc3R1bm5lZFdyYXBwZXIudXBkYXRlU3R1bm5lZFZhbHVlKGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpO1xuICAgICAgICAgICAgICAgIGNwdVBsYXllci5zdHVubmVkV3JhcHBlci51cGRhdGVTdHVubmVkVmFsdWUoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGludGVyc2VjdGlvblBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAyLCAoaHVtYW5QbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgY3B1UGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSkgL1xuICAgICAgICAgICAgICAgIDIpO1xuICAgICAgICAgICAgaHVtYW5QbGF5ZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICAgICAgY3B1UGxheWVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpc2lvblNwZWVkID0gKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkpIC9cbiAgICAgICAgICAgICAgICAyO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGh1bWFuUGxheWVyLCBjcHVQbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVBsYXllcnMoY3B1UGxheWVyLCBodW1hblBsYXllciwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgICAgIGlmIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEKSB7XG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhpbnRlcnNlY3Rpb25Qb2ludCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uKSk7XG4gICAgICAgICAgICAgICAgYmFsbC5yZWxlYXNlRnJvbVBsYXllcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGJvdW5jZVBsYXllcnMocGxheWVyMSwgcGxheWVyMiwgaW50ZXJzZWN0aW9uUG9pbnQsIGNvbGxpc2lvblNwZWVkKSB7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMocGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBpbnRlcnNlY3Rpb25Qb2ludCkgLVxuICAgICAgICAgICAgTWF0aC5QSTtcbiAgICAgICAgcGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGNvbGxpc2lvblNwZWVkLCBhbmdsZSk7XG4gICAgICAgIHBsYXllcjEubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID1cbiAgICAgICAgICAgIGludGVyc2VjdGlvblBvaW50LnggKyBNYXRoLmNvcyhhbmdsZSkgKiBwbGF5ZXIyLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICAgICAgcGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgaW50ZXJzZWN0aW9uUG9pbnQueSArIE1hdGguc2luKGFuZ2xlKSAqIHBsYXllcjIubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBNb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vYmFsbFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IENwdU1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0NwdU1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL0lucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9TdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3lcIik7XG5jbGFzcyBNb3ZlbWVudFN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBNZW51TW92ZW1lbnRTdHJhdGVneV8xLk1lbnVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IENwdU1vdmVtZW50U3RyYXRlZ3lfMS5DcHVNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneV8xLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5KCkpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3lfMS5XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5XzEuU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneV8xLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneV8xLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5KGtleWJvYXJkSW5wdXRNYW5hZ2VyKSk7XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMucHVzaChuZXcgTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3lfMS5Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMudXBkYXRlUGxheWVycyhnYW1lV29ybGQsIGRlbHRhTXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZUJhbGwoZ2FtZVdvcmxkLCBkZWx0YU1zKTtcbiAgICB9XG4gICAgdXBkYXRlUGxheWVycyhnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpKVxuICAgICAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgICAgICAgICBwbGF5ZXIuc3R1bm5lZFdyYXBwZXIuZGVjcmVtZW50U3R1bm5lZFZhbHVlKGRlbHRhTXMpO1xuICAgICAgICAgICAgcGxheWVyLnVwZGF0ZVBvd2VyU2hvdChkZWx0YU1zKTtcbiAgICAgICAgICAgIHBsYXllci5ib3VuY2VXcmFwcGVyLnVwZGF0ZShkZWx0YU1zKTtcbiAgICAgICAgICAgIHBsYXllci5tb3ZlKGRlbHRhTXMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlQmFsbChnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llc1xuICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQoZ2FtZVdvcmxkLmJhbGwsIGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShnYW1lV29ybGQuYmFsbCwgZ2FtZVdvcmxkLCBkZWx0YU1zKSk7XG4gICAgICAgIGdhbWVXb3JsZC5iYWxsLnVwZGF0ZVRyYWplY3RvcnkoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFN5c3RlbSA9IE1vdmVtZW50U3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBLZXlzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvS2V5c1wiKTtcbmNsYXNzIEF0dGFjaGVkV2l0aEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3Ioa2V5Ym9hcmRJbnB1dE1hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5rZXlib2FyZElucHV0TWFuYWdlciA9IGtleWJvYXJkSW5wdXRNYW5hZ2VyO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IHBsYXllciA9IGJhbGwuYXR0YWNoZWRQbGF5ZXI7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIHBsYXllciAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgIXBsYXllci5pc0NwdSAmJlxuICAgICAgICAgICAgdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5pc0tleVByZXNzZWQoS2V5c18xLktleXMuU1BBQ0UpKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBiYWxsLmtpY2soKTtcbiAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBLZXlzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvS2V5c1wiKTtcbmNsYXNzIEF0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3Ioa2V5Ym9hcmRJbnB1dE1hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5hbmdsZVRvbGxlcmFuY2UgPSBNYXRoLlBJIC8gMzA7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICAhdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5pc0tleVByZXNzZWQoS2V5c18xLktleXMuU1BBQ0UpKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBwbGF5ZXIgPSBiYWxsLmF0dGFjaGVkUGxheWVyO1xuICAgICAgICBpZiAocGxheWVyID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGp1c3RCYWxsUG9zaXRpb25Bcm91bmRQbGF5ZXIoYmFsbCwgcGxheWVyLCBkZWx0YU1zKTtcbiAgICB9XG4gICAgYWRqdXN0QmFsbFBvc2l0aW9uQXJvdW5kUGxheWVyKGJhbGwsIHBsYXllciwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBjb21iaW5lZFNpemUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplICsgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID1cbiAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggKyBNYXRoLmNvcyhiYWxsLmFuZ2xlV2l0aFBsYXllcikgKiBjb21iaW5lZFNpemU7XG4gICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgKyBNYXRoLnNpbihiYWxsLmFuZ2xlV2l0aFBsYXllcikgKiBjb21iaW5lZFNpemU7XG4gICAgICAgIGNvbnN0IHNwZWVkID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgaWYgKHNwZWVkID4gMCkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0QW5nbGUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgKyBNYXRoLlBJO1xuICAgICAgICAgICAgY29uc3QgYW5nbGVEaWZmZXJlbmNlID0gdGhpcy5ub3JtYWxpemVBbmdsZSh0YXJnZXRBbmdsZSAtIGJhbGwuYW5nbGVXaXRoUGxheWVyKTtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhhbmdsZURpZmZlcmVuY2UpID4gdGhpcy5hbmdsZVRvbGxlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGVwID0gKHNwZWVkIC8gcGxheWVyLm5vcm1hbE1heFNwZWVkKSAqIDAuMDEgKiBkZWx0YU1zO1xuICAgICAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyICs9IGFuZ2xlRGlmZmVyZW5jZSA+IDAgPyBzdGVwIDogLXN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciA9IHRhcmdldEFuZ2xlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKGJhbGwuYW5nbGVXaXRoUGxheWVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub3JtYWxpemVBbmdsZShhbmdsZSkge1xuICAgICAgICB3aGlsZSAoYW5nbGUgPiBNYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSAtPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoYW5nbGUgPCAtTWF0aC5QSSkge1xuICAgICAgICAgICAgYW5nbGUgKz0gMiAqIE1hdGguUEk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCA9IDI1MDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1pbkdvYWxEaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTA7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBiYWxsLmJhbGxQb3dlclNob3Quc2hvdWxkTW92ZVRvR29hbCgpKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSk7XG4gICAgICAgIGlmIChkaXN0YW5jZSA+IHRoaXMubWluR29hbERpc3RhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBkaXN0YW5jZTEgPSB0aGlzLmdldERpcmVjdGlvbkRpc3RhbmNlKGJhbGwsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgKyBNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlMiA9IHRoaXMuZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSAtIE1hdGguUEkgLyB0aGlzLmJhbGxSb3RhdGVPZmZzZXQpO1xuICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGJhbGwubWF4U3BlZWQgKlxuICAgICAgICAgICAgICAgIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuZ2V0U3BlZWRGYWN0b3IoYmFsbC5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdFR5cGUoKSksIGRpc3RhbmNlMSA8IGRpc3RhbmNlMlxuICAgICAgICAgICAgICAgID8gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSArXG4gICAgICAgICAgICAgICAgICAgIChNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KSAqIGRlbHRhTXNcbiAgICAgICAgICAgICAgICA6IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkgLVxuICAgICAgICAgICAgICAgICAgICAoTWF0aC5QSSAvIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCkgKiBkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXREaXJlY3Rpb25EaXN0YW5jZShiYWxsLCBiYWxsU3BlZWRBbmdsZSkge1xuICAgICAgICBjb25zdCBkZXN0aW5hdGlvblggPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArXG4gICAgICAgICAgICAoYmFsbC5iYWxsUG93ZXJTaG90LmdldFBvd2VyU2hvdERlc3RpbmF0aW9uU2lkZSgpID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUXG4gICAgICAgICAgICAgICAgPyAwXG4gICAgICAgICAgICAgICAgOiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpO1xuICAgICAgICBjb25zdCBkZXN0aW5hdGlvblkgPSB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMjtcbiAgICAgICAgbGV0IGRpc3QgPSBQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgbmV3IFBvaW50XzEuUG9pbnQoZGVzdGluYXRpb25YLCBkZXN0aW5hdGlvblkpKTtcbiAgICAgICAgY29uc3QgbmV3WCA9IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ICsgTWF0aC5jb3MoYmFsbFNwZWVkQW5nbGUpICogZGlzdDtcbiAgICAgICAgY29uc3QgbmV3WSA9IGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ICsgTWF0aC5zaW4oYmFsbFNwZWVkQW5nbGUpICogZGlzdDtcbiAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UobmV3IFBvaW50XzEuUG9pbnQobmV3WCwgbmV3WSksIG5ldyBQb2ludF8xLlBvaW50KGRlc3RpbmF0aW9uWCwgZGVzdGluYXRpb25ZKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneSA9IE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuc2V0Rm9yU3RhcnRHYW1lKCk7XG4gICAgICAgIGJhbGwubW92ZShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChfYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVFVUSU9OKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPiAwKSB7XG4gICAgICAgICAgICBiYWxsLm1vdmUoZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBiYWxsLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ3B1TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBDcHVNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IDA7XG4gICAgICAgIHRoaXMucm90YXRlQW5nbGUgPSAwO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuY2VudGVyRmllbGRYID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDI7XG4gICAgICAgIHRoaXMuZ29hbE9mZnNldCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCAqIDAuNTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIHBsYXllci5pc0NwdSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBiYWxsID0gZ2FtZVdvcmxkLmJhbGw7XG4gICAgICAgIGNvbnN0IGF0dGFjaGVkUGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IHBsYXllci5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uUG9zaXRpb24gPSBudWxsO1xuICAgICAgICBpZiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblBvc2l0aW9uID0gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCAmJiBhdHRhY2hlZFBsYXllciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKCFhdHRhY2hlZFBsYXllci5pc0NwdSkge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9zaXRpb24gPSBhdHRhY2hlZFBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb25Qb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9zaXRpb24uYWNjZWxlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID4gdGhpcy5jZW50ZXJGaWVsZFgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDIpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdGF0ZUNwdShwbGF5ZXIsIGRlbHRhTXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyeUtpY2socGxheWVyLCBiYWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVzdGluYXRpb25Qb3NpdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBkZXN0aW5hdGlvblBvc2l0aW9uO1xuICAgICAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJvdGF0ZUNwdShwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMucm90YXRlRGlyZWN0aW9uID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IE1hdGgucmFuZG9tKCkgPCAwLjUgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZUFuZ2xlID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIChNYXRoLlBJIC8gNTAgLSBNYXRoLlBJIC8gMTAwKSArIE1hdGguUEkgLyAxMDApICogMC4wNztcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3BlZWQgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICBsZXQgYW5nbGUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgIHNwZWVkID0gc3BlZWQgKyBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICBhbmdsZSA9IGFuZ2xlICsgdGhpcy5yb3RhdGVEaXJlY3Rpb24gKiB0aGlzLnJvdGF0ZUFuZ2xlICogZGVsdGFNcztcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgdHJ5S2ljayhwbGF5ZXIsIGJhbGwpIHtcbiAgICAgICAgaWYgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54IDwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgY29uc3QgbSA9IChiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSAtIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggLSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBtICogKHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkgK1xuICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnk7XG4gICAgICAgICAgICBpZiAoeSA+PSB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nb2FsT2Zmc2V0ICYmXG4gICAgICAgICAgICAgICAgeSA8PSB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nb2FsT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgYmFsbC5raWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkNwdU1vdmVtZW50U3RyYXRlZ3kgPSBDcHVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uSE9SSVpPTlRBTCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLlZFUlRJQ0FMKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBob3Jpem9udGFsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19MRUZULCBLZXlzXzEuS2V5cy5BUlJPV19SSUdIVCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnksIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgdmVydGljYWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX1VQLCBLZXlzXzEuS2V5cy5BUlJPV19ET1dOKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgYXBwbHlBeGlzTW92ZW1lbnQoY3VycmVudFNwZWVkLCBhY2NlbGVyYXRpb24sIGRlbHRhTXMsIGtleSwgbmVnYXRpdmVLZXksIHBvc2l0aXZlS2V5KSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgaWYgKGtleSA9PT0gbmVnYXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkIC0gZGVsdGE7XG4gICAgICAgIGlmIChrZXkgPT09IHBvc2l0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCArIGRlbHRhO1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGN1cnJlbnRTcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhjdXJyZW50U3BlZWQpIC0gZGVsdGEsIDApO1xuICAgIH1cbn1cbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIE1lbnVNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICgoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpIC8gMjtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpIHtcbiAgICAgICAgICAgICAgICB4ICs9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB5ID0gKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodDtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHgsIHkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IE1lbnVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICh0aGlzLmlzUGxheWVyU3R1bm5lZER1cmluZ1BsYXkocGxheWVyLCBnYW1lV29ybGQpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNQbGF5ZXJMb3NlZEdhbWUocGxheWVyLCBnYW1lV29ybGQpKSk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUpIHtcbiAgICAgICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5mb3JjZVN0dW5uZWQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IHBsYXllci5jdXJyZW50TWF4U3BlZWQgLyA1KSB7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5kZWNyZW1lbnRTcGVlZChkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNwZWVkID0gcGxheWVyLmN1cnJlbnRNYXhTcGVlZCAvIDE1O1xuICAgICAgICAgICAgbGV0IGFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpO1xuICAgICAgICAgICAgYW5nbGUgPSBhbmdsZSArIChNYXRoLlBJIC8gMzApICogZGVsdGFNcyAqIDAuMDU7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChzcGVlZCwgYW5nbGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzUGxheWVyU3R1bm5lZER1cmluZ1BsYXkocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQpO1xuICAgIH1cbiAgICBoYXNQbGF5ZXJMb3NlZEdhbWUocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3Qgd2lubmluZ1BsYXllclNpZGUgPSBnYW1lV29ybGQuc2NvcmUuZ2V0V2lubmluZ1BsYXllclNpZGUoKTtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgJiZcbiAgICAgICAgICAgIHdpbm5pbmdQbGF5ZXJTaWRlICE9PSBudWxsICYmXG4gICAgICAgICAgICB3aW5uaW5nUGxheWVyU2lkZSAhPT0gcGxheWVyLnNpZGUpO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3kgPSBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5zdWJQb3NpdGlvbnNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCB0aGlzLmdldFN1YnN0aXR1dGlvbkRlc3RpbmF0aW9ucyhQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKSk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgdGhpcy5nZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRVVElPTiAmJlxuICAgICAgICAgICAgIXBsYXllci5pc1N1YnN0aXR1dGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyRGVzdGluYXRpb25Qb2ludE1hcC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTGlzdCA9IHRoaXMuc3ViUG9zaXRpb25zTWFwLmdldChwbGF5ZXIuc2lkZSk7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvbkxpc3QgPT09IHVuZGVmaW5lZCB8fCBkZXN0aW5hdGlvbkxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uUG9pbnQgPSB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuZ2V0KHBsYXllcik7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvblBvaW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9pbnQgPSBkZXN0aW5hdGlvbkxpc3RbMF07XG4gICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgZGVzdGluYXRpb25Qb2ludCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IChwbGF5ZXIubm9ybWFsTWF4U3BlZWQgKiAyKSAvIDM7XG4gICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KGRlc3RpbmF0aW9uUG9pbnQucG9pbnQsIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9pbnQuYWN0aW9uKHBsYXllciwgZ2FtZVdvcmxkKTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gZGVzdGluYXRpb25MaXN0LmZpbmRJbmRleChkZXN0aW5hdGlvblBvaW50ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUG9pbnRfMS5Qb2ludC5hcmVQb2ludEVxdWFscyhkZXN0aW5hdGlvblBvaW50LnBvaW50LCBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4IDwgZGVzdGluYXRpb25MaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgZGVzdGluYXRpb25MaXN0W2luZGV4ICsgMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW5kZXggPj0gZGVzdGluYXRpb25MaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgbmV3IFBvaW50V2l0aEFjdGlvbihwbGF5ZXIuaW5pdGlhbFBvc2l0aW9uLCAoKSA9PiB7IH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMocGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICA/IHRoaXMuZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WFxuICAgICAgICAgICAgICAgIDogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5nYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG5ldyBQb2ludFdpdGhBY3Rpb24obmV3IFBvaW50XzEuUG9pbnQoeCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgLyAyKSwgKCkgPT4geyB9KSxcbiAgICAgICAgICAgIG5ldyBQb2ludFdpdGhBY3Rpb24obmV3IFBvaW50XzEuUG9pbnQoeCwgdGhpcy5nYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQpLCAocGxheWVyLCBnYW1lV29ybGQpID0+IHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuc3dpdGNoUGxheWVyQ29sb3IocGxheWVyLnNpZGUpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgUG9pbnRXaXRoQWN0aW9uKG5ldyBQb2ludF8xLlBvaW50KHgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLSB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyKSwgKCkgPT4geyB9KSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5leHBvcnRzLlN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneSA9IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneTtcbmNsYXNzIFBvaW50V2l0aEFjdGlvbiB7XG4gICAgY29uc3RydWN0b3IocG9pbnQsIGFjdGlvbikge1xuICAgICAgICB0aGlzLnBvaW50ID0gcG9pbnQ7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHBsYXllci5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuc2NvcmUuZ2V0V2lubmluZ1BsYXllclNpZGUoKSA9PT0gcGxheWVyLnNpZGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IHkgPSAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoeCwgeSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPVxuICAgICAgICAgICAgICAgIHBsYXllci5ub3JtYWxNYXhTcGVlZCAqIDIgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgdHNfYnVzXzEgPSByZXF1aXJlKFwidHMtYnVzXCIpO1xuY29uc3QgRXZlbnRCdXNVdGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9FdmVudEJ1c1V0aWxpdGllc1wiKTtcbmNvbnN0IEJhbGxfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9CYWxsXCIpO1xuY29uc3QgRXhwbG9zaW9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRXhwbG9zaW9uXCIpO1xuY29uc3QgRmlyZXdvcmtzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRmlyZXdvcmtzXCIpO1xuY29uc3QgR2F0ZV8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0dhdGVcIik7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBHYW1lU3RhdHVzTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyXCIpO1xuY29uc3QgU2NvcmVNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvU2NvcmVNYW5hZ2VyXCIpO1xuY2xhc3MgR2FtZVdvcmxkIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ29hbFBvc3RzID0gbmV3IEdvYWxQb3N0c18xLkdvYWxQb3N0cyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuYmFsbCA9IG5ldyBCYWxsXzEuQmFsbChnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gbmV3IEZpcmV3b3Jrc18xLkZpcmV3b3JrcyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9uID0gbmV3IEV4cGxvc2lvbl8xLkV4cGxvc2lvbihnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZ2F0ZXMgPSBuZXcgR2F0ZV8xLkdhdGUoKTtcbiAgICAgICAgY29uc3QgYnVzID0gbmV3IHRzX2J1c18xLkV2ZW50QnVzKCk7XG4gICAgICAgIHRoaXMuc2NvcmUgPSBuZXcgU2NvcmVNYW5hZ2VyXzEuU2NvcmVNYW5hZ2VyKCk7XG4gICAgICAgIGNvbnN0IHBsYXlJbWcgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgICAgICB0aGlzLm1lbnVCdXR0b24gPSBuZXcgTWVudUJ1dHRvbl8xLk1lbnVCdXR0b24oZ2FtZUNvbmZpZ3MsIHBsYXlJbWcud2lkdGgsIHBsYXlJbWcuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlciA9IG5ldyBHYW1lU3RhdHVzTWFuYWdlcl8xLkdhbWVTdGF0dXNNYW5hZ2VyKGJ1cyk7XG4gICAgICAgIGJ1cy5zdWJzY3JpYmUoRXZlbnRCdXNVdGlsaXRpZXNfMS5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5wYXlsb2FkID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldEVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICB0aGlzLnNjb3JlLmluY3JlYXNlU2NvcmUocGxheWVyU2lkZSk7XG4gICAgICAgIGlmICh0aGlzLnNjb3JlLmlzU3Vic3RpdHV0aW9uVGltZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUVVRJT04pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHBsYXllci5yZXNldE9uR29hbCgpO1xuICAgICAgICAgICAgcGxheWVyLnBvd2VyU2hvdFdyYXBwZXIudXBkYXRlU2NvcmVkR29hbChwbGF5ZXJTaWRlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmJhbGwuYmFsbFBvd2VyU2hvdC5pc1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgdGhpcy5leHBsb3Npb24uYWRkRXhwbG9zaW9uKHRoaXMuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLmJhbGwuYmFsbFBvd2VyU2hvdC5nZXRQb3dlclNob3RUeXBlKCkgPz8gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFR5cGUuRklSRSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWxsLnJlc2V0T25Hb2FsKCk7XG4gICAgICAgIGlmICh0aGlzLnNjb3JlLmlzR2FtZU92ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FKTtcbiAgICAgICAgICAgIHRoaXMuZmlyZXdvcmtzLmluaXRGaXJld29ya3MoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIuc2NoZWR1bGVTdGF0dXNDaGFuZ2UoRmlyZXdvcmtzXzEuRmlyZXdvcmtzLmFuaW1hdGlvblRpbWUsIEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5yZXNldFBvd2VyU2hvdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3dpdGNoUGxheWVyQ29sb3IocGxheWVyU2lkZSkge1xuICAgICAgICB0aGlzLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwbGF5ZXIuc2lkZSA9PT0gcGxheWVyU2lkZTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiBwbGF5ZXIuc3dpdGNoQ29sb3JJbmRleCgpKTtcbiAgICB9XG4gICAgcmVzZXRFbmRHYW1lKCkge1xuICAgICAgICB0aGlzLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4gcGxheWVyLnJlc2V0T25Hb2FsKCkpO1xuICAgICAgICB0aGlzLmJhbGwucmVzZXRPbkdvYWwoKTtcbiAgICAgICAgdGhpcy5zY29yZS5yZXNldCgpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVdvcmxkID0gR2FtZVdvcmxkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gdm9pZCAwO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uL2dhbWUvZW51bXMvS2V5c1wiKTtcbmNsYXNzIEtleWJvYXJkSW5wdXRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcmVzc2VkS2V5cyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5vbktleURvd24gPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuYWRkKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMub25LZXlVcCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkS2V5cy5kZWxldGUoZXZlbnQua2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleURvd24pO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5vbktleVVwKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleURvd24pO1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5vbktleVVwKTtcbiAgICB9XG4gICAgaXNLZXlQcmVzc2VkKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wcmVzc2VkS2V5cy5oYXMoa2V5KTtcbiAgICB9XG4gICAgZ2V0RGlyZWN0aW9uUHJlc3NlZChkaXJlY3Rpb24pIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgdGhpcy5wcmVzc2VkS2V5cykge1xuICAgICAgICAgICAgaWYgKEtleXNfMS5LZXlzVXRpbGl0aWVzLmdldEtleURpcmVjdGlvbihrZXkpID09PSBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuS2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBLZXlib2FyZElucHV0TWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Nb3VzZUlucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2FtZS9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIE1vdXNlSW5wdXRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgICAgIHRoaXMubW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Nb3VzZU1vdmUgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludChldmVudC5jbGllbnRYIC0gcmVjdC5sZWZ0LCBldmVudC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uQ2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmlzTW91c2VQcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2xpY2spO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2xpY2spO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgIH1cbn1cbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSBNb3VzZUlucHV0TWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NYWluUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgQmFsbFJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9CYWxsUmVuZGVyXCIpO1xuY29uc3QgQmFsbFRyYWplY3RvcnlSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvQmFsbFRyYWplY3RvcnlSZW5kZXJcIik7XG5jb25zdCBFeHBsb3Npb25SZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvRXhwbG9zaW9uUmVuZGVyXCIpO1xuY29uc3QgRmllbGRSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvRmllbGRSZW5kZXJcIik7XG5jb25zdCBGaXJld29ya3NSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvRmlyZXdvcmtzUmVuZGVyXCIpO1xuY29uc3QgR2F0ZXNSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvR2F0ZXNSZW5kZXJcIik7XG5jb25zdCBNZW51UmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL01lbnVSZW5kZXJcIik7XG5jb25zdCBQbGF5ZXJQb3dlclNob3RSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvUGxheWVyUG93ZXJTaG90UmVuZGVyXCIpO1xuY29uc3QgUGxheWVyUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL1BsYXllclJlbmRlclwiKTtcbmNvbnN0IFNjb3JlUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL1Njb3JlUmVuZGVyXCIpO1xuY2xhc3MgTWFpblJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMucmVuZGVycyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLmRvbUhhbmRsZXIgPSBkb21IYW5kbGVyO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgRmllbGRSZW5kZXJfMS5GaWVsZFJlbmRlcihkb21IYW5kbGVyLmJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEJhbGxUcmFqZWN0b3J5UmVuZGVyXzEuQmFsbFRyYWplY3RvcnlSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IFNjb3JlUmVuZGVyXzEuU2NvcmVSZW5kZXIoZG9tSGFuZGxlci5zY29yZUNvbnRleHQsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBHYXRlc1JlbmRlcl8xLkdhdGVzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBQbGF5ZXJSZW5kZXJfMS5QbGF5ZXJSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBCYWxsUmVuZGVyXzEuQmFsbFJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgRXhwbG9zaW9uUmVuZGVyXzEuRXhwbG9zaW9uUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IE1lbnVSZW5kZXJfMS5NZW51UmVuZGVyKGRvbUhhbmRsZXIubWVudUNvbnRleHQsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBQbGF5ZXJQb3dlclNob3RSZW5kZXJfMS5QbGF5ZXJQb3dlclNob3RSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgYXNzZXRMb2FkZXIsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBGaXJld29ya3NSZW5kZXJfMS5GaXJld29ya3NSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCkpO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLmZvckVhY2gocmVuZGVyID0+IHJlbmRlci5yZW5kZXIoZ2FtZVdvcmxkKSk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuZG9tSGFuZGxlci5nYW1lQ2FudmFzLndpZHRoLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWFpblJlbmRlciA9IE1haW5SZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgQmFsbFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMubWF4UmVzaXplRmFjdG9yID0gMjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbCA9IGdhbWVXb3JsZC5iYWxsO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HIHx8XG4gICAgICAgICAgICAoKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwgfHxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgfHxcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVFVUSU9OKSAmJlxuICAgICAgICAgICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpID4gMCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54LCBiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpKTtcbiAgICAgICAgICAgIGxldCByZXNpemVGYWN0b3IgPSAxO1xuICAgICAgICAgICAgaWYgKGJhbGwuYmFsbFN0YXR1cyAhPT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQpIHtcbiAgICAgICAgICAgICAgICByZXNpemVGYWN0b3IgPVxuICAgICAgICAgICAgICAgICAgICAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgLyBiYWxsLm1heFNwZWVkKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5tYXhSZXNpemVGYWN0b3IgLSAxKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zY2FsZShyZXNpemVGYWN0b3IsIDEpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFkgPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYzMzMzXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsQm9yZGVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzMzMDAwMFwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxSZW5kZXIgPSBCYWxsUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxUcmFqZWN0b3J5UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgQmFsbFRyYWplY3RvcnlSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy50cmFqZWN0b3J5TWF4RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDM7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbCA9IGdhbWVXb3JsZC5iYWxsO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiMxMTExMTFcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzExMTExMVwiO1xuICAgICAgICBiYWxsLnBvc2l0aW9uSGlzdG9yeS5wb3NpdGlvbnMuZm9yRWFjaCgocG9zaXRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPCBiYWxsLnBvc2l0aW9uSGlzdG9yeS5wb3NpdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQb3NpdGlvbiA9IGJhbGwucG9zaXRpb25IaXN0b3J5LnBvc2l0aW9uc1tpbmRleCArIDFdO1xuICAgICAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKHBvc2l0aW9uLnBvc2l0aW9uLCBuZXh0UG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFqZWN0b3J5TWF4RGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5nbG9iYWxBbHBoYSA9IDEgLSBiYWxsLnBvc2l0aW9uSGlzdG9yeS5nZXRGYWN0b3IoaW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRoQm9yZGVyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb3NpdGlvbi5wb3NpdGlvbi54LCBwb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8obmV4dFBvc2l0aW9uLnBvc2l0aW9uLngsIG5leHRQb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxUcmFqZWN0b3J5UmVuZGVyID0gQmFsbFRyYWplY3RvcnlSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRXhwbG9zaW9uUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRXhwbG9zaW9uUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgZXhwbG9zaW9uID0gZ2FtZVdvcmxkLmV4cGxvc2lvbjtcbiAgICAgICAgZXhwbG9zaW9uLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgeCA9IGV4cGxvc2lvbi5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnQuYW5nbGUpICogY29tcG9uZW50LmdldEZhY3RvcigpICogZXhwbG9zaW9uLm1heERpc3RhbmNlO1xuICAgICAgICAgICAgY29uc3QgeSA9IGV4cGxvc2lvbi5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnQuYW5nbGUpICogY29tcG9uZW50LmdldEZhY3RvcigpICogZXhwbG9zaW9uLm1heERpc3RhbmNlO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9ICgxIC0gY29tcG9uZW50LmdldEZhY3RvcigpKSAqIGV4cGxvc2lvbi5tYXhTaXplO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoeCwgeSwgc2l6ZSwgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gY29tcG9uZW50LmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRXhwbG9zaW9uUmVuZGVyID0gRXhwbG9zaW9uUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmllbGRSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGJhY2tncm91bmRDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5hbHJlYWR5UmVuZGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5maWVsZEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJmaWVsZC5wbmdcIik7XG4gICAgICAgIHRoaXMuZ29hbEltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJnb2FsX2ZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy50cmFja0ZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInRyYWNrLmpwZ1wiKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dCA9IGJhY2tncm91bmRDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgaWYgKHRoaXMuYWxyZWFkeVJlbmRlcmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLnJlbmRlckJhY2tncm91bmQoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJBdGhsZXRpY1RyYWNrKCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRYID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgIHRoaXMucmVuZGVyQm9yZGVyKCk7XG4gICAgICAgIHRoaXMucmVuZGVyR29hbFBvc3RzKGdhbWVXb3JsZCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IHRydWU7XG4gICAgfVxuICAgIHJlbmRlckJhY2tncm91bmQoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMuZ29hbEltYWdlLCAwLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0KTtcbiAgICB9XG4gICAgcmVuZGVyQm9yZGVyKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmNwdVN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQucmVjdCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICogMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplICogMik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgIH1cbiAgICByZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjQUFBQUFBXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBnYW1lV29ybGQuZ29hbFBvc3RzLnJhZGl1cywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJBdGhsZXRpY1RyYWNrKCkge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnRyYWNrRmllbGRJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmF0aGxldGljVHJhY2tZT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja0hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWVsZFJlbmRlciA9IEZpZWxkUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkZpcmV3b3Jrc1JlbmRlciA9IHZvaWQgMDtcbmNsYXNzIEZpcmV3b3Jrc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5maXJld29ya3MuZmlyZXdvcmtzLmZvckVhY2goZmlyZXdvcmsgPT4ge1xuICAgICAgICAgICAgaWYgKGZpcmV3b3JrLmlzRmlyaW5nKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpcmV3b3JrKGZpcmV3b3JrLCBnYW1lV29ybGQuZmlyZXdvcmtzLmxpbmVXaWR0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJGaXJld29yayhmaXJld29yaywgbGluZVdpZHRoKSB7XG4gICAgICAgIGZpcmV3b3JrLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGVuZ2h0ID0gZmlyZXdvcmsuZ2V0TGVuZ2h0KCk7XG4gICAgICAgICAgICBjb25zdCB0aW1lRmFjdG9yID0gZmlyZXdvcmsuZ2V0VGltZUZhY3RvcigpO1xuICAgICAgICAgICAgY29uc3QgeDEgPSBmaXJld29yay5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdIC0gY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeTEgPSBmaXJld29yay5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdIC0gY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeDIgPSBmaXJld29yay5wb3NpdGlvbi54ICtcbiAgICAgICAgICAgICAgICBNYXRoLmNvcyhjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdICsgY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgY29uc3QgeTIgPSBmaXJld29yay5wb3NpdGlvbi55ICtcbiAgICAgICAgICAgICAgICBNYXRoLnNpbihjb21wb25lbnRbXCJhbmdsZVwiXSkgKlxuICAgICAgICAgICAgICAgICAgICAodGltZUZhY3RvciAqIGNvbXBvbmVudFtcImRpc3RhbmNlXCJdICsgY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKiBsZW5naHQpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSBsaW5lV2lkdGg7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gY29tcG9uZW50W1wiY29sb3JcIl07XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhNYXRoLnJvdW5kKHgxKSwgTWF0aC5yb3VuZCh5MSkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8oTWF0aC5yb3VuZCh4MiksIE1hdGgucm91bmQoeTIpKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtzUmVuZGVyID0gRmlyZXdvcmtzUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgR2F0ZXNSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBhbmdsZSA9IGdhbWVXb3JsZC5nYXRlcy5jdXJyZW50QW5nbGU7XG4gICAgICAgIHRoaXMucmVuZGVyU2luZ2xlR2F0ZShhbmdsZSwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgICAgIHRoaXMucmVuZGVyU2luZ2xlR2F0ZShNYXRoLlBJIC0gYW5nbGUsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIpO1xuICAgIH1cbiAgICByZW5kZXJTaW5nbGVHYXRlKGFuZ2xlLCB4KSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShhbmdsZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVjdCgtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyLCB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhdGVzUmVuZGVyID0gR2F0ZXNSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWVudVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBNZW51UmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihtZW51Q29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5ob3ZlckZhY3RvciA9IDEuMztcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dCA9IG1lbnVDb250ZXh0O1xuICAgICAgICB0aGlzLnBsYXlJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwicGxheS5wbmdcIik7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5tZW51Q29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMubWVudUNvbnRleHQuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuTUVOVSkge1xuICAgICAgICAgICAgY29uc3Qgc2NhbGUgPSAxICsgKHRoaXMuaG92ZXJGYWN0b3IgLSAxKSAqIGdhbWVXb3JsZC5tZW51QnV0dG9uLmhvdmVyUHJvZ3Jlc3M7XG4gICAgICAgICAgICBjb25zdCB3aWR0aCA9IGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCAqIHNjYWxlO1xuICAgICAgICAgICAgdGhpcy5tZW51Q29udGV4dC5kcmF3SW1hZ2UodGhpcy5wbGF5SW1hZ2UsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnggLVxuICAgICAgICAgICAgICAgICh3aWR0aCAtIGdhbWVXb3JsZC5tZW51QnV0dG9uLmRpbWVuc2lvbi53aWR0aCkgLyAyLCBnYW1lV29ybGQubWVudUJ1dHRvbi5wb3NpdGlvbi55IC1cbiAgICAgICAgICAgICAgICAoaGVpZ2h0IC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLmhlaWdodCkgLyAyLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuTWVudVJlbmRlciA9IE1lbnVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyUG93ZXJTaG90UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgRWxlY3RyaWNQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRWxlY3RyaWNQb3dlclNob3RcIik7XG5jb25zdCBGaXJlUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0ZpcmVQb3dlclNob3RcIik7XG5jbGFzcyBQbGF5ZXJQb3dlclNob3RSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBhc3NldExvYWRlciwgZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5jZWxsc1BlclJvdyA9IDQ7XG4gICAgICAgIHRoaXMuY2VsbHNQZXJDb2x1bW4gPSA0O1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHROdW1iZXIgPSAzO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5mbGFtZUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJSZWRQYXJ0aWNsZS5wbmdcIik7XG4gICAgICAgIHRoaXMuY2VsbFdpZHRoID0gdGhpcy5mbGFtZUltYWdlLndpZHRoIC8gdGhpcy5jZWxsc1BlclJvdztcbiAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5mbGFtZUltYWdlLmhlaWdodCAvIHRoaXMuY2VsbHNQZXJDb2x1bW47XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgY29uc3QgcG93ZXJTaG90RW50aXRpZXMgPSBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5wb3dlclNob3RFbnRpdGllcztcbiAgICAgICAgICAgIHBvd2VyU2hvdEVudGl0aWVzLmZvckVhY2gocG93ZXJTaG90RW50aXR5ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocG93ZXJTaG90RW50aXR5LnNob3VsZFJlbmRlcihwbGF5ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3dlclNob3RFbnRpdHkgaW5zdGFuY2VvZiBGaXJlUG93ZXJTaG90XzEuRmlyZVBvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJGaXJlUG93ZXJTaG90KHBvd2VyU2hvdEVudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocG93ZXJTaG90RW50aXR5IGluc3RhbmNlb2YgRWxlY3RyaWNQb3dlclNob3RfMS5FbGVjdHJpY1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJFbGVjdHJpY1Bvd2VyU2hvdChwbGF5ZXIsIHBvd2VyU2hvdEVudGl0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckZpcmVQb3dlclNob3QoZmlyZVBvd2VyU2hvdCkge1xuICAgICAgICBmaXJlUG93ZXJTaG90LmZsYW1lcy5mb3JFYWNoKGZsYW1lID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNpemUgPSBmbGFtZS5nZXREdXJhdGlvbkZhY3RvcigpICogKGZpcmVQb3dlclNob3QubWF4U2l6ZSAtIGZpcmVQb3dlclNob3QubWluU2l6ZSkgK1xuICAgICAgICAgICAgICAgIGZpcmVQb3dlclNob3QubWluU2l6ZTtcbiAgICAgICAgICAgIGNvbnN0IGFscGhhID0gMSAtIGZsYW1lLmdldER1cmF0aW9uRmFjdG9yKCk7XG4gICAgICAgICAgICBjb25zdCByb3dJbmRleCA9IE1hdGguZmxvb3IoZmxhbWUuaW5kZXggLyB0aGlzLmNlbGxzUGVyUm93KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbHVtbkluZGV4ID0gZmxhbWUuaW5kZXggJSB0aGlzLmNlbGxzUGVyUm93O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gYWxwaGE7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmZsYW1lSW1hZ2UsIHRoaXMuY2VsbFdpZHRoICogcm93SW5kZXgsIHRoaXMuY2VsbEhlaWdodCAqIGNvbHVtbkluZGV4LCB0aGlzLmNlbGxXaWR0aCwgdGhpcy5jZWxsSGVpZ2h0LCBNYXRoLnJvdW5kKGZsYW1lLnBvc2l0aW9uLnggLSBzaXplIC8gMiksIE1hdGgucm91bmQoZmxhbWUucG9zaXRpb24ueSAtIHNpemUgLyAyKSwgTWF0aC5yb3VuZChzaXplKSwgTWF0aC5yb3VuZChzaXplKSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckVsZWN0cmljUG93ZXJTaG90KHBsYXllciwgZWxlY3RyaWNQb3dlclNob3QpIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50ID0gdGhpcy5nYW1lQ29udGV4dC5jcmVhdGVSYWRpYWxHcmFkaWVudChwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyIC8gNSwgcG9zaXRpb24ueCwgcG9zaXRpb24ueSwgdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aEJvcmRlcik7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCBcIiNGRkZGRkZcIik7XG4gICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCBcInRyYW5zcGFyZW50XCIpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShwb3NpdGlvbi54LCBwb3NpdGlvbi55KTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoZWxlY3RyaWNQb3dlclNob3QuYW5nbGVPZmZzZXQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGlnaHRuaW5nQm9sdE51bWJlcjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShNYXRoLlBJIC8gdGhpcy5saWdodG5pbmdCb2x0TnVtYmVyKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAwLjU7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRTaXplIC0gMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnQgPSBlbGVjdHJpY1Bvd2VyU2hvdC5saWdodG5pbmdCb2x0UG9pbnRBcnJheVtqXTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0UG9pbnQgPSBlbGVjdHJpY1Bvd2VyU2hvdC5saWdodG5pbmdCb2x0UG9pbnRBcnJheVtqICsgMV07XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGVsZWN0cmljUG93ZXJTaG90LmJpZ0xpbmVXaWR0aDtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVUbyhuZXh0UG9pbnQueCwgbmV4dFBvaW50LnkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlY3RyaWNQb3dlclNob3Qud2hpdGVMaW5lVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGVsZWN0cmljUG93ZXJTaG90LmxpbmVXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5tb3ZlVG8ocG9pbnQueCwgcG9pbnQueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVRvKG5leHRQb2ludC54LCBuZXh0UG9pbnQueSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyUG93ZXJTaG90UmVuZGVyID0gUGxheWVyUG93ZXJTaG90UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY2xhc3MgUGxheWVyUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSB7XG4gICAgICAgIHRoaXMuY29sb3JNYXAgPSBuZXcgTWFwKFtcbiAgICAgICAgICAgIFtcIkxFRlQtMFwiLCBcIiMwMDgwMDBcIl0sXG4gICAgICAgICAgICBbXCJMRUZULTFcIiwgXCIjMzM4MDg4XCJdLFxuICAgICAgICAgICAgW1wiUklHSFQtMFwiLCBcIiNGRkE1MDBcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0xXCIsIFwiI0ZGRkYwMFwiXSxcbiAgICAgICAgXSk7XG4gICAgICAgIHRoaXMuc3R1bm5lZENvbG9yID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSBcIiMwMDMzMDBcIjtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuc3RhckltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJzdGFyLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5zdGFyTWF4U2l6ZSA9IHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc3RhcnRNYXhEaXN0YW5jZSA9IHRoaXMuc3Rhck1heFNpemUgKiA1O1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgY29sb3JLZXkgPSBgJHtwbGF5ZXIuc2lkZX0tJHtwbGF5ZXIuY29sb3JJbmRleH1gO1xuICAgICAgICAgICAgY29uc3QgaXNTdHVubmVkID0gcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQ7XG4gICAgICAgICAgICBsZXQgY29sb3IgPSBpc1N0dW5uZWQgPyB0aGlzLnN0dW5uZWRDb2xvciA6IHRoaXMuY29sb3JNYXAuZ2V0KGNvbG9yS2V5KTtcbiAgICAgICAgICAgIGlmIChjb2xvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSBcIiNGRjAwMDBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXJDb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dCbHVyO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KSwgTWF0aC5yb3VuZChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IHBsYXllci5ib3VuY2VXcmFwcGVyLmdldEJvdW5jaW5nQW1wbGl0dWRlKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNjYWxlKDEgLSBzY2FsZSwgMSArIHNjYWxlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYygwLCAwLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zaXplLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICAgICAgaWYgKGlzU3R1bm5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyU3R1bm5lZFN0YXJzKHBsYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW5kZXJTdHVubmVkU3RhcnMocGxheWVyKSB7XG4gICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5zdHVubmVkU3RhcnMuc3RhcnMuZm9yRWFjaChzdGFyID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICAgICAgY29uc3QgZmFjdG9yID0gc3Rhci5nZXRGYWN0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHggPSBzdGFyLnBvc2l0aW9uLnggKyBNYXRoLmNvcyhzdGFyLmRpcmVjdGlvbikgKiAoZmFjdG9yICogdGhpcy5zdGFydE1heERpc3RhbmNlKTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBzdGFyLnBvc2l0aW9uLnkgKyBNYXRoLnNpbihzdGFyLmRpcmVjdGlvbikgKiAoZmFjdG9yICogdGhpcy5zdGFydE1heERpc3RhbmNlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHgsIHkpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yb3RhdGUoc3Rhci5hbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gMSAtIGZhY3RvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3RhckltYWdlLCAtdGhpcy5zdGFyTWF4U2l6ZSAvIDIsIC10aGlzLnN0YXJNYXhTaXplIC8gMiwgdGhpcy5zdGFyTWF4U2l6ZSwgdGhpcy5zdGFyTWF4U2l6ZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJSZW5kZXIgPSBQbGF5ZXJSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU2NvcmVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKHNjb3JlQ29udGV4dCwgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5mcmFtZUZvck51bWJlciA9IDY7XG4gICAgICAgIHRoaXMudG90YWxOdW1iZXJzID0gOTtcbiAgICAgICAgdGhpcy50b3RhbEFuaW1hdGlvblRpbWUgPSAzMDA7XG4gICAgICAgIHRoaXMuZnJhbWVUaW1lID0gdGhpcy50b3RhbEFuaW1hdGlvblRpbWUgLyB0aGlzLmZyYW1lRm9yTnVtYmVyO1xuICAgICAgICB0aGlzLnNjb3JlRnJhbWVzID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dCA9IHNjb3JlQ29udGV4dDtcbiAgICAgICAgdGhpcy5kaWdpdHNJbWFnZXMgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImRpZ2l0cy5wbmdcIik7XG4gICAgICAgIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnModGhpcy5kaWdpdHNJbWFnZXMud2lkdGgsIHRoaXMuZGlnaXRzSW1hZ2VzLmhlaWdodCAvICh0aGlzLnRvdGFsTnVtYmVycyAqIHRoaXMuZnJhbWVGb3JOdW1iZXIgKyAxKSk7XG4gICAgICAgIGNvbnN0IHNjb3JlSGVpZ2h0ID0gKHNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0ICogOSkgLyAxMDtcbiAgICAgICAgdGhpcy5zY29yZURpbWVuc2lvbnMgPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoKHNjb3JlSGVpZ2h0ICogdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucy53aWR0aCkgLyB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgc2NvcmVIZWlnaHQpO1xuICAgICAgICBjb25zdCB5UG9zaXRpb24gPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgLSB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpIC8gMjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkFycmF5ID0gW1xuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoMCwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoICogMiwgeVBvc2l0aW9uKSxcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHNjb3JlQ29udGV4dC5jYW52YXMud2lkdGggLSB0aGlzLnNjb3JlRGltZW5zaW9ucy53aWR0aCwgeVBvc2l0aW9uKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zY29yZUNvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29uc3Qgc2NvcmVBcnJheSA9IGdhbWVXb3JsZC5zY29yZS5nZXRTY29yZUFzQXJyYXkoKTtcbiAgICAgICAgc2NvcmVBcnJheS5mb3JFYWNoKChudW1iZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRGcmFtZSA9IG51bWJlciAqIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgICAgICBsZXQgZnJhbWVUb0RyYXcgPSB0YXJnZXRGcmFtZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSAhPT0gdGFyZ2V0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RlcCA9IE1hdGguZmxvb3IoZ2FtZVdvcmxkLnNjb3JlLmdldExhc3RVcGRhdGVEdXJhdGlvbigpIC8gdGhpcy5mcmFtZVRpbWUpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSA+IHRhcmdldEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgKj0gMjtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVUb0RyYXcgPSBNYXRoLm1heCh0YXJnZXRGcmFtZSwgdGhpcy5zY29yZUZyYW1lc1tpbmRleF0gLSBzdGVwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lVG9EcmF3ID0gTWF0aC5taW4odGFyZ2V0RnJhbWUsIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdICsgc3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmcmFtZVRvRHJhdyA9PT0gdGFyZ2V0RnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY29yZUZyYW1lc1tpbmRleF0gPSB0YXJnZXRGcmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjb3JlQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5kaWdpdHNJbWFnZXMsIDAsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0ICogZnJhbWVUb0RyYXcsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdLngsIHRoaXMucG9zaXRpb25BcnJheVtpbmRleF0ueSwgdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU2NvcmVSZW5kZXIgPSBTY29yZVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Eb21IYW5kbGVyID0gdm9pZCAwO1xuY2xhc3MgRG9tSGFuZGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIFt0aGlzLmJhY2tncm91bmRDYW52YXMsIHRoaXMuYmFja2dyb3VuZENvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJiYWNrZ3JvdW5kQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5zY29yZUNhbnZhcywgdGhpcy5zY29yZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJzY29yZUNhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuZ2FtZUNhbnZhcywgdGhpcy5nYW1lQ29udGV4dF0gPSBEb21IYW5kbGVyLmdldENhbnZhcyhcImdhbWVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLm1lbnVDYW52YXMsIHRoaXMubWVudUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJtZW51Q2FudmFzXCIpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0Q2FudmFzKGlkKSB7XG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gbm90IGZvdW5kYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGlmICghY29udGV4dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2lkfSBjb250ZXh0IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbY2FudmFzLCBjb250ZXh0XTtcbiAgICB9XG59XG5leHBvcnRzLkRvbUhhbmRsZXIgPSBEb21IYW5kbGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSB2b2lkIDA7XG5jbGFzcyBVSUludGVyYWN0aW9uU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgfVxuICAgIHVwZGF0ZShob3ZlcmFibGUsIG9uQ2xpY2ssIGRlbHRhTXMpIHtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyZWQgPSBob3ZlcmFibGUuY29udGFpbnModGhpcy5pbnB1dC5tb3VzZVBvc2l0aW9uKTtcbiAgICAgICAgaWYgKGhvdmVyYWJsZS5ob3ZlcmVkICYmIHRoaXMuaW5wdXQuaXNNb3VzZVByZXNzZWQpIHtcbiAgICAgICAgICAgIG9uQ2xpY2soKTtcbiAgICAgICAgICAgIHRoaXMuaW5wdXQucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGVwID0gKGRlbHRhTXMgLyBob3ZlcmFibGUuZ2V0VHJhbnNpdGlvblRpbWUoKSkgKiAoaG92ZXJhYmxlLmhvdmVyZWQgPyAxIDogLTEpO1xuICAgICAgICBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIGhvdmVyYWJsZS5ob3ZlclByb2dyZXNzICsgc3RlcCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuVUlJbnRlcmFjdGlvblN5c3RlbSA9IFVJSW50ZXJhY3Rpb25TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRXZlbnRCdXNVdGlsaXRpZXMgPSB2b2lkIDA7XG5jb25zdCB0c19idXNfMSA9IHJlcXVpcmUoXCJ0cy1idXNcIik7XG5jbGFzcyBFdmVudEJ1c1V0aWxpdGllcyB7XG59XG5leHBvcnRzLkV2ZW50QnVzVXRpbGl0aWVzID0gRXZlbnRCdXNVdGlsaXRpZXM7XG5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQgPSAoMCwgdHNfYnVzXzEuY3JlYXRlRXZlbnREZWZpbml0aW9uKSgpKFwic3RhdHVzQ2hhbmdlZFwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lQ29uZmlncyA9IHZvaWQgMDtcbmNsYXNzIEdhbWVDb25maWdzIHtcbiAgICBjb25zdHJ1Y3RvcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMucGxheWVyQm9yZGVyID0gMjtcbiAgICAgICAgdGhpcy5iYWxsQm9yZGVyID0gMTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0ICogNC41KSAvIDYpO1xuICAgICAgICB0aGlzLmZpZWxkWE9mZnNldCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAvIDE2KTtcbiAgICAgICAgdGhpcy5maWVsZFdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC0gdGhpcy5maWVsZFhPZmZzZXQgKiAyKTtcbiAgICAgICAgdGhpcy5nb2FsSGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gNSk7XG4gICAgICAgIHRoaXMuZ29hbFlPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmZpZWxkSGVpZ2h0IC0gdGhpcy5nb2FsSGVpZ2h0KSAvIDIpO1xuICAgICAgICB0aGlzLmdvYWxQb3N0UmFkaXVzID0gTWF0aC5yb3VuZCh0aGlzLmdvYWxIZWlnaHQgLyAyMCk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCA9IE1hdGgucm91bmQoKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQpICogNSkgLyA3KTtcbiAgICAgICAgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCA9IE1hdGgucm91bmQoKHRoaXMuaGVpZ2h0IC0gdGhpcy5maWVsZEhlaWdodCAtIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciA9IE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAvIDI4KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLnBsYXllckJvcmRlcjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkV2lkdGggLyA0KTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdWJzdGl0dXRpb25YID0gdGhpcy5maWVsZFhPZmZzZXQgKyB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIHRoaXMuY3B1U3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgKHRoaXMuZmllbGRXaWR0aCAtIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCk7XG4gICAgICAgIHRoaXMuc2hhZG93Qmx1ciA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgIHRoaXMuc2hhZG93T2Zmc2V0ID0gdGhpcy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAqIDAuMztcbiAgICAgICAgdGhpcy5maWVsZEJvcmRlclNpemUgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyAxMDApO1xuICAgICAgICB0aGlzLnBsYXllclN0YXJ0UG9zaXRpb25YT2Zmc2V0ID0gdGhpcy5maWVsZFdpZHRoIC8gODtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWU9mZnNldCA9IHRoaXMuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGVTdGFydFBvc2l0aW9uWU9mZnNldCA9XG4gICAgICAgICAgICB0aGlzLmZpZWxkSGVpZ2h0ICsgdGhpcy5hdGhsZXRpY1RyYWNrWU9mZnNldCArIHRoaXMuYXRobGV0aWNUcmFja0hlaWdodCAvIDI7XG4gICAgICAgIHRoaXMuZ2F0ZXNMZW5ndGggPSB0aGlzLnBsYXllclNpemVXaXRoQm9yZGVyICogMy41O1xuICAgICAgICB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDgwKTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLmJhbGxTaXplV2l0aG91dEJvcmRlciArIHRoaXMuYmFsbEJvcmRlcjtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVDb25maWdzID0gR2FtZUNvbmZpZ3M7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEFzc2V0TG9hZGVyXzEgPSByZXF1aXJlKFwiLi9hc3NldHMvQXNzZXRMb2FkZXJcIik7XG5jb25zdCBHYW1lTG9vcF8xID0gcmVxdWlyZShcIi4vY29yZS9HYW1lTG9vcFwiKTtcbmNvbnN0IERvbUhhbmRsZXJfMSA9IHJlcXVpcmUoXCIuL3VpL0RvbUhhbmRsZXJcIik7XG5jb25zdCBHYW1lQ29uZmlnc18xID0gcmVxdWlyZShcIi4vdXRpbHMvR2FtZUNvbmZpZ3NcIik7XG5jbGFzcyBNYWluIHtcbiAgICBhc3luYyBpbml0KCkge1xuICAgICAgICBjb25zdCBhc3NldExvYWRlciA9IG5ldyBBc3NldExvYWRlcl8xLkFzc2V0TG9hZGVyKCk7XG4gICAgICAgIGF3YWl0IGFzc2V0TG9hZGVyLmluaXQoKTtcbiAgICAgICAgY29uc3QgZG9tSGFuZGxlciA9IG5ldyBEb21IYW5kbGVyXzEuRG9tSGFuZGxlcigpO1xuICAgICAgICBjb25zdCBnYW1lQ29uZmlncyA9IG5ldyBHYW1lQ29uZmlnc18xLkdhbWVDb25maWdzKGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy53aWR0aCwgZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY2xvc2VMb2FkaW5nV2luZG93KCk7XG4gICAgICAgIGNvbnN0IGdhbWVMb29wID0gbmV3IEdhbWVMb29wXzEuR2FtZUxvb3AoZ2FtZUNvbmZpZ3MsIGRvbUhhbmRsZXIsIGFzc2V0TG9hZGVyKTtcbiAgICAgICAgZ2FtZUxvb3AubWFpbigpO1xuICAgIH1cbiAgICBjbG9zZUxvYWRpbmdXaW5kb3coKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvYWRpbmdEaXZcIik7XG4gICAgICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IFwiMFwiO1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFuc2l0aW9uZW5kXCIsIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQpO1xuICAgICAgICAgICAgLy9kb21IYW5kbGVyLm1lbnVDYW52YXMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgfSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbn1cbmNvbnN0IG1haW4gPSBuZXcgTWFpbigpO1xubWFpbi5pbml0KCk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=
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
        this.bouncingStartTime = 0;
        this.bounceTime = 2000;
        this.bounceMaxAmplitude = 0.5;
        this.bounceExponentialFactor = 0.00346;
        this.bounceNumber = 5;
    }
    startBouncing() {
        if (this.getBouncingProgress() > this.bounceTime / 2) {
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
                ball.detachFromPlayer();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUixxREFBcUQsWUFBWTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsbURBQW1ELHNCQUFzQjtBQUN6RTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLFdBQVc7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFFBQVE7QUFDNUI7QUFDQTtBQUNBLHNDQUFzQyxPQUFPO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsUUFBUTtBQUM5QjtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFFBQVE7QUFDNUI7QUFDQSxzQ0FBc0MsT0FBTztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBLDRCQUE0QjtBQUM1QixRQUFRO0FBQ1I7QUFDQTtBQUNBLE1BQU07QUFBYTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixRQUFRO0FBQzVCO0FBQ0Esd0NBQXdDLE9BQU87QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsUUFBUTtBQUM1QjtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixRQUFRO0FBQzVCO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsNkNBQTZDO0FBQzdDLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLG9CQUFvQjtBQUN0QztBQUNBO0FBQ0Esc0JBQXNCLG9CQUFvQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsWUFBWTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLFlBQVk7QUFDekI7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMi9saWIvZXZlbnRlbWl0dGVyMi5qcyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9ub2RlX21vZHVsZXMvdHMtYnVzL0V2ZW50QnVzLmpzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL25vZGVfbW9kdWxlcy90cy1idXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2Fzc2V0cy9Bc3NldExvYWRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvY29yZS9HYW1lTG9vcC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9CYWxsLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL0V4cGxvc2lvbi50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9GaXJld29ya3MudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvR2F0ZS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9Hb2FsUG9zdHMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvSG92ZXJhYmxlRW50aXR5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL01lbnVCdXR0b24udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvUGxheWVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL2JvdW5jZS9Cb3VuY2VXcmFwcGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvQmFsbFBvd2VyU2hvdC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL0VsZWN0cmljUG93ZXJTaG90LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRmlyZVBvd2VyU2hvdC50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnRpdGllcy9wb3dlclNob3RzL1Bvd2VyU2hvdFdyYXBwZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvc3R1bm5lZC9TdHVubmVkU3RhcnMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW50aXRpZXMvc3R1bm5lZC9TdHVubmVkV3JhcHBlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9CYWxsU3RhdHVzLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL0dhbWVTdGF0dXMudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZW51bXMvS2V5cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9QbGF5ZXJTaWRlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2VudW1zL1BsYXllclN0YXR1cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9lbnVtcy9Qb3dlclNob3RUeXBlLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L0JvcmRlckxpbWl0cy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9nZW9tZXRyeS9EaW1lbnNpb25zLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL2dlb21ldHJ5L01vdmVtZW50UG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9pbnQudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvZ2VvbWV0cnkvUG9zaXRpb25IaXN0b3J5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL21hbmFnZXJzL1Njb3JlTWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL0dhdGVTeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9NYWluU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY2hlY2tlcnMvQ2hlY2tlclN5c3RlbS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NoZWNrZXJzL3N0cmF0ZWdpZXMvU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY2hlY2tlcnMvc3RyYXRlZ2llcy9XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9Db2xsaXNpb25TeXN0ZW0udHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL2NvbGxpc2lvbi9zdHJhdGVnaWVzL0JhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9CYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvY29sbGlzaW9uL3N0cmF0ZWdpZXMvUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9jb2xsaXNpb24vc3RyYXRlZ2llcy9QbGF5ZXJDb2xsaXNpb25TdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L01vdmVtZW50U3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9iYWxsU3RyYXRlZ2llcy9QbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvYmFsbFN0cmF0ZWdpZXMvV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL0NwdU1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9JbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvc3lzdGVtcy9tb3ZlbWVudC9wbGF5ZXJzU3RyYXRlZ2llcy9NZW51TW92ZW1lbnRTdHJhdGVneS50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvZ2FtZS9zeXN0ZW1zL21vdmVtZW50L3BsYXllcnNTdHJhdGVnaWVzL1N0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5LnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9nYW1lL3N5c3RlbXMvbW92ZW1lbnQvcGxheWVyc1N0cmF0ZWdpZXMvV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3kudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL2dhbWUvd29ybGQvR2FtZVdvcmxkLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9pbnB1dC9LZXlib2FyZElucHV0TWFuYWdlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvaW5wdXQvTW91c2VJbnB1dE1hbmFnZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9NYWluUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9CYWxsUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9CYWxsVHJhamVjdG9yeVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvRXhwbG9zaW9uUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9GaWVsZFJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvRmlyZXdvcmtzUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9HYXRlc1JlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvTWVudVJlbmRlci50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvcmVuZGVyaW5nL2ltcGwvUGxheWVyUG93ZXJTaG90UmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9yZW5kZXJpbmcvaW1wbC9QbGF5ZXJSZW5kZXIudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyLy4vc3JjL3JlbmRlcmluZy9pbXBsL1Njb3JlUmVuZGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9Eb21IYW5kbGVyLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91aS9VSUludGVyYWN0aW9uU3lzdGVtLnRzIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy91dGlscy9FdmVudEJ1c1V0aWxpdGllcy50cyIsIndlYnBhY2s6Ly9pbnNhbmVzb2NjZXIvLi9zcmMvdXRpbHMvR2FtZUNvbmZpZ3MudHMiLCJ3ZWJwYWNrOi8vaW5zYW5lc29jY2VyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2luc2FuZXNvY2Nlci8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxyXG4gKiBFdmVudEVtaXR0ZXIyXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWoxbngvRXZlbnRFbWl0dGVyMlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgaGlqMW54XHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuICovXHJcbjshZnVuY3Rpb24odW5kZWZpbmVkKSB7XHJcblxyXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBfaXNBcnJheShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xyXG4gIH07XHJcbiAgdmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcclxuXHJcbiAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgaWYgKHRoaXMuX2NvbmYpIHtcclxuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb25maWd1cmUoY29uZikge1xyXG4gICAgaWYgKGNvbmYpIHtcclxuICAgICAgdGhpcy5fY29uZiA9IGNvbmY7XHJcblxyXG4gICAgICBjb25mLmRlbGltaXRlciAmJiAodGhpcy5kZWxpbWl0ZXIgPSBjb25mLmRlbGltaXRlcik7XHJcbiAgICAgIHRoaXMuX21heExpc3RlbmVycyA9IGNvbmYubWF4TGlzdGVuZXJzICE9PSB1bmRlZmluZWQgPyBjb25mLm1heExpc3RlbmVycyA6IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XHJcblxyXG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XHJcbiAgICAgIGNvbmYubmV3TGlzdGVuZXIgJiYgKHRoaXMuX25ld0xpc3RlbmVyID0gY29uZi5uZXdMaXN0ZW5lcik7XHJcbiAgICAgIGNvbmYucmVtb3ZlTGlzdGVuZXIgJiYgKHRoaXMuX3JlbW92ZUxpc3RlbmVyID0gY29uZi5yZW1vdmVMaXN0ZW5lcik7XHJcbiAgICAgIGNvbmYudmVyYm9zZU1lbW9yeUxlYWsgJiYgKHRoaXMudmVyYm9zZU1lbW9yeUxlYWsgPSBjb25mLnZlcmJvc2VNZW1vcnlMZWFrKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lclRyZWUgPSB7fTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID0gZGVmYXVsdE1heExpc3RlbmVycztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhayhjb3VudCwgZXZlbnROYW1lKSB7XHJcbiAgICB2YXIgZXJyb3JNc2cgPSAnKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXHJcbiAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICcgKyBjb3VudCArICcgbGlzdGVuZXJzIGFkZGVkLiAnICtcclxuICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJztcclxuXHJcbiAgICBpZih0aGlzLnZlcmJvc2VNZW1vcnlMZWFrKXtcclxuICAgICAgZXJyb3JNc2cgKz0gJyBFdmVudCBuYW1lOiAnICsgZXZlbnROYW1lICsgJy4nO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLmVtaXRXYXJuaW5nKXtcclxuICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoZXJyb3JNc2cpO1xyXG4gICAgICBlLm5hbWUgPSAnTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nJztcclxuICAgICAgZS5lbWl0dGVyID0gdGhpcztcclxuICAgICAgZS5jb3VudCA9IGNvdW50O1xyXG4gICAgICBwcm9jZXNzLmVtaXRXYXJuaW5nKGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvck1zZyk7XHJcblxyXG4gICAgICBpZiAoY29uc29sZS50cmFjZSl7XHJcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoY29uZikge1xyXG4gICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICB0aGlzLl9uZXdMaXN0ZW5lciA9IGZhbHNlO1xyXG4gICAgdGhpcy5fcmVtb3ZlTGlzdGVuZXIgPSBmYWxzZTtcclxuICAgIHRoaXMudmVyYm9zZU1lbW9yeUxlYWsgPSBmYWxzZTtcclxuICAgIGNvbmZpZ3VyZS5jYWxsKHRoaXMsIGNvbmYpO1xyXG4gIH1cclxuICBFdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjsgLy8gYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZm9yIGV4cG9ydGluZyBFdmVudEVtaXR0ZXIgcHJvcGVydHlcclxuXHJcbiAgLy9cclxuICAvLyBBdHRlbnRpb24sIGZ1bmN0aW9uIHJldHVybiB0eXBlIG5vdyBpcyBhcnJheSwgYWx3YXlzICFcclxuICAvLyBJdCBoYXMgemVybyBlbGVtZW50cyBpZiBubyBhbnkgbWF0Y2hlcyBmb3VuZCBhbmQgb25lIG9yIG1vcmVcclxuICAvLyBlbGVtZW50cyAobGVhZnMpIGlmIHRoZXJlIGFyZSBtYXRjaGVzXHJcbiAgLy9cclxuICBmdW5jdGlvbiBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIGkpIHtcclxuICAgIGlmICghdHJlZSkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgICB2YXIgbGlzdGVuZXJzPVtdLCBsZWFmLCBsZW4sIGJyYW5jaCwgeFRyZWUsIHh4VHJlZSwgaXNvbGF0ZWRCcmFuY2gsIGVuZFJlYWNoZWQsXHJcbiAgICAgICAgdHlwZUxlbmd0aCA9IHR5cGUubGVuZ3RoLCBjdXJyZW50VHlwZSA9IHR5cGVbaV0sIG5leHRUeXBlID0gdHlwZVtpKzFdO1xyXG4gICAgaWYgKGkgPT09IHR5cGVMZW5ndGggJiYgdHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIGF0IHRoZSBlbmQgb2YgdGhlIGV2ZW50KHMpIGxpc3QgYW5kIHRoZSB0cmVlIGhhcyBsaXN0ZW5lcnNcclxuICAgICAgLy8gaW52b2tlIHRob3NlIGxpc3RlbmVycy5cclxuICAgICAgLy9cclxuICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVycyk7XHJcbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGxlYWYgPSAwLCBsZW4gPSB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoOyBsZWFmIDwgbGVuOyBsZWFmKyspIHtcclxuICAgICAgICAgIGhhbmRsZXJzICYmIGhhbmRsZXJzLnB1c2godHJlZS5fbGlzdGVuZXJzW2xlYWZdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICgoY3VycmVudFR5cGUgPT09ICcqJyB8fCBjdXJyZW50VHlwZSA9PT0gJyoqJykgfHwgdHJlZVtjdXJyZW50VHlwZV0pIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgdGhlIGV2ZW50IGVtaXR0ZWQgaXMgJyonIGF0IHRoaXMgcGFydFxyXG4gICAgICAvLyBvciB0aGVyZSBpcyBhIGNvbmNyZXRlIG1hdGNoIGF0IHRoaXMgcGF0Y2hcclxuICAgICAgLy9cclxuICAgICAgaWYgKGN1cnJlbnRUeXBlID09PSAnKicpIHtcclxuICAgICAgICBmb3IgKGJyYW5jaCBpbiB0cmVlKSB7XHJcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gICAgICB9IGVsc2UgaWYoY3VycmVudFR5cGUgPT09ICcqKicpIHtcclxuICAgICAgICBlbmRSZWFjaGVkID0gKGkrMSA9PT0gdHlwZUxlbmd0aCB8fCAoaSsyID09PSB0eXBlTGVuZ3RoICYmIG5leHRUeXBlID09PSAnKicpKTtcclxuICAgICAgICBpZihlbmRSZWFjaGVkICYmIHRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgLy8gVGhlIG5leHQgZWxlbWVudCBoYXMgYSBfbGlzdGVuZXJzLCBhZGQgaXQgdG8gdGhlIGhhbmRsZXJzLlxyXG4gICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIHR5cGVMZW5ndGgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoYnJhbmNoIGluIHRyZWUpIHtcclxuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcclxuICAgICAgICAgICAgaWYoYnJhbmNoID09PSAnKicgfHwgYnJhbmNoID09PSAnKionKSB7XHJcbiAgICAgICAgICAgICAgaWYodHJlZVticmFuY2hdLl9saXN0ZW5lcnMgJiYgIWVuZFJlYWNoZWQpIHtcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIHR5cGVMZW5ndGgpKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMikpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIE5vIG1hdGNoIG9uIHRoaXMgb25lLCBzaGlmdCBpbnRvIHRoZSB0cmVlIGJ1dCBub3QgaW4gdGhlIHR5cGUgYXJyYXkuXHJcbiAgICAgICAgICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbYnJhbmNoXSwgaSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2N1cnJlbnRUeXBlXSwgaSsxKSk7XHJcbiAgICB9XHJcblxyXG4gICAgeFRyZWUgPSB0cmVlWycqJ107XHJcbiAgICBpZiAoeFRyZWUpIHtcclxuICAgICAgLy9cclxuICAgICAgLy8gSWYgdGhlIGxpc3RlbmVyIHRyZWUgd2lsbCBhbGxvdyBhbnkgbWF0Y2ggZm9yIHRoaXMgcGFydCxcclxuICAgICAgLy8gdGhlbiByZWN1cnNpdmVseSBleHBsb3JlIGFsbCBicmFuY2hlcyBvZiB0aGUgdHJlZVxyXG4gICAgICAvL1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHhUcmVlLCBpKzEpO1xyXG4gICAgfVxyXG5cclxuICAgIHh4VHJlZSA9IHRyZWVbJyoqJ107XHJcbiAgICBpZih4eFRyZWUpIHtcclxuICAgICAgaWYoaSA8IHR5cGVMZW5ndGgpIHtcclxuICAgICAgICBpZih4eFRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGxpc3RlbmVyIG9uIGEgJyoqJywgaXQgd2lsbCBjYXRjaCBhbGwsIHNvIGFkZCBpdHMgaGFuZGxlci5cclxuICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEJ1aWxkIGFycmF5cyBvZiBtYXRjaGluZyBuZXh0IGJyYW5jaGVzIGFuZCBvdGhlcnMuXHJcbiAgICAgICAgZm9yKGJyYW5jaCBpbiB4eFRyZWUpIHtcclxuICAgICAgICAgIGlmKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHh4VHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcclxuICAgICAgICAgICAgICAvLyBXZSBrbm93IHRoZSBuZXh0IGVsZW1lbnQgd2lsbCBtYXRjaCwgc28ganVtcCB0d2ljZS5cclxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVticmFuY2hdLCBpKzIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBjdXJyZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgbm9kZSBtYXRjaGVzLCBtb3ZlIGludG8gdGhlIHRyZWUuXHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaCA9IHt9O1xyXG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoW2JyYW5jaF0gPSB4eFRyZWVbYnJhbmNoXTtcclxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHsgJyoqJzogaXNvbGF0ZWRCcmFuY2ggfSwgaSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgYW5kIHN0aWxsIG9uIGEgJyoqJ1xyXG4gICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgfSBlbHNlIGlmKHh4VHJlZVsnKiddICYmIHh4VHJlZVsnKiddLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVsnKiddLCB0eXBlTGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBncm93TGlzdGVuZXJUcmVlKHR5cGUsIGxpc3RlbmVyKSB7XHJcblxyXG4gICAgdHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG5cclxuICAgIC8vXHJcbiAgICAvLyBMb29rcyBmb3IgdHdvIGNvbnNlY3V0aXZlICcqKicsIGlmIHNvLCBkb24ndCBhZGQgdGhlIGV2ZW50IGF0IGFsbC5cclxuICAgIC8vXHJcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0eXBlLmxlbmd0aDsgaSsxIDwgbGVuOyBpKyspIHtcclxuICAgICAgaWYodHlwZVtpXSA9PT0gJyoqJyAmJiB0eXBlW2krMV0gPT09ICcqKicpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHJlZSA9IHRoaXMubGlzdGVuZXJUcmVlO1xyXG4gICAgdmFyIG5hbWUgPSB0eXBlLnNoaWZ0KCk7XHJcblxyXG4gICAgd2hpbGUgKG5hbWUgIT09IHVuZGVmaW5lZCkge1xyXG5cclxuICAgICAgaWYgKCF0cmVlW25hbWVdKSB7XHJcbiAgICAgICAgdHJlZVtuYW1lXSA9IHt9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0cmVlID0gdHJlZVtuYW1lXTtcclxuXHJcbiAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICBpZiAoIXRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gbGlzdGVuZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzID0gW3RyZWUuX2xpc3RlbmVyc107XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xyXG5cclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgIXRyZWUuX2xpc3RlbmVycy53YXJuZWQgJiZcclxuICAgICAgICAgICAgdGhpcy5fbWF4TGlzdGVuZXJzID4gMCAmJlxyXG4gICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoID4gdGhpcy5fbWF4TGlzdGVuZXJzXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhay5jYWxsKHRoaXMsIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgsIG5hbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXHJcbiAgLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXHJcbiAgLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXHJcbiAgLy9cclxuICAvLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3NcclxuICAvLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5kZWxpbWl0ZXIgPSAnLic7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xyXG4gICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xyXG4gICAgICBpZiAoIXRoaXMuX2NvbmYpIHRoaXMuX2NvbmYgPSB7fTtcclxuICAgICAgdGhpcy5fY29uZi5tYXhMaXN0ZW5lcnMgPSBuO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnQgPSAnJztcclxuXHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uY2UoZXZlbnQsIGZuLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kT25jZUxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb25jZShldmVudCwgZm4sIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX29uY2UgPSBmdW5jdGlvbihldmVudCwgZm4sIHByZXBlbmQpIHtcclxuICAgIHRoaXMuX21hbnkoZXZlbnQsIDEsIGZuLCBwcmVwZW5kKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWFueShldmVudCwgdHRsLCBmbiwgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWFueShldmVudCwgdHRsLCBmbiwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYW55ID0gZnVuY3Rpb24oZXZlbnQsIHR0bCwgZm4sIHByZXBlbmQpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFueSBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XHJcbiAgICAgIGlmICgtLXR0bCA9PT0gMCkge1xyXG4gICAgICAgIHNlbGYub2ZmKGV2ZW50LCBsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXIuX29yaWdpbiA9IGZuO1xyXG5cclxuICAgIHRoaXMuX29uKGV2ZW50LCBsaXN0ZW5lciwgcHJlcGVuZCk7XHJcblxyXG4gICAgcmV0dXJuIHNlbGY7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5fbmV3TGlzdGVuZXIpIHtcclxuICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgYWwgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgdmFyIGFyZ3MsbCxpLGo7XHJcbiAgICB2YXIgaGFuZGxlcjtcclxuXHJcbiAgICBpZiAodGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGgpIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2FsbC5zbGljZSgpO1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCk7XHJcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGFsOyBqKyspIGFyZ3Nbal0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBoYW5kbGVyID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgLy8gbmVlZCB0byBtYWtlIGNvcHkgb2YgaGFuZGxlcnMgYmVjYXVzZSBsaXN0IGNhbiBjaGFuZ2UgaW4gdGhlIG1pZGRsZVxyXG4gICAgICAgIC8vIG9mIGVtaXQgY2FsbFxyXG4gICAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLmxlbmd0aCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICghdGhpcy5fYWxsICYmIHR5cGUgPT09ICdlcnJvcicpIHtcclxuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XHJcbiAgICAgICAgdGhyb3cgYXJndW1lbnRzWzFdOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICEhdGhpcy5fYWxsO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdEFzeW5jID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5fbmV3TGlzdGVuZXIpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtmYWxzZV0pOyB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHByb21pc2VzPSBbXTtcclxuXHJcbiAgICB2YXIgYWwgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgdmFyIGFyZ3MsbCxpLGo7XHJcbiAgICB2YXIgaGFuZGxlcjtcclxuXHJcbiAgICBpZiAodGhpcy5fYWxsKSB7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5fYWxsLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmNhbGwodGhpcywgdHlwZSwgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uYXBwbHkodGhpcywgYXJncykpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXIsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICBjYXNlIDE6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcykpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDI6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgMzpcclxuICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICBmb3IgKGogPSAxOyBqIDwgYWw7IGorKykgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChoYW5kbGVyICYmIGhhbmRsZXIubGVuZ3RoKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBoYW5kbGVyLnNsaWNlKCk7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoIXRoaXMuX2FsbCAmJiB0eXBlID09PSAnZXJyb3InKSB7XHJcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChhcmd1bWVudHNbMV0pOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb24odHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fb24odHlwZSwgbGlzdGVuZXIsIHRydWUpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25BbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgcmV0dXJuIHRoaXMuX29uQW55KGZuLCBmYWxzZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kQW55ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIHJldHVybiB0aGlzLl9vbkFueShmbiwgdHJ1ZSk7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuX29uQW55ID0gZnVuY3Rpb24oZm4sIHByZXBlbmQpe1xyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX2FsbCkge1xyXG4gICAgICB0aGlzLl9hbGwgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxyXG4gICAgaWYocHJlcGVuZCl7XHJcbiAgICAgIHRoaXMuX2FsbC51bnNoaWZ0KGZuKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLl9hbGwucHVzaChmbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLl9vbiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyLCBwcmVwZW5kKSB7XHJcbiAgICBpZiAodHlwZW9mIHR5cGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5fb25BbnkodHlwZSwgbGlzdGVuZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignb24gb25seSBhY2NlcHRzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxyXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cclxuICAgIGlmICh0aGlzLl9uZXdMaXN0ZW5lcilcclxuICAgICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XHJcblxyXG4gICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgZ3Jvd0xpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcclxuICAgICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgLy8gQ2hhbmdlIHRvIGFycmF5LlxyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhZGRcclxuICAgICAgaWYocHJlcGVuZCl7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnVuc2hpZnQobGlzdGVuZXIpO1xyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXHJcbiAgICAgIGlmIChcclxuICAgICAgICAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCAmJlxyXG4gICAgICAgIHRoaXMuX21heExpc3RlbmVycyA+IDAgJiZcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gdGhpcy5fbWF4TGlzdGVuZXJzXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xyXG4gICAgICAgIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhay5jYWxsKHRoaXMsIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgsIHR5cGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaGFuZGxlcnMsbGVhZnM9W107XHJcblxyXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxyXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XHJcbiAgICAgIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICBsZWFmcy5wdXNoKHtfbGlzdGVuZXJzOmhhbmRsZXJzfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XHJcbiAgICAgIHZhciBsZWFmID0gbGVhZnNbaUxlYWZdO1xyXG4gICAgICBoYW5kbGVycyA9IGxlYWYuX2xpc3RlbmVycztcclxuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XHJcblxyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IC0xO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gaGFuZGxlcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmIChoYW5kbGVyc1tpXSA9PT0gbGlzdGVuZXIgfHxcclxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLmxpc3RlbmVyICYmIGhhbmRsZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcclxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLl9vcmlnaW4gJiYgaGFuZGxlcnNbaV0uX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocG9zaXRpb24gPCAwKSB7XHJcbiAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICAgIGxlYWYuX2xpc3RlbmVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5zcGxpY2UocG9zaXRpb24sIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcilcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIHR5cGUsIGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaGFuZGxlcnMgPT09IGxpc3RlbmVyIHx8XHJcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcclxuICAgICAgICAoaGFuZGxlcnMuX29yaWdpbiAmJiBoYW5kbGVycy5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcclxuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9yZW1vdmVMaXN0ZW5lcilcclxuICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIHR5cGUsIGxpc3RlbmVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3Qocm9vdCkge1xyXG4gICAgICBpZiAocm9vdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocm9vdCk7XHJcbiAgICAgIGZvciAodmFyIGkgaW4ga2V5cykge1xyXG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgIHZhciBvYmogPSByb290W2tleV07XHJcbiAgICAgICAgaWYgKChvYmogaW5zdGFuY2VvZiBGdW5jdGlvbikgfHwgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIpIHx8IChvYmogPT09IG51bGwpKVxyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdChyb290W2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgIGRlbGV0ZSByb290W2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHRoaXMubGlzdGVuZXJUcmVlKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZkFueSA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICB2YXIgaSA9IDAsIGwgPSAwLCBmbnM7XHJcbiAgICBpZiAoZm4gJiYgdGhpcy5fYWxsICYmIHRoaXMuX2FsbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcclxuICAgICAgZm9yKGkgPSAwLCBsID0gZm5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmKGZuID09PSBmbnNbaV0pIHtcclxuICAgICAgICAgIGZucy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyQW55XCIsIGZuKTtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm5zID0gdGhpcy5fYWxsO1xyXG4gICAgICBpZiAodGhpcy5fcmVtb3ZlTGlzdGVuZXIpIHtcclxuICAgICAgICBmb3IoaSA9IDAsIGwgPSBmbnMubGVuZ3RoOyBpIDwgbDsgaSsrKVxyXG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJBbnlcIiwgZm5zW2ldKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLl9hbGwgPSBbXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZjtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZiAodHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICF0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgdmFyIGxlYWZzID0gc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgbnVsbCwgbnMsIHRoaXMubGlzdGVuZXJUcmVlLCAwKTtcclxuXHJcbiAgICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xyXG4gICAgICAgIHZhciBsZWFmID0gbGVhZnNbaUxlYWZdO1xyXG4gICAgICAgIGxlYWYuX2xpc3RlbmVycyA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50cykge1xyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICB2YXIgaGFuZGxlcnMgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXJzLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgICByZXR1cm4gaGFuZGxlcnM7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XHJcbiAgICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xyXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl9ldmVudHMpO1xyXG4gIH1cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzKHR5cGUpLmxlbmd0aDtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyc0FueSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmKHRoaXMuX2FsbCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fYWxsO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cclxuICAgIGRlZmluZShmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcclxuICAgIH0pO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAvLyBDb21tb25KU1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgLy8gQnJvd3NlciBnbG9iYWwuXHJcbiAgICB3aW5kb3cuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcclxuICB9XHJcbn0oKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gVXNpbmcgRXZlbnRFbWl0dGVyMiBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHVzZSB3aWxkY2FyZHMgdG8gc3Vic2NyaWJlIHRvIGFsbCBldmVudHNcbnZhciBldmVudGVtaXR0ZXIyXzEgPSByZXF1aXJlKFwiZXZlbnRlbWl0dGVyMlwiKTtcbmZ1bmN0aW9uIHNob3dXYXJuaW5nKG1zZykge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgaWYgKHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzRXZlbnREZXNjcmlwdG9yKGRlc2NyaXB0b3IpIHtcbiAgICByZXR1cm4gISFkZXNjcmlwdG9yICYmIGRlc2NyaXB0b3IuZXZlbnRUeXBlO1xufVxuZnVuY3Rpb24gaXNQcmVkaWNhdGVGbihkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuICFpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSAmJiB0eXBlb2YgZGVzY3JpcHRvciA9PT0gXCJmdW5jdGlvblwiO1xufVxuZnVuY3Rpb24gY3JlYXRlRXZlbnREZWZpbml0aW9uKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgZnVuY3Rpb24gZXZlbnRDcmVhdG9yKHBheWxvYWQpIHtcbiAgICAgICAgICAgIC8vIEFsbG93IHJ1bnRpbWUgcGF5bG9hZCBjaGVja2luZyBmb3IgcGxhaW4gSmF2YVNjcmlwdCB1c2FnZVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgcGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZXN0Rm4gPSB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiID8gb3B0aW9ucyA6IG9wdGlvbnMudGVzdDtcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0Rm4gJiYgIXRlc3RGbihwYXlsb2FkKSkge1xuICAgICAgICAgICAgICAgICAgICBzaG93V2FybmluZyhKU09OLnN0cmluZ2lmeShwYXlsb2FkKSArIFwiIGRvZXMgbm90IG1hdGNoIGV4cGVjdGVkIHBheWxvYWQuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50Q3JlYXRvci5ldmVudFR5cGUgPSB0eXBlO1xuICAgICAgICBldmVudENyZWF0b3IudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0eXBlOyB9OyAvLyBhbGxvdyBTdHJpbmcgY29lcmNpb24gdG8gZGVsaXZlciB0aGUgZXZlbnRUeXBlXG4gICAgICAgIHJldHVybiBldmVudENyZWF0b3I7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlRXZlbnREZWZpbml0aW9uID0gY3JlYXRlRXZlbnREZWZpbml0aW9uO1xuZnVuY3Rpb24gZGVmaW5lRXZlbnQodHlwZSkge1xuICAgIHNob3dXYXJuaW5nKFwiZGVmaW5lRXZlbnQgaXMgZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBmdXR1cmUuIFBsZWFzZSB1c2UgY3JlYXRlRXZlbnREZWZpbml0aW9uIGluc3RlYWQuXCIpO1xuICAgIHZhciBldmVudENyZWF0b3IgPSBmdW5jdGlvbiAocGF5bG9hZCkgeyByZXR1cm4gKHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgcGF5bG9hZDogcGF5bG9hZFxuICAgIH0pOyB9O1xuICAgIGV2ZW50Q3JlYXRvci5ldmVudFR5cGUgPSB0eXBlO1xuICAgIHJldHVybiBldmVudENyZWF0b3I7XG59XG5leHBvcnRzLmRlZmluZUV2ZW50ID0gZGVmaW5lRXZlbnQ7XG5mdW5jdGlvbiBnZXRFdmVudFR5cGUoZGVzY3JpcHRvcikge1xuICAgIGlmIChpc0V2ZW50RGVzY3JpcHRvcihkZXNjcmlwdG9yKSlcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3IuZXZlbnRUeXBlO1xuICAgIHJldHVybiBkZXNjcmlwdG9yO1xufVxuZnVuY3Rpb24gZmlsdGVyKHByZWRpY2F0ZSwgaGFuZGxlcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShldmVudCkpXG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcihldmVudCk7XG4gICAgfTtcbn1cbnZhciBFdmVudEJ1cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudEJ1cygpIHtcbiAgICAgICAgdGhpcy5lbWl0dGVyID0gbmV3IGV2ZW50ZW1pdHRlcjJfMS5FdmVudEVtaXR0ZXIyKHsgd2lsZGNhcmQ6IHRydWUgfSk7XG4gICAgfVxuICAgIEV2ZW50QnVzLnByb3RvdHlwZS5wdWJsaXNoID0gZnVuY3Rpb24gKGV2ZW50LCBtZXRhKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KGV2ZW50LnR5cGUsICFtZXRhID8gZXZlbnQgOiBfX2Fzc2lnbih7fSwgZXZlbnQsIHsgbWV0YTogX19hc3NpZ24oe30sIGV2ZW50Lm1ldGEsIG1ldGEpIH0pKTtcbiAgICB9O1xuICAgIEV2ZW50QnVzLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uLCBoYW5kbGVyKSB7XG4gICAgICAgIC8vIHN0b3JlIGVtaXR0ZXIgb24gY2xvc3VyZVxuICAgICAgICB2YXIgZW1pdHRlciA9IHRoaXMuZW1pdHRlcjtcbiAgICAgICAgdmFyIHN1YnNjcmliZVRvU3ViZGVmID0gZnVuY3Rpb24gKHN1YmRlZikge1xuICAgICAgICAgICAgaWYgKGlzUHJlZGljYXRlRm4oc3ViZGVmKSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEhhbmRsZXJfMSA9IGZpbHRlcihzdWJkZWYsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGVtaXR0ZXIub24oXCIqKlwiLCBmaWx0ZXJlZEhhbmRsZXJfMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVtaXR0ZXIub2ZmKFwiKipcIiwgZmlsdGVyZWRIYW5kbGVyXzEpOyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHR5cGUgPSBnZXRFdmVudFR5cGUoc3ViZGVmKTtcbiAgICAgICAgICAgIGVtaXR0ZXIub24odHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gZW1pdHRlci5vZmYodHlwZSwgaGFuZGxlcik7IH07XG4gICAgICAgIH07XG4gICAgICAgIHZhciBzdWJzID0gQXJyYXkuaXNBcnJheShzdWJzY3JpcHRpb24pID8gc3Vic2NyaXB0aW9uIDogW3N1YnNjcmlwdGlvbl07XG4gICAgICAgIHZhciB1bnN1YnNjcmliZXJzID0gc3Vicy5tYXAoc3Vic2NyaWJlVG9TdWJkZWYpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gdW5zdWJzY3JpYmVycy5mb3JFYWNoKGZ1bmN0aW9uICh1KSB7IHJldHVybiB1KCk7IH0pOyB9O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50QnVzO1xufSgpKTtcbmV4cG9ydHMuRXZlbnRCdXMgPSBFdmVudEJ1cztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50QnVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIEV2ZW50QnVzXzEgPSByZXF1aXJlKFwiLi9FdmVudEJ1c1wiKTtcbmV4cG9ydHMuRXZlbnRCdXMgPSBFdmVudEJ1c18xLkV2ZW50QnVzO1xuZXhwb3J0cy5kZWZpbmVFdmVudCA9IEV2ZW50QnVzXzEuZGVmaW5lRXZlbnQ7XG5leHBvcnRzLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbiA9IEV2ZW50QnVzXzEuY3JlYXRlRXZlbnREZWZpbml0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkFzc2V0TG9hZGVyID0gdm9pZCAwO1xuY2xhc3MgQXNzZXRMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLklNQUdFX0ZPTERFUiA9IFwiaW1hZ2VzL1wiO1xuICAgICAgICB0aGlzLklNQUdFX05BTUVTID0gW1xuICAgICAgICAgICAgXCJiYWxscy5wbmdcIixcbiAgICAgICAgICAgIFwiZmllbGQucG5nXCIsXG4gICAgICAgICAgICBcInRyYWNrLmpwZ1wiLFxuICAgICAgICAgICAgXCJSZWRQYXJ0aWNsZS5wbmdcIixcbiAgICAgICAgICAgIFwiZGlnaXRzLnBuZ1wiLFxuICAgICAgICAgICAgXCJnb2FsX2ZpZWxkLnBuZ1wiLFxuICAgICAgICAgICAgXCJzdGFyLnBuZ1wiLFxuICAgICAgICAgICAgXCJwbGF5LnBuZ1wiLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmltYWdlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5JTUFHRV9OQU1FUy5tYXAoZmlsZU5hbWUgPT4gdGhpcy5sb2FkSW1hZ2UoZmlsZU5hbWUsIGAke3RoaXMuSU1BR0VfRk9MREVSfSR7ZmlsZU5hbWV9YCkpKTtcbiAgICB9XG4gICAgZ2V0SW1hZ2UoaW1hZ2VOYW1lKSB7XG4gICAgICAgIGNvbnN0IGltYWdlID0gdGhpcy5pbWFnZXMuZ2V0KGltYWdlTmFtZSk7XG4gICAgICAgIGlmIChpbWFnZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aW1hZ2VOYW1lfSBpbWFnZSBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfVxuICAgIGxvYWRJbWFnZShuYW1lLCBzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQobmFtZSwgaW1nKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldExvYWRlciA9IEFzc2V0TG9hZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhbWVMb29wID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1haW5TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi9nYW1lL3N5c3RlbXMvTWFpblN5c3RlbVwiKTtcbmNvbnN0IEdhbWVXb3JsZF8xID0gcmVxdWlyZShcIi4uL2dhbWUvd29ybGQvR2FtZVdvcmxkXCIpO1xuY29uc3QgTW91c2VJbnB1dE1hbmFnZXJfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9Nb3VzZUlucHV0TWFuYWdlclwiKTtcbmNvbnN0IE1haW5SZW5kZXJfMSA9IHJlcXVpcmUoXCIuLi9yZW5kZXJpbmcvTWFpblJlbmRlclwiKTtcbmNvbnN0IFVJSW50ZXJhY3Rpb25TeXN0ZW1fMSA9IHJlcXVpcmUoXCIuLi91aS9VSUludGVyYWN0aW9uU3lzdGVtXCIpO1xuY2xhc3MgR2FtZUxvb3Age1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnByZXZUaW1lID0gMDtcbiAgICAgICAgdGhpcy5tYWluUmVuZGVyID0gbmV3IE1haW5SZW5kZXJfMS5NYWluUmVuZGVyKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkID0gbmV3IEdhbWVXb3JsZF8xLkdhbWVXb3JsZChnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpO1xuICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0gPSBuZXcgVUlJbnRlcmFjdGlvblN5c3RlbV8xLlVJSW50ZXJhY3Rpb25TeXN0ZW0obmV3IE1vdXNlSW5wdXRNYW5hZ2VyXzEuTW91c2VJbnB1dE1hbmFnZXIoZG9tSGFuZGxlci5tZW51Q2FudmFzKSk7XG4gICAgICAgIHRoaXMubWFpblN5c3RlbSA9IG5ldyBNYWluU3lzdGVtXzEuTWFpblN5c3RlbShnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIG1haW4oKSB7XG4gICAgICAgIGNvbnN0IHRpY2sgPSAodGltZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldlRpbWUgIT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YSA9IHRpbWUgLSB0aGlzLnByZXZUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlSW5wdXRzKGRlbHRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucHJldlRpbWUgPSB0aW1lO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci51cGRhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLm1haW5TeXN0ZW0udXBkYXRlKHRoaXMuZ2FtZVdvcmxkLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuZ2FtZVdvcmxkLmZpcmV3b3Jrcy51cGRhdGUoZGVsdGEpO1xuICAgICAgICB0aGlzLmdhbWVXb3JsZC5leHBsb3Npb24udXBkYXRlKGRlbHRhKTtcbiAgICB9XG4gICAgdXBkYXRlSW5wdXRzKGRlbHRhKSB7XG4gICAgICAgIHRoaXMudWlJbnRlcmFjdGlvblN5c3RlbS51cGRhdGUodGhpcy5nYW1lV29ybGQubWVudUJ1dHRvbiwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5jaGFuZ2VTdGF0dXMoR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVXb3JsZC5maXJld29ya3MucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVpSW50ZXJhY3Rpb25TeXN0ZW0uaW5wdXQucmVzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVsdGEpO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMubWFpblJlbmRlci5yZW5kZXIodGhpcy5nYW1lV29ybGQpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZUxvb3AgPSBHYW1lTG9vcDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBQb3dlclNob3RUeXBlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUG93ZXJTaG90VHlwZVwiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IFBvc2l0aW9uSGlzdG9yeV8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1Bvc2l0aW9uSGlzdG9yeVwiKTtcbmNvbnN0IEJhbGxQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuL3Bvd2VyU2hvdHMvQmFsbFBvd2VyU2hvdFwiKTtcbmNsYXNzIEJhbGwge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmFuZ2xlV2l0aFBsYXllciA9IDA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkgPSBuZXcgUG9zaXRpb25IaXN0b3J5XzEuUG9zaXRpb25IaXN0b3J5KDUwMDApO1xuICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QgPSBuZXcgQmFsbFBvd2VyU2hvdF8xLkJhbGxQb3dlclNob3QoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSA9IGdhbWVDb25maWdzLmJhbGxTaXplV2l0aEJvcmRlcjtcbiAgICAgICAgdGhpcy5tYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNDAwO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uID0gdGhpcy5tYXhTcGVlZCAvIDIwMDA7XG4gICAgfVxuICAgIHNldEZvclN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzU2V0Rm9yU3RhcnQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKyB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2l6ZSk7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhTcGVlZCAtIHRoaXMubWF4U3BlZWQgLyAzLjMzKSArIHRoaXMubWF4U3BlZWQgLyAzLjMzO1xuICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLlBJIC8gMiArICgoTWF0aC5yYW5kb20oKSAqIE1hdGguUEkpIC8gNC41IC0gTWF0aC5QSSAvIDkpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKHNwZWVkLCBhbmdsZSk7XG4gICAgICAgICAgICB0aGlzLmlzU2V0Rm9yU3RhcnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuaXNTZXRGb3JTdGFydCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoMCwgMCk7XG4gICAgICAgIHRoaXMuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgICBtb3ZlKGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMuYmFsbFBvd2VyU2hvdC5pc1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkuYWRkUG9zaXRpb24obmV3IFBvaW50XzEuUG9pbnQodGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnVwZGF0ZVBvc2l0aW9uKGRlbHRhTXMpO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uZGVjcmVtZW50U3BlZWQoZGVsdGFNcyk7XG4gICAgICAgIGlmICh0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA8IHRoaXMubWF4U3BlZWQgLyAyKSB7XG4gICAgICAgICAgICB0aGlzLmJhbGxQb3dlclNob3QucmVzZXRQb3dlclNob3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVUcmFqZWN0b3J5KGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbkhpc3RvcnkudXBkYXRlKGRlbHRhTXMpO1xuICAgIH1cbiAgICBhdHRhY2hUb1BsYXllcihwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5hdHRhY2hlZFBsYXllciA9IHBsYXllcjtcbiAgICAgICAgdGhpcy5iYWxsU3RhdHVzID0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuQVRUQUNIRUQ7XG4gICAgICAgIHRoaXMuYW5nbGVXaXRoUGxheWVyID0gUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMocGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgIHRoaXMuYmFsbFBvd2VyU2hvdC5yZXNldFBvd2VyU2hvdCgpO1xuICAgIH1cbiAgICBkZXRhY2hGcm9tUGxheWVyKCkge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICBsZXQgc3BlZWRGYWN0b3IgPSAxO1xuICAgICAgICBpZiAodGhpcy5hdHRhY2hlZFBsYXllcj8ucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSkge1xuICAgICAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LmVuYWJsZVBvd2VyU2hvdCh0aGlzLmF0dGFjaGVkUGxheWVyKTtcbiAgICAgICAgICAgIHNwZWVkRmFjdG9yID0gUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5nZXRTcGVlZEZhY3Rvcih0aGlzLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90VHlwZSgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyPy5wb3dlclNob3RXcmFwcGVyLnJlc2V0UG93ZXJTaG90KCk7XG4gICAgICAgIHRoaXMuYXR0YWNoZWRQbGF5ZXIgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQodGhpcy5tYXhTcGVlZCAqIHNwZWVkRmFjdG9yLCB0aGlzLmFuZ2xlV2l0aFBsYXllcik7XG4gICAgfVxuICAgIHJlc2V0T25Hb2FsKCkge1xuICAgICAgICB0aGlzLmJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFO1xuICAgICAgICB0aGlzLmF0dGFjaGVkUGxheWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYWxsUG93ZXJTaG90LnJlc2V0UG93ZXJTaG90KCk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsID0gQmFsbDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FeHBsb3Npb25Db21wb25lbnQgPSBleHBvcnRzLkV4cGxvc2lvbiA9IHZvaWQgMDtcbmNvbnN0IFBvd2VyU2hvdFR5cGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9Qb3dlclNob3RUeXBlXCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEV4cGxvc2lvbiB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhDb21wb25lbnRzID0gNDA7XG4gICAgICAgIHRoaXMubWluQ29tcG9uZW50cyA9IDIwO1xuICAgICAgICB0aGlzLm1heFRpbWUgPSAxMDAwO1xuICAgICAgICB0aGlzLmNvbG9yT2Zmc2V0ID0gODA7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMubWF4U2l6ZSA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMjY7XG4gICAgICAgIHRoaXMubWF4RGlzdGFuY2UgPSB0aGlzLm1heFNpemUgKiAzO1xuICAgIH1cbiAgICBhZGRFeHBsb3Npb24ocG9zaXRpb24sIHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICBjb25zdCBudW1iZXJPZkNvbXBvbmVudHMgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhDb21wb25lbnRzIC0gdGhpcy5taW5Db21wb25lbnRzKSArIHRoaXMubWluQ29tcG9uZW50cyk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mQ29tcG9uZW50czsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbiA9IE1hdGgucmFuZG9tKCkgKiB0aGlzLm1heFRpbWU7XG4gICAgICAgICAgICBjb25zdCBhbmdsZSA9IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJICogMjtcbiAgICAgICAgICAgIGNvbnN0IGcgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgIGxldCByLCBiO1xuICAgICAgICAgICAgaWYgKHBvd2VyU2hvdFR5cGUgPT09IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RUeXBlLkZJUkUpIHtcbiAgICAgICAgICAgICAgICByID0gMjU1IC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5jb2xvck9mZnNldCk7XG4gICAgICAgICAgICAgICAgYiA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgciA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIHRoaXMuY29sb3JPZmZzZXQpO1xuICAgICAgICAgICAgICAgIGIgPSAyNTUgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLmNvbG9yT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gXCIjXCIgK1xuICAgICAgICAgICAgICAgIHIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSArXG4gICAgICAgICAgICAgICAgZy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpICtcbiAgICAgICAgICAgICAgICBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChuZXcgRXhwbG9zaW9uQ29tcG9uZW50KGR1cmF0aW9uLCBhbmdsZSwgY29sb3IpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIGNvbXBvbmVudC51cGRhdGUoZGVsdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gdGhpcy5jb21wb25lbnRzLmZpbHRlcihjb21wb25lbnQgPT4gIWNvbXBvbmVudC5pc0ZpbmlzaGVkKCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuRXhwbG9zaW9uID0gRXhwbG9zaW9uO1xuY2xhc3MgRXhwbG9zaW9uQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3RvcihkdXJhdGlvbiwgYW5nbGUsIGNvbG9yKSB7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuZGVsdGEgPSAwO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5kZWx0YSArPSBkZWx0YTtcbiAgICB9XG4gICAgaXNGaW5pc2hlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsdGEgPj0gdGhpcy5kdXJhdGlvbjtcbiAgICB9XG4gICAgZ2V0RmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWx0YSAvIHRoaXMuZHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5FeHBsb3Npb25Db21wb25lbnQgPSBFeHBsb3Npb25Db21wb25lbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmlyZXdvcmtDb21wb25lbnREdG8gPSBleHBvcnRzLkZpcmV3b3JrRHRvID0gZXhwb3J0cy5GaXJld29ya3MgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRmlyZXdvcmtzIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNvbG9yT2Zmc2V0ID0gMTAwO1xuICAgICAgICB0aGlzLm1heENvbXBvbmVudHMgPSAyMDtcbiAgICAgICAgdGhpcy5taW5Db21wb25lbnRzID0gMjA7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSAxMDA7XG4gICAgICAgIHRoaXMubnVtYmVyT2ZGaXJld29ya3MgPSBNYXRoLnJvdW5kKEZpcmV3b3Jrcy5hbmltYXRpb25UaW1lIC8gdGhpcy5pbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gW107XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5tYXhEaXN0YW5jZSA9IGdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogNztcbiAgICAgICAgdGhpcy5taW5EaXN0YW5jZSA9IHRoaXMubWF4RGlzdGFuY2UgLyA1O1xuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IE1hdGguY2VpbChnYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlciAvIDEyKTtcbiAgICB9XG4gICAgaW5pdEZpcmV3b3JrcygpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm51bWJlck9mRmlyZXdvcmtzOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZCA9IHRoaXMuZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpO1xuICAgICAgICAgICAgY29uc3QgZ3JlZW4gPSB0aGlzLmdldFJhbmRvbUNvbG9yVmFsdWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGJsdWUgPSB0aGlzLmdldFJhbmRvbUNvbG9yVmFsdWUoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHNfbnVtYmVyID0gTWF0aC5yYW5kb20oKSAqICh0aGlzLm1heENvbXBvbmVudHMgLSB0aGlzLm1pbkNvbXBvbmVudHMpICsgdGhpcy5taW5Db21wb25lbnRzO1xuICAgICAgICAgICAgbGV0IGNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY29tcG9uZW50c19udW1iZXI7IGorKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSB0aGlzLmdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KHJlZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHRoaXMuZ2V0Q29sb3JWYWx1ZVdpdGhPZmZzZXQoZ3JlZW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KGJsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gXCIjXCIgK1xuICAgICAgICAgICAgICAgICAgICByLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgICAgICBnLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikgK1xuICAgICAgICAgICAgICAgICAgICBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50cy5wdXNoKG5ldyBGaXJld29ya0NvbXBvbmVudER0byhjb2xvciwgTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgKiAyLCBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodGhpcy5tYXhEaXN0YW5jZSAtIHRoaXMubWluRGlzdGFuY2UpICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5EaXN0YW5jZSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZmlyZXdvcmtzLnB1c2gobmV3IEZpcmV3b3JrRHRvKG5ldyBQb2ludF8xLlBvaW50KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgTWF0aC5yYW5kb20oKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAqIE1hdGgucmFuZG9tKCkpLCAtaSAqIHRoaXMuaW50ZXJ2YWwsIGNvbXBvbmVudHMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MuZm9yRWFjaChmaXJld29yayA9PiB7XG4gICAgICAgICAgICBmaXJld29yay5zdGFydFRpbWUgKz0gZGVsdGE7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5maXJld29ya3MgPSBbXTtcbiAgICB9XG4gICAgZ2V0UmFuZG9tQ29sb3JWYWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDI1NSk7XG4gICAgfVxuICAgIGdldENvbG9yVmFsdWVXaXRoT2Zmc2V0KGNvbG9WYWx1ZSkge1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgoY29sb1ZhbHVlICtcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqICh0aGlzLmNvbG9yT2Zmc2V0IC8gMikgLSB0aGlzLmNvbG9yT2Zmc2V0IC8gMiksIDApLCAyNTUpO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtzID0gRmlyZXdvcmtzO1xuRmlyZXdvcmtzLmFuaW1hdGlvblRpbWUgPSA1MDAwO1xuY2xhc3MgRmlyZXdvcmtEdG8ge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBzdGFydFRpbWUsIGNvbXBvbmVudHMgPSBbXSkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gc3RhcnRUaW1lO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBjb21wb25lbnRzO1xuICAgICAgICB0aGlzLnNpbmdsZUR1cmF0aW9uID0gNzAwO1xuICAgICAgICB0aGlzLm1heExlbmd0aEZhY3RvciA9IDAuMztcbiAgICB9XG4gICAgaXNGaXJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0VGltZSA+PSAwICYmIHRoaXMuc3RhcnRUaW1lIDw9IHRoaXMuc2luZ2xlRHVyYXRpb247XG4gICAgfVxuICAgIGdldExlbmdodCgpIHtcbiAgICAgICAgY29uc3QgZmFjdG9yID0gdGhpcy5zdGFydFRpbWUgPj0gdGhpcy5zaW5nbGVEdXJhdGlvbiAvIDJcbiAgICAgICAgICAgID8gKHRoaXMuc2luZ2xlRHVyYXRpb24gLSB0aGlzLnN0YXJ0VGltZSkgLyAodGhpcy5zaW5nbGVEdXJhdGlvbiAvIDIpXG4gICAgICAgICAgICA6IHRoaXMuc3RhcnRUaW1lIC8gKHRoaXMuc2luZ2xlRHVyYXRpb24gLyAyKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF4TGVuZ3RoRmFjdG9yICogZmFjdG9yO1xuICAgIH1cbiAgICBnZXRUaW1lRmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydFRpbWUgLyB0aGlzLnNpbmdsZUR1cmF0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZXdvcmtEdG8gPSBGaXJld29ya0R0bztcbmNsYXNzIEZpcmV3b3JrQ29tcG9uZW50RHRvIHtcbiAgICBjb25zdHJ1Y3Rvcihjb2xvciwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya0NvbXBvbmVudER0byA9IEZpcmV3b3JrQ29tcG9uZW50RHRvO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkdhdGUgPSB2b2lkIDA7XG5jbGFzcyBHYXRlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hbmdsZSA9IDA7XG4gICAgICAgIHRoaXMubWF4QW5nbGUgPSBNYXRoLlBJIC8gMjtcbiAgICAgICAgdGhpcy5vcGVuVGltZSA9IDMwMDtcbiAgICAgICAgdGhpcy5zdGVwID0gdGhpcy5tYXhBbmdsZSAvIHRoaXMub3BlblRpbWU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSwgaXNPcGVuKSB7XG4gICAgICAgIGlmIChpc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMuYW5nbGUgKz0gdGhpcy5zdGVwICogZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFuZ2xlIC09IHRoaXMuc3RlcCAqIGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYW5nbGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih0aGlzLm1heEFuZ2xlLCB0aGlzLmFuZ2xlKSk7XG4gICAgfVxuICAgIGdldCBjdXJyZW50QW5nbGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuZ2xlO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZSA9IEdhdGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR29hbFBvc3RzID0gdm9pZCAwO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIEdvYWxQb3N0cyB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0KSk7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IFBvaW50XzEuUG9pbnQoZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIGdhbWVDb25maWdzLmdvYWxIZWlnaHQpKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaChuZXcgUG9pbnRfMS5Qb2ludChnYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyBnYW1lQ29uZmlncy5maWVsZFdpZHRoLCBnYW1lQ29uZmlncy5nb2FsWU9mZnNldCkpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIGdhbWVDb25maWdzLmZpZWxkV2lkdGgsIGdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCkpO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IGdhbWVDb25maWdzLmdvYWxQb3N0UmFkaXVzO1xuICAgIH1cbn1cbmV4cG9ydHMuR29hbFBvc3RzID0gR29hbFBvc3RzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhvdmVyYWJsZUVudGl0eSA9IHZvaWQgMDtcbmNsYXNzIEhvdmVyYWJsZUVudGl0eSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmhvdmVyUHJvZ3Jlc3MgPSAwO1xuICAgIH1cbn1cbmV4cG9ydHMuSG92ZXJhYmxlRW50aXR5ID0gSG92ZXJhYmxlRW50aXR5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVCdXR0b24gPSB2b2lkIDA7XG5jb25zdCBEaW1lbnNpb25zXzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvRGltZW5zaW9uc1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBIb3ZlcmFibGVFbnRpdHlfMSA9IHJlcXVpcmUoXCIuL0hvdmVyYWJsZUVudGl0eVwiKTtcbmNsYXNzIE1lbnVCdXR0b24gZXh0ZW5kcyBIb3ZlcmFibGVFbnRpdHlfMS5Ib3ZlcmFibGVFbnRpdHkge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCByZWZXaWR0aCwgcmVmSGVpZ2h0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNTtcbiAgICAgICAgdGhpcy5kaW1lbnNpb24gPSBuZXcgRGltZW5zaW9uc18xLkRpbWVuc2lvbnMoaGVpZ2h0ICogKHJlZldpZHRoIC8gcmVmSGVpZ2h0KSwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KGdhbWVDb25maWdzLmZpZWxkWE9mZnNldCArIChnYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5kaW1lbnNpb24ud2lkdGgpIC8gMiwgKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC0gdGhpcy5kaW1lbnNpb24uaGVpZ2h0KSAvIDIpO1xuICAgIH1cbiAgICBjb250YWlucyhwb2ludCkge1xuICAgICAgICByZXR1cm4gKHBvaW50LnggPj0gdGhpcy5wb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBwb2ludC54IDw9IHRoaXMucG9zaXRpb24ueCArIHRoaXMuZGltZW5zaW9uLndpZHRoICYmXG4gICAgICAgICAgICBwb2ludC55ID49IHRoaXMucG9zaXRpb24ueSAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmRpbWVuc2lvbi5oZWlnaHQpO1xuICAgIH1cbiAgICBnZXRUcmFuc2l0aW9uVGltZSgpIHtcbiAgICAgICAgcmV0dXJuIDEwMDtcbiAgICB9XG59XG5leHBvcnRzLk1lbnVCdXR0b24gPSBNZW51QnV0dG9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQm91bmNlV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vYm91bmNlL0JvdW5jZVdyYXBwZXJcIik7XG5jb25zdCBQb3dlclNob3RXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9wb3dlclNob3RzL1Bvd2VyU2hvdFdyYXBwZXJcIik7XG5jb25zdCBTdHVubmVkV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vc3R1bm5lZC9TdHVubmVkV3JhcHBlclwiKTtcbmNsYXNzIFBsYXllciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MsIGlzQ3B1LCBpc1N1YnN0aXR1dGUsIHNpZGUsIGNvbG9ySW5kZXgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2VXcmFwcGVyID0gbmV3IEJvdW5jZVdyYXBwZXJfMS5Cb3VuY2VXcmFwcGVyKCk7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgbmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIDAsIDApO1xuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoMCwgMCksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWF4U3BlZWQgPSAwO1xuICAgICAgICB0aGlzLnBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUw7XG4gICAgICAgIHRoaXMuc3R1bm5lZFdyYXBwZXIgPSBuZXcgU3R1bm5lZFdyYXBwZXJfMS5TdHVubmVkV3JhcHBlcih0aGlzKTtcbiAgICAgICAgdGhpcy5ub3JtYWxNYXhTcGVlZCA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gNzAwO1xuICAgICAgICBpZiAoaXNDcHUpIHtcbiAgICAgICAgICAgIHRoaXMubm9ybWFsTWF4U3BlZWQgPSB0aGlzLm5vcm1hbE1heFNwZWVkICogMC44O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDEwMDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiA9IHRoaXMubm9ybWFsTWF4U3BlZWQgLyAzMDA7XG4gICAgICAgIHRoaXMuY2xvc2VUb1BvaW50RGlzdGFuY2UgPSBnYW1lQ29uZmlncy5maWVsZFdpZHRoIC8gMTA7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi5zaXplID0gZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgIHRoaXMuaXNDcHUgPSBpc0NwdTtcbiAgICAgICAgdGhpcy5pc1N1YnN0aXR1dGUgPSBpc1N1YnN0aXR1dGU7XG4gICAgICAgIHRoaXMuc2lkZSA9IHNpZGU7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IGNvbG9ySW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdFBvc2l0aW9ucyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucG93ZXJTaG90V3JhcHBlciA9IG5ldyBQb3dlclNob3RXcmFwcGVyXzEuUG93ZXJTaG90V3JhcHBlcihnYW1lQ29uZmlncywgc2lkZSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgZmFsc2UsIGZhbHNlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUNwdVBsYXllcihnYW1lQ29uZmlncykge1xuICAgICAgICByZXR1cm4gbmV3IFBsYXllcihnYW1lQ29uZmlncywgdHJ1ZSwgZmFsc2UsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hULCAwKTtcbiAgICB9XG4gICAgc3RhdGljIGNyZWF0ZUxlZnRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGxheWVyKGdhbWVDb25maWdzLCBmYWxzZSwgdHJ1ZSwgUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVCwgMSk7XG4gICAgfVxuICAgIHN0YXRpYyBjcmVhdGVSaWdodFN1YnN0aXR1dGVQbGF5ZXIoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIoZ2FtZUNvbmZpZ3MsIGZhbHNlLCB0cnVlLCBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgMSk7XG4gICAgfVxuICAgIHJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkge1xuICAgICAgICByZXR1cm4gKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UodGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCB0aGlzLmRlc3RpbmF0aW9uUG9zaXRpb24ucG9zaXRpb24pIDxcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKTtcbiAgICB9XG4gICAgbW92ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi51cGRhdGVQb3NpdGlvbihkZWx0YU1zKTtcbiAgICB9XG4gICAgYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcykge1xuICAgICAgICBjb25zdCBwcm9qZWN0ZWRQb3NpdGlvbiA9IHRoaXMubW92ZW1lbnRQb3NpdGlvbi5wcm9qZWN0VG9GaW5hbFBvc2l0aW9uKCk7XG4gICAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnByb2plY3RUb0ZpbmFsUG9zaXRpb24oKTtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyh0aGlzLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHRhcmdldFBvc2l0aW9uKTtcbiAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocHJvamVjdGVkUG9zaXRpb24sIHRhcmdldFBvc2l0aW9uKSA8IHRoaXMucmVhY2hlZERpc3RhbmNlVG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50U3BlZWQgPSB0aGlzLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50U3BlZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uICogZGVsdGFNcywgMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFggPSBNYXRoLmNvcyhhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGNvbnN0IGRlc2lyZWRTcGVlZFkgPSBNYXRoLnNpbihhbmdsZSkgKiB0aGlzLmN1cnJlbnRNYXhTcGVlZDtcbiAgICAgICAgICAgIGxldCBzdGVlclggPSBkZXNpcmVkU3BlZWRYIC0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5Lng7XG4gICAgICAgICAgICBsZXQgc3RlZXJZID0gZGVzaXJlZFNwZWVkWSAtIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eS55O1xuICAgICAgICAgICAgY29uc3Qgc3RlZXJNYWduaXR1ZGUgPSBNYXRoLnNxcnQoc3RlZXJYICogc3RlZXJYICsgc3RlZXJZICogc3RlZXJZKTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN0ZWVyID0gdGhpcy5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXM7XG4gICAgICAgICAgICBpZiAoc3RlZXJNYWduaXR1ZGUgPiBtYXhTdGVlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhdGlvID0gbWF4U3RlZXIgLyBzdGVlck1hZ25pdHVkZTtcbiAgICAgICAgICAgICAgICBzdGVlclggKj0gcmF0aW87XG4gICAgICAgICAgICAgICAgc3RlZXJZICo9IHJhdGlvO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnggKz0gc3RlZXJYO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgKz0gc3RlZXJZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZW1lbnRQb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uLnBvc2l0aW9uLngsIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZCh0aGlzLmN1cnJlbnRNYXhTcGVlZCk7XG4gICAgfVxuICAgIHJlc2V0VG9TdGFydEdhbWUoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1heFNwZWVkID0gdGhpcy5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgfVxuICAgIHN3aXRjaENvbG9ySW5kZXgoKSB7XG4gICAgICAgIHRoaXMuY29sb3JJbmRleCA9IHRoaXMuY29sb3JJbmRleCA9PT0gMCA/IDEgOiAwO1xuICAgIH1cbiAgICB1cGRhdGVQb3dlclNob3QoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFdyYXBwZXIudXBkYXRlKGRlbHRhTXMsIHRoaXMpO1xuICAgIH1cbiAgICByZXNldE9uR29hbCgpIHtcbiAgICAgICAgdGhpcy5ib3VuY2VXcmFwcGVyLnJlc2V0KCk7XG4gICAgICAgIHRoaXMuc3R1bm5lZFdyYXBwZXIucmVzZXQoKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMO1xuICAgICAgICB0aGlzLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICB9XG4gICAgc3RhcnRCb3VuY2luZygpIHtcbiAgICAgICAgaWYgKHRoaXMucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKSB7XG4gICAgICAgICAgICB0aGlzLmJvdW5jZVdyYXBwZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGluaXRQb3NpdGlvbnMoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgbGV0IG9mZnNldFggPSAwO1xuICAgICAgICBpZiAodGhpcy5pc1N1YnN0aXR1dGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkgPSBnYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYXG4gICAgICAgICAgICAgICAgICAgIDogZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtIGdhbWVDb25maWdzLnN1YnN0aXR1dGlvbk9mZnNldFg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi55ID0gZ2FtZUNvbmZpZ3MucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQ7XG4gICAgICAgICAgICBvZmZzZXRYID1cbiAgICAgICAgICAgICAgICB0aGlzLnNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICAgICAgPyBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldFxuICAgICAgICAgICAgICAgICAgICA6IGdhbWVDb25maWdzLmZpZWxkV2lkdGggLSBnYW1lQ29uZmlncy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluaXRpYWxQb3NpdGlvbi54ID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgb2Zmc2V0WDtcbiAgICAgICAgdGhpcy5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5pbml0aWFsUG9zaXRpb24ueCwgdGhpcy5pbml0aWFsUG9zaXRpb24ueSk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbiA9IG5ldyBQb2ludF8xLlBvaW50KHRoaXMuaW5pdGlhbFBvc2l0aW9uLngsIHRoaXMuaW5pdGlhbFBvc2l0aW9uLnkpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWVyID0gUGxheWVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvdW5jZVdyYXBwZXIgPSB2b2lkIDA7XG5jbGFzcyBCb3VuY2VXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ib3VuY2luZ1N0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuYm91bmNlVGltZSA9IDIwMDA7XG4gICAgICAgIHRoaXMuYm91bmNlTWF4QW1wbGl0dWRlID0gMC41O1xuICAgICAgICB0aGlzLmJvdW5jZUV4cG9uZW50aWFsRmFjdG9yID0gMC4wMDM0NjtcbiAgICAgICAgdGhpcy5ib3VuY2VOdW1iZXIgPSA1O1xuICAgIH1cbiAgICBzdGFydEJvdW5jaW5nKCkge1xuICAgICAgICBpZiAodGhpcy5nZXRCb3VuY2luZ1Byb2dyZXNzKCkgPiB0aGlzLmJvdW5jZVRpbWUgLyAyKSB7XG4gICAgICAgICAgICB0aGlzLmJvdW5jaW5nU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRCb3VuY2luZ0FtcGxpdHVkZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQm91bmNpbmcoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0aGlzLmJvdW5jZU1heEFtcGxpdHVkZSAqXG4gICAgICAgICAgICBNYXRoLnBvdyhNYXRoLkUsIC10aGlzLmdldEJvdW5jaW5nUHJvZ3Jlc3MoKSAqIHRoaXMuYm91bmNlRXhwb25lbnRpYWxGYWN0b3IpICpcbiAgICAgICAgICAgIE1hdGguc2luKHRoaXMuZ2V0Qm91bmNpbmdQcm9ncmVzcygpIC8gKDIgKiBNYXRoLlBJICogdGhpcy5ib3VuY2VOdW1iZXIpKSk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmJvdW5jaW5nU3RhcnRUaW1lID0gMDtcbiAgICB9XG4gICAgZ2V0Qm91bmNpbmdQcm9ncmVzcygpIHtcbiAgICAgICAgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLmJvdW5jaW5nU3RhcnRUaW1lO1xuICAgIH1cbiAgICBpc0JvdW5jaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCb3VuY2luZ1Byb2dyZXNzKCkgPD0gdGhpcy5ib3VuY2VUaW1lO1xuICAgIH1cbn1cbmV4cG9ydHMuQm91bmNlV3JhcHBlciA9IEJvdW5jZVdyYXBwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFBvd2VyU2hvdCA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jbGFzcyBCYWxsUG93ZXJTaG90IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RUeXBlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlID0gbnVsbDtcbiAgICB9XG4gICAgZ2V0IGlzUG93ZXJTaG90KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3Q7XG4gICAgfVxuICAgIGdldFBvd2VyU2hvdFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdFR5cGU7XG4gICAgfVxuICAgIGVuYWJsZVBvd2VyU2hvdChwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSB0cnVlO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdFR5cGUgPSBQb3dlclNob3RUeXBlXzEuUG93ZXJTaG90VXRpbGl0aWVzLmdldFBvd2VyU2hvdFR5cGUocGxheWVyLmNvbG9ySW5kZXgpO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZVV0aWxpdGllcy5nZXRPcHBvc2l0ZVNpZGUocGxheWVyLnNpZGUpO1xuICAgIH1cbiAgICByZXNldFBvd2VyU2hvdCgpIHtcbiAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3dlclNob3RUeXBlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3dlclNob3REZXN0aW9uYXRpb25TaWRlID0gbnVsbDtcbiAgICB9XG4gICAgc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKCkge1xuICAgICAgICBpZiAoIXRoaXMucG93ZXJTaG90IHx8IHRoaXMucG93ZXJTaG90VHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKHRoaXMucG93ZXJTaG90VHlwZSk7XG4gICAgfVxuICAgIHNob3VsZE1vdmVUb0dvYWwoKSB7XG4gICAgICAgIGlmICghdGhpcy5wb3dlclNob3QgfHwgdGhpcy5wb3dlclNob3RUeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RVdGlsaXRpZXMuc2hvdWxkTW92ZVRvR29hbCh0aGlzLnBvd2VyU2hvdFR5cGUpO1xuICAgIH1cbiAgICBnZXRQb3dlclNob3REZXN0aW5hdGlvblNpZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdERlc3Rpb25hdGlvblNpZGU7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsUG93ZXJTaG90ID0gQmFsbFBvd2VyU2hvdDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FbGVjdHJpY1Bvd2VyU2hvdCA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBFbGVjdHJpY1Bvd2VyU2hvdCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IDUwO1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRTaXplID0gMTA7XG4gICAgICAgIHRoaXMubGFzdENoYW5nZURlbHRhVGltZSA9IHRoaXMuaW50ZXJ2YWw7XG4gICAgICAgIHRoaXMuYW5nbGVPZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5ID0gW107XG4gICAgICAgIHRoaXMud2hpdGVMaW5lVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLndpZHRoID0gTWF0aC5yb3VuZChNYXRoLmZsb29yKGdhbWVDb25maWdzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICogMi41KSk7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoIC8gNSk7XG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gTWF0aC5jZWlsKHRoaXMuaGVpZ2h0IC8gNCk7XG4gICAgICAgIHRoaXMuYmlnTGluZVdpZHRoID0gTWF0aC5yb3VuZCh0aGlzLmxpbmVXaWR0aCAqIDMpO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgKz0gZGVsdGFNcztcbiAgICAgICAgdGhpcy53aGl0ZUxpbmVWaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMubGFzdENoYW5nZURlbHRhVGltZSA+PSB0aGlzLmludGVydmFsKSB7XG4gICAgICAgICAgICB0aGlzLmxhc3RDaGFuZ2VEZWx0YVRpbWUgPSAwO1xuICAgICAgICAgICAgdGhpcy5yZWdlbmVyYXRlTGlnaHRuaW5nQm9sdFBvaW50cygpO1xuICAgICAgICAgICAgdGhpcy5hbmdsZU9mZnNldCArPSAoTWF0aC5QSSAvIDQ1KSAqIHRoaXMuaW50ZXJ2YWwgKiAwLjA1O1xuICAgICAgICAgICAgdGhpcy53aGl0ZUxpbmVWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdWxkUmVuZGVyKHBsYXllcikge1xuICAgICAgICByZXR1cm4gKHBsYXllci5jb2xvckluZGV4ID09PSAxICYmXG4gICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTCk7XG4gICAgfVxuICAgIHJlZ2VuZXJhdGVMaWdodG5pbmdCb2x0UG9pbnRzKCkge1xuICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5ID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saWdodG5pbmdCb2x0U2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5LnB1c2gobmV3IFBvaW50XzEuUG9pbnQoKHRoaXMud2lkdGggLyB0aGlzLmxpZ2h0bmluZ0JvbHRTaXplKSAqIGkgLSB0aGlzLndpZHRoIC8gMiwgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5oZWlnaHQpIC0gdGhpcy5oZWlnaHQgLyAyKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkVsZWN0cmljUG93ZXJTaG90ID0gRWxlY3RyaWNQb3dlclNob3Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmxhbWVEdG8gPSBleHBvcnRzLkZpcmVQb3dlclNob3QgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgRmlyZVBvd2VyU2hvdCB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5tYXhJbmRleCA9IDE2O1xuICAgICAgICB0aGlzLmludGVydmFsID0gMTtcbiAgICAgICAgdGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgPSB0aGlzLmludGVydmFsO1xuICAgICAgICB0aGlzLmZsYW1lcyA9IFtdO1xuICAgICAgICB0aGlzLm1heFNpemUgPSBNYXRoLnJvdW5kKGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMik7XG4gICAgICAgIHRoaXMubWluU2l6ZSA9IHRoaXMubWF4U2l6ZSAvIDU7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zLCBwbGF5ZXIpIHtcbiAgICAgICAgdGhpcy5mbGFtZXMuZm9yRWFjaChmbGFtZSA9PiB7XG4gICAgICAgICAgICBmbGFtZS51cGRhdGUoZGVsdGFNcyk7XG4gICAgICAgICAgICBpZiAoZmxhbWUuaXNGaW5pc2hlZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mbGFtZXMuc3BsaWNlKHRoaXMuZmxhbWVzLmluZGV4T2YoZmxhbWUpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGFzdEFkZGVkRGVsdGFUaW1lICs9IGRlbHRhTXM7XG4gICAgICAgIGlmICh0aGlzLmxhc3RBZGRlZERlbHRhVGltZSA+PSB0aGlzLmludGVydmFsICYmXG4gICAgICAgICAgICBwbGF5ZXIucG93ZXJTaG90V3JhcHBlci5nZXRQb3dlclNob3QoKSAmJlxuICAgICAgICAgICAgcGxheWVyLmNvbG9ySW5kZXggPT09IDAgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpIHtcbiAgICAgICAgICAgIHRoaXMuZmxhbWVzLnB1c2gobmV3IEZsYW1lRHRvKG5ldyBQb2ludF8xLlBvaW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpLCBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiB0aGlzLm1heEluZGV4KSkpO1xuICAgICAgICAgICAgdGhpcy5sYXN0QWRkZWREZWx0YVRpbWUgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3VsZFJlbmRlcihfcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlyZVBvd2VyU2hvdCA9IEZpcmVQb3dlclNob3Q7XG5jbGFzcyBGbGFtZUR0byB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGluZGV4KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5tYXhEdXJhdGlvbiA9IDEwMDA7XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gKz0gZGVsdGFNcztcbiAgICB9XG4gICAgZ2V0RHVyYXRpb25GYWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmR1cmF0aW9uIC8gdGhpcy5tYXhEdXJhdGlvbjtcbiAgICB9XG4gICAgaXNGaW5pc2hlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHVyYXRpb24gPj0gdGhpcy5tYXhEdXJhdGlvbjtcbiAgICB9XG59XG5leHBvcnRzLkZsYW1lRHRvID0gRmxhbWVEdG87XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUG93ZXJTaG90V3JhcHBlciA9IHZvaWQgMDtcbmNvbnN0IEVsZWN0cmljUG93ZXJTaG90XzEgPSByZXF1aXJlKFwiLi9FbGVjdHJpY1Bvd2VyU2hvdFwiKTtcbmNvbnN0IEZpcmVQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuL0ZpcmVQb3dlclNob3RcIik7XG5jbGFzcyBQb3dlclNob3RXcmFwcGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgc2lkZSkge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHNUb1Bvd2VyU2hvdCA9IDI7XG4gICAgICAgIHRoaXMucG93ZXJTaG90cyA9IFtdO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMucHVzaChuZXcgRWxlY3RyaWNQb3dlclNob3RfMS5FbGVjdHJpY1Bvd2VyU2hvdChnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMucHVzaChuZXcgRmlyZVBvd2VyU2hvdF8xLkZpcmVQb3dlclNob3QoZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5zaWRlID0gc2lkZTtcbiAgICB9XG4gICAgdXBkYXRlKGRlbHRhTXMsIHBsYXllcikge1xuICAgICAgICB0aGlzLnBvd2VyU2hvdHMuZm9yRWFjaChwb3dlclNob3QgPT4ge1xuICAgICAgICAgICAgcG93ZXJTaG90LnVwZGF0ZShkZWx0YU1zLCBwbGF5ZXIpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IHBvd2VyU2hvdEVudGl0aWVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wb3dlclNob3RzO1xuICAgIH1cbiAgICB1cGRhdGVTY29yZWRHb2FsKHBsYXllclNpZGUpIHtcbiAgICAgICAgaWYgKHBsYXllclNpZGUgPT09IHRoaXMuc2lkZSkge1xuICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzKys7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25zZWN1dGl2ZUdvYWxzID09PSB0aGlzLmNvbnNlY3V0aXZlR29hbHNUb1Bvd2VyU2hvdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucG93ZXJTaG90ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnNlY3V0aXZlR29hbHMgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb25zZWN1dGl2ZUdvYWxzID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRQb3dlclNob3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvd2VyU2hvdDtcbiAgICB9XG4gICAgcmVzZXRQb3dlclNob3QoKSB7XG4gICAgICAgIGlmICh0aGlzLnBvd2VyU2hvdCkge1xuICAgICAgICAgICAgdGhpcy5wb3dlclNob3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY29uc2VjdXRpdmVHb2FscyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlBvd2VyU2hvdFdyYXBwZXIgPSBQb3dlclNob3RXcmFwcGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0YXJEdG8gPSBleHBvcnRzLlN0dW5uZWRTdGFycyA9IHZvaWQgMDtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTdHVubmVkU3RhcnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRlbHRhQmV0d2VlblN0YXJzID0gMjAwO1xuICAgICAgICB0aGlzLmFuZ2xlU3RlcCA9IE1hdGguUEkgLyA4MDA7XG4gICAgICAgIHRoaXMuc3RhcnMgPSBbXTtcbiAgICAgICAgdGhpcy5zdGFyRGVsdGEgPSAwO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGEsIHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuc3RhckRlbHRhICs9IGRlbHRhO1xuICAgICAgICBpZiAodGhpcy5zdGFyRGVsdGEgPj0gdGhpcy5kZWx0YUJldHdlZW5TdGFycykge1xuICAgICAgICAgICAgdGhpcy5zdGFycy5wdXNoKG5ldyBTdGFyRHRvKG5ldyBQb2ludF8xLlBvaW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpLCAwLCBNYXRoLnJhbmRvbSgpICogMiAqIE1hdGguUEksIERhdGUubm93KCkpKTtcbiAgICAgICAgICAgIHRoaXMuc3RhckRlbHRhID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXJzLmZvckVhY2goKHN0YXIsIF9pbmRleCkgPT4ge1xuICAgICAgICAgICAgc3Rhci5hbmdsZSArPSB0aGlzLmFuZ2xlU3RlcCAqIGRlbHRhO1xuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFyLmFkZGVkVGltZSA+IFN0dW5uZWRTdGFycy5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnMuc3BsaWNlKHRoaXMuc3RhcnMuaW5kZXhPZihzdGFyKSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFN0YXJzID0gU3R1bm5lZFN0YXJzO1xuU3R1bm5lZFN0YXJzLmR1cmF0aW9uID0gMjAwMDtcbmNsYXNzIFN0YXJEdG8ge1xuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uLCBhbmdsZSwgZGlyZWN0aW9uLCBhZGRlZFRpbWUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB0aGlzLmFkZGVkVGltZSA9IGFkZGVkVGltZTtcbiAgICB9XG4gICAgZ2V0RmFjdG9yKCkge1xuICAgICAgICByZXR1cm4gKERhdGUubm93KCkgLSB0aGlzLmFkZGVkVGltZSkgLyBTdHVubmVkU3RhcnMuZHVyYXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5TdGFyRHRvID0gU3RhckR0bztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdHVubmVkV3JhcHBlciA9IHZvaWQgMDtcbmNvbnN0IFBsYXllclN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2VudW1zL1BsYXllclN0YXR1c1wiKTtcbmNvbnN0IFN0dW5uZWRTdGFyc18xID0gcmVxdWlyZShcIi4vU3R1bm5lZFN0YXJzXCIpO1xuY2xhc3MgU3R1bm5lZFdyYXBwZXIge1xuICAgIGNvbnN0cnVjdG9yKHBsYXllcikge1xuICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0YXJzID0gbmV3IFN0dW5uZWRTdGFyc18xLlN0dW5uZWRTdGFycygpO1xuICAgICAgICB0aGlzLnN0dW5uZWRNYXhWYWx1ZSA9IDIwMDA7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0ZXAgPSAxMDAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRUaW1lID0gMzAwMDtcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG4gICAgfVxuICAgIHVwZGF0ZVN0dW5uZWRWYWx1ZShvdGhlclBsYXllclNwZWVkKSB7XG4gICAgICAgIGlmICh0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgIT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5TVFVOTkVEKSB7XG4gICAgICAgICAgICBjb25zdCBzcGVlZCA9IHRoaXMucGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKTtcbiAgICAgICAgICAgIGlmIChzcGVlZCA+IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IE1hdGgubWF4KDAsIHRoaXMuc3R1bm5lZFZhbHVlIC0gdGhpcy5zdHVubmVkU3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzcGVlZCA8IG90aGVyUGxheWVyU3BlZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSArPSB0aGlzLnN0dW5uZWRTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3R1bm5lZFZhbHVlID4gdGhpcy5zdHVubmVkTWF4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgPSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvcmNlU3R1bm5lZCgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQ7XG4gICAgICAgIHRoaXMuc3R1bm5lZFN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuICAgIGRlY3JlbWVudFN0dW5uZWRWYWx1ZShkZWx0YU1zKSB7XG4gICAgICAgIGlmICh0aGlzLnBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpIHtcbiAgICAgICAgICAgIHRoaXMuc3R1bm5lZFZhbHVlID0gTWF0aC5tYXgoMCwgdGhpcy5zdHVubmVkVmFsdWUgLSBkZWx0YU1zIC8gMik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRCkge1xuICAgICAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMudXBkYXRlKGRlbHRhTXMsIHRoaXMucGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgLSB0aGlzLnN0dW5uZWRTdGFydFRpbWUgPiB0aGlzLnN0dW5uZWRUaW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXIucGxheWVyU3RhdHVzID0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLk5PUk1BTDtcbiAgICAgICAgICAgICAgICB0aGlzLnN0dW5uZWRWYWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHVubmVkU3RhcnMuc3RhcnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgICAgdGhpcy5zdHVubmVkVmFsdWUgPSAwO1xuICAgICAgICB0aGlzLnN0dW5uZWRTdGFycy5zdGFycyA9IFtdO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFdyYXBwZXIgPSBTdHVubmVkV3JhcHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsU3RhdHVzID0gdm9pZCAwO1xudmFyIEJhbGxTdGF0dXM7XG4oZnVuY3Rpb24gKEJhbGxTdGF0dXMpIHtcbiAgICBCYWxsU3RhdHVzW1wiRlJFRVwiXSA9IFwiRlJFRVwiO1xuICAgIEJhbGxTdGF0dXNbXCJBVFRBQ0hFRFwiXSA9IFwiQVRUQUNIRURcIjtcbiAgICBCYWxsU3RhdHVzW1wiR09BTF9TQ09SRURcIl0gPSBcIkdPQUxfU0NPUkVEXCI7XG59KShCYWxsU3RhdHVzIHx8IChleHBvcnRzLkJhbGxTdGF0dXMgPSBCYWxsU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lU3RhdHVzID0gdm9pZCAwO1xudmFyIEdhbWVTdGF0dXM7XG4oZnVuY3Rpb24gKEdhbWVTdGF0dXMpIHtcbiAgICBHYW1lU3RhdHVzW1wiTUVOVVwiXSA9IFwiTUVOVVwiO1xuICAgIEdhbWVTdGF0dXNbXCJXQUlUSU5HX0JBTExcIl0gPSBcIldBSVRJTkdfQkFMTFwiO1xuICAgIEdhbWVTdGF0dXNbXCJQTEFZSU5HXCJdID0gXCJQTEFZSU5HXCI7XG4gICAgR2FtZVN0YXR1c1tcIkVORF9HQU1FXCJdID0gXCJFTkRfR0FNRVwiO1xuICAgIEdhbWVTdGF0dXNbXCJTVUJTVElUSU9OXCJdID0gXCJTVUJTVElUSU9OXCI7XG59KShHYW1lU3RhdHVzIHx8IChleHBvcnRzLkdhbWVTdGF0dXMgPSBHYW1lU3RhdHVzID0ge30pKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlzVXRpbGl0aWVzID0gZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gZXhwb3J0cy5LZXlzID0gdm9pZCAwO1xudmFyIEtleXM7XG4oZnVuY3Rpb24gKEtleXMpIHtcbiAgICBLZXlzW1wiQVJST1dfRE9XTlwiXSA9IFwiQXJyb3dEb3duXCI7XG4gICAgS2V5c1tcIkFSUk9XX1VQXCJdID0gXCJBcnJvd1VwXCI7XG4gICAgS2V5c1tcIkFSUk9XX0xFRlRcIl0gPSBcIkFycm93TGVmdFwiO1xuICAgIEtleXNbXCJBUlJPV19SSUdIVFwiXSA9IFwiQXJyb3dSaWdodFwiO1xuICAgIEtleXNbXCJTUEFDRVwiXSA9IFwiIFwiO1xufSkoS2V5cyB8fCAoZXhwb3J0cy5LZXlzID0gS2V5cyA9IHt9KSk7XG52YXIgS2V5c0RpcmVjdGlvbjtcbihmdW5jdGlvbiAoS2V5c0RpcmVjdGlvbikge1xuICAgIEtleXNEaXJlY3Rpb25bXCJIT1JJWk9OVEFMXCJdID0gXCJIT1JJWk9OVEFMXCI7XG4gICAgS2V5c0RpcmVjdGlvbltcIlZFUlRJQ0FMXCJdID0gXCJWRVJUSUNBTFwiO1xufSkoS2V5c0RpcmVjdGlvbiB8fCAoZXhwb3J0cy5LZXlzRGlyZWN0aW9uID0gS2V5c0RpcmVjdGlvbiA9IHt9KSk7XG5jbGFzcyBLZXlzVXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0S2V5RGlyZWN0aW9uKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09PSBLZXlzLkFSUk9XX0xFRlQgfHwga2V5ID09PSBLZXlzLkFSUk9XX1JJR0hUKSB7XG4gICAgICAgICAgICByZXR1cm4gS2V5c0RpcmVjdGlvbi5IT1JJWk9OVEFMO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXkgPT09IEtleXMuQVJST1dfVVAgfHwga2V5ID09PSBLZXlzLkFSUk9XX0RPV04pIHtcbiAgICAgICAgICAgIHJldHVybiBLZXlzRGlyZWN0aW9uLlZFUlRJQ0FMO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuS2V5c1V0aWxpdGllcyA9IEtleXNVdGlsaXRpZXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyU2lkZVV0aWxpdGllcyA9IGV4cG9ydHMuUGxheWVyU2lkZSA9IHZvaWQgMDtcbnZhciBQbGF5ZXJTaWRlO1xuKGZ1bmN0aW9uIChQbGF5ZXJTaWRlKSB7XG4gICAgUGxheWVyU2lkZVtcIkxFRlRcIl0gPSBcIkxFRlRcIjtcbiAgICBQbGF5ZXJTaWRlW1wiUklHSFRcIl0gPSBcIlJJR0hUXCI7XG59KShQbGF5ZXJTaWRlIHx8IChleHBvcnRzLlBsYXllclNpZGUgPSBQbGF5ZXJTaWRlID0ge30pKTtcbmNsYXNzIFBsYXllclNpZGVVdGlsaXRpZXMge1xuICAgIHN0YXRpYyBnZXRPcHBvc2l0ZVNpZGUoc2lkZSkge1xuICAgICAgICByZXR1cm4gc2lkZSA9PT0gUGxheWVyU2lkZS5MRUZUID8gUGxheWVyU2lkZS5SSUdIVCA6IFBsYXllclNpZGUuTEVGVDtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllclNpZGVVdGlsaXRpZXMgPSBQbGF5ZXJTaWRlVXRpbGl0aWVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllclN0YXR1cyA9IHZvaWQgMDtcbnZhciBQbGF5ZXJTdGF0dXM7XG4oZnVuY3Rpb24gKFBsYXllclN0YXR1cykge1xuICAgIFBsYXllclN0YXR1c1tcIk5PUk1BTFwiXSA9IFwiTk9STUFMXCI7XG4gICAgUGxheWVyU3RhdHVzW1wiU1RVTk5FRFwiXSA9IFwiU1RVTk5FRFwiO1xufSkoUGxheWVyU3RhdHVzIHx8IChleHBvcnRzLlBsYXllclN0YXR1cyA9IFBsYXllclN0YXR1cyA9IHt9KSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUG93ZXJTaG90VXRpbGl0aWVzID0gZXhwb3J0cy5Qb3dlclNob3RUeXBlID0gdm9pZCAwO1xudmFyIFBvd2VyU2hvdFR5cGU7XG4oZnVuY3Rpb24gKFBvd2VyU2hvdFR5cGUpIHtcbiAgICBQb3dlclNob3RUeXBlW1wiRklSRVwiXSA9IFwiRklSRVwiO1xuICAgIFBvd2VyU2hvdFR5cGVbXCJFTEVDVFJJQ1wiXSA9IFwiRUxFQ1RSSUNcIjtcbn0pKFBvd2VyU2hvdFR5cGUgfHwgKGV4cG9ydHMuUG93ZXJTaG90VHlwZSA9IFBvd2VyU2hvdFR5cGUgPSB7fSkpO1xuY2xhc3MgUG93ZXJTaG90VXRpbGl0aWVzIHtcbiAgICBzdGF0aWMgZ2V0UG93ZXJTaG90VHlwZShjb2xvckluZGV4KSB7XG4gICAgICAgIHN3aXRjaCAoY29sb3JJbmRleCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlLkZJUkU7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBvd2VyU2hvdFR5cGUuRUxFQ1RSSUM7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBQb3dlclNob3RUeXBlLkZJUkU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdldFNwZWVkRmFjdG9yKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgc3dpdGNoIChwb3dlclNob3RUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRklSRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcbiAgICAgICAgICAgIGNhc2UgUG93ZXJTaG90VHlwZS5FTEVDVFJJQzpcbiAgICAgICAgICAgICAgICByZXR1cm4gMS4yO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgc3dpdGNoIChwb3dlclNob3RUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRklSRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRUxFQ1RSSUM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBzaG91bGRNb3ZlVG9Hb2FsKHBvd2VyU2hvdFR5cGUpIHtcbiAgICAgICAgc3dpdGNoIChwb3dlclNob3RUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRklSRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjYXNlIFBvd2VyU2hvdFR5cGUuRUxFQ1RSSUM6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuUG93ZXJTaG90VXRpbGl0aWVzID0gUG93ZXJTaG90VXRpbGl0aWVzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJvcmRlckxpbWl0cyA9IHZvaWQgMDtcbmNsYXNzIEJvcmRlckxpbWl0cyB7XG4gICAgY29uc3RydWN0b3IobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tKSB7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy50b3AgPSB0b3A7XG4gICAgICAgIHRoaXMuYm90dG9tID0gYm90dG9tO1xuICAgIH1cbiAgICBpc1BvaW50SW5zaWRlKHBvaW50KSB7XG4gICAgICAgIHJldHVybiAocG9pbnQueCA+PSB0aGlzLmxlZnQgJiZcbiAgICAgICAgICAgIHBvaW50LnggPD0gdGhpcy5yaWdodCAmJlxuICAgICAgICAgICAgcG9pbnQueSA+PSB0aGlzLnRvcCAmJlxuICAgICAgICAgICAgcG9pbnQueSA8PSB0aGlzLmJvdHRvbSk7XG4gICAgfVxufVxuZXhwb3J0cy5Cb3JkZXJMaW1pdHMgPSBCb3JkZXJMaW1pdHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRGltZW5zaW9ucyA9IHZvaWQgMDtcbmNsYXNzIERpbWVuc2lvbnMge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICB9XG59XG5leHBvcnRzLkRpbWVuc2lvbnMgPSBEaW1lbnNpb25zO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50UG9pbnQgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4vUG9pbnRcIik7XG5jbGFzcyBNb3ZlbWVudFBvaW50IHtcbiAgICBzdGF0aWMgYXJlVG91Y2hpbmcocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocG9pbnQxLnBvc2l0aW9uLCBwb2ludDIucG9zaXRpb24pIDwgcG9pbnQxLnNpemUgKyBwb2ludDIuc2l6ZTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIHZlbG9jaXR5LCBhY2NlbGVyYXRpb24sIHNpemUpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgIH1cbiAgICB1cGRhdGVQb3NpdGlvbihkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24ueCArPSB0aGlzLnZlbG9jaXR5LnggKiBkZWx0YU1zO1xuICAgICAgICB0aGlzLnBvc2l0aW9uLnkgKz0gdGhpcy52ZWxvY2l0eS55ICogZGVsdGFNcztcbiAgICB9XG4gICAgcHJvamVjdFRvRmluYWxQb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludF8xLlBvaW50KHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLngsIHRoaXMudmVsb2NpdHkueCksIHRoaXMuY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbih0aGlzLnBvc2l0aW9uLnksIHRoaXMudmVsb2NpdHkueSkpO1xuICAgIH1cbiAgICBnZXRTcGVlZCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLnZlbG9jaXR5LngsIDIpICsgTWF0aC5wb3codGhpcy52ZWxvY2l0eS55LCAyKSk7XG4gICAgfVxuICAgIGdldFNwZWVkQW5nbGUoKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMudmVsb2NpdHkueSwgdGhpcy52ZWxvY2l0eS54KTtcbiAgICB9XG4gICAgYWRqdXN0VG9NYXhTcGVlZChtYXhTcGVlZCkge1xuICAgICAgICBjb25zdCBzcGVlZCA9IE1hdGgubWluKHRoaXMuZ2V0U3BlZWQoKSwgbWF4U3BlZWQpO1xuICAgICAgICBjb25zdCBhbmdsZSA9IHRoaXMuZ2V0U3BlZWRBbmdsZSgpO1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIHNldFNwZWVkKHNwZWVkLCBhbmdsZSkge1xuICAgICAgICB0aGlzLnZlbG9jaXR5LnggPSBNYXRoLmNvcyhhbmdsZSkgKiBzcGVlZDtcbiAgICAgICAgdGhpcy52ZWxvY2l0eS55ID0gTWF0aC5zaW4oYW5nbGUpICogc3BlZWQ7XG4gICAgfVxuICAgIGRlY3JlbWVudFNwZWVkKGRlbHRhTXMpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFNwZWVkID0gdGhpcy5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoY3VycmVudFNwZWVkID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbmV3U3BlZWQgPSBNYXRoLm1heChjdXJyZW50U3BlZWQgLSB0aGlzLmFjY2VsZXJhdGlvbiAqIGRlbHRhTXMsIDApO1xuICAgICAgICAgICAgY29uc3QgcmF0aW8gPSBuZXdTcGVlZCAvIGN1cnJlbnRTcGVlZDtcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueCAqPSByYXRpbztcbiAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSAqPSByYXRpbztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55KSwgbmV3IFBvaW50XzEuUG9pbnQodGhpcy52ZWxvY2l0eS54LCB0aGlzLnZlbG9jaXR5LnkpLCB0aGlzLmFjY2VsZXJhdGlvbiwgdGhpcy5zaXplKTtcbiAgICB9XG4gICAgY2FsY3VsYXRlRGVzdGluYXRpb25Qb3NpdGlvbihwb3NpdGlvbiwgc3BlZWQpIHtcbiAgICAgICAgd2hpbGUgKE1hdGguYWJzKHNwZWVkKSA+IDApIHtcbiAgICAgICAgICAgIHBvc2l0aW9uICs9IHNwZWVkO1xuICAgICAgICAgICAgc3BlZWQgPSBNYXRoLnNpZ24oc3BlZWQpICogTWF0aC5tYXgoTWF0aC5hYnMoc3BlZWQpIC0gdGhpcy5hY2NlbGVyYXRpb24sIDApO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHNwZWVkKSA8PSB0aGlzLmFjY2VsZXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHNwZWVkID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfVxufVxuZXhwb3J0cy5Nb3ZlbWVudFBvaW50ID0gTW92ZW1lbnRQb2ludDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Qb2ludCA9IHZvaWQgMDtcbmNsYXNzIFBvaW50IHtcbiAgICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXREaXN0YW5jZShwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50MS54IC0gcG9pbnQyLngsIDIpICsgTWF0aC5wb3cocG9pbnQxLnkgLSBwb2ludDIueSwgMikpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHBvaW50Mi55IC0gcG9pbnQxLnksIHBvaW50Mi54IC0gcG9pbnQxLngpO1xuICAgIH1cbiAgICBzdGF0aWMgYXJlUG9pbnRFcXVhbHMocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIHBvaW50MS54ID09PSBwb2ludDIueCAmJiBwb2ludDEueSA9PT0gcG9pbnQyLnk7XG4gICAgfVxufVxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkhpc3RvcnlQb2ludCA9IGV4cG9ydHMuUG9zaXRpb25IaXN0b3J5ID0gdm9pZCAwO1xuY2xhc3MgUG9zaXRpb25IaXN0b3J5IHtcbiAgICBjb25zdHJ1Y3RvcihyZXRlbnRpb25UaW1lKSB7XG4gICAgICAgIHRoaXMucmV0ZW50aW9uVGltZSA9IHJldGVudGlvblRpbWU7XG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgfVxuICAgIGFkZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb25zLnB1c2gobmV3IEhpc3RvcnlQb2ludChwb3NpdGlvbiwgMCkpO1xuICAgIH1cbiAgICB1cGRhdGUoZGVsdGFNcykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5mb3JFYWNoKHAgPT4gKHAuZGVsdGEgKz0gZGVsdGFNcykpO1xuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IHRoaXMucG9zaXRpb25zLmZpbHRlcihwID0+IHAuZGVsdGEgPCB0aGlzLnJldGVudGlvblRpbWUpO1xuICAgIH1cbiAgICBnZXRGYWN0b3IoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucG9zaXRpb25zW2luZGV4XS5nZXRGYWN0b3IodGhpcy5yZXRlbnRpb25UaW1lKTtcbiAgICB9XG59XG5leHBvcnRzLlBvc2l0aW9uSGlzdG9yeSA9IFBvc2l0aW9uSGlzdG9yeTtcbmNsYXNzIEhpc3RvcnlQb2ludCB7XG4gICAgY29uc3RydWN0b3IocG9zaXRpb24sIGRlbHRhKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICAgICAgdGhpcy5kZWx0YSA9IGRlbHRhO1xuICAgIH1cbiAgICBnZXRGYWN0b3IocmV0ZW50aW9uVGltZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWx0YSAvIHJldGVudGlvblRpbWU7XG4gICAgfVxufVxuZXhwb3J0cy5IaXN0b3J5UG9pbnQgPSBIaXN0b3J5UG9pbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBFdmVudEJ1c1V0aWxpdGllc18xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0V2ZW50QnVzVXRpbGl0aWVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBHYW1lU3RhdHVzTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoYnVzKSB7XG4gICAgICAgIHRoaXMuX2dhbWVTdGF0dXMgPSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VO1xuICAgICAgICB0aGlzLnN0YXR1c1N0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkRXZlbnRzID0gW107XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgICAgIHRoaXMuYnVzID0gYnVzO1xuICAgIH1cbiAgICBjaGFuZ2VTdGF0dXMoZ2FtZVN0YXR1cykge1xuICAgICAgICB0aGlzLl9nYW1lU3RhdHVzID0gZ2FtZVN0YXR1cztcbiAgICAgICAgdGhpcy5zdGF0dXNTdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXQgZ2FtZVN0YXR1cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhbWVTdGF0dXM7XG4gICAgfVxuICAgIGlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkge1xuICAgICAgICByZXR1cm4gRGF0ZS5ub3coKSAtIHRoaXMuc3RhdHVzU3RhcnRUaW1lIDwgMzAwO1xuICAgIH1cbiAgICBzY2hlZHVsZVN0YXR1c0NoYW5nZShkZWxheSwgZ2FtZVN0YXR1cykge1xuICAgICAgICBjb25zdCBleGlzdGluZ0V2ZW50ID0gdGhpcy5zY2hlZHVsZWRFdmVudHMuZmluZChlID0+IGUuZ2FtZVN0YXR1cyA9PT0gZ2FtZVN0YXR1cyk7XG4gICAgICAgIGlmICghZXhpc3RpbmdFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdGltZTogdGhpcy50aW1lICsgZGVsYXksXG4gICAgICAgICAgICAgICAgZ2FtZVN0YXR1czogZ2FtZVN0YXR1cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnRpbWUgKz0gZGVsdGE7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLnNjaGVkdWxlZEV2ZW50cykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZSA+PSBlLnRpbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZVN0YXR1cyhlLmdhbWVTdGF0dXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnVzLnB1Ymxpc2goRXZlbnRCdXNVdGlsaXRpZXNfMS5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQodGhpcy5nYW1lU3RhdHVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlZHVsZWRFdmVudHMgPSB0aGlzLnNjaGVkdWxlZEV2ZW50cy5maWx0ZXIoZSA9PiB0aGlzLnRpbWUgPCBlLnRpbWUpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2FtZVN0YXR1c01hbmFnZXIgPSBHYW1lU3RhdHVzTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZU1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNsYXNzIFNjb3JlTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGVmdFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5yaWdodFNjb3JlID0gMDtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlVGltZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdFNpZGVVcGRhdGVkID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuTEVGVDtcbiAgICAgICAgdGhpcy5tYXhTY29yZSA9IDEwO1xuICAgICAgICB0aGlzLnN1YnN0aXR1dGlvbkdvYWxzID0gMztcbiAgICB9XG4gICAgaW5jcmVhc2VTY29yZShwbGF5ZXJTaWRlKSB7XG4gICAgICAgIGlmIChwbGF5ZXJTaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgdGhpcy5yaWdodFNjb3JlKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxlZnRTY29yZSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLmxhc3RTaWRlVXBkYXRlZCA9IHBsYXllclNpZGU7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgICB0aGlzLmxlZnRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMucmlnaHRTY29yZSA9IDA7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICBnZXRTY29yZUFzQXJyYXkoKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IFN0cmluZyh0aGlzLmxlZnRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpICsgU3RyaW5nKHRoaXMucmlnaHRTY29yZSkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgICAgICByZXR1cm4gb3V0cHV0U3RyaW5nLnNwbGl0KFwiXCIpLm1hcChOdW1iZXIpO1xuICAgIH1cbiAgICBzaG91bGRBbmltYXRlSW5kZXgoaW5kZXgpIHtcbiAgICAgICAgaWYgKHRoaXMubGFzdFNpZGVVcGRhdGVkID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCkge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4IDwgMjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+PSAyO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBsYXN0VXBkYXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlVGltZTtcbiAgICB9XG4gICAgZ2V0IGlzR2FtZU92ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxlZnRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSB8fCB0aGlzLnJpZ2h0U2NvcmUgPT09IHRoaXMubWF4U2NvcmU7XG4gICAgfVxuICAgIGdldFdpbm5pbmdQbGF5ZXJTaWRlKCkge1xuICAgICAgICBpZiAodGhpcy5sZWZ0U2NvcmUgPT09IHRoaXMubWF4U2NvcmUpIHtcbiAgICAgICAgICAgIHJldHVybiBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMucmlnaHRTY29yZSA9PT0gdGhpcy5tYXhTY29yZSkge1xuICAgICAgICAgICAgcmV0dXJuIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaXNTdWJzdGl0dXRpb25UaW1lKCkge1xuICAgICAgICBjb25zdCB0b3RhbFNjb3JlID0gdGhpcy5sZWZ0U2NvcmUgKyB0aGlzLnJpZ2h0U2NvcmU7XG4gICAgICAgIHJldHVybiB0b3RhbFNjb3JlID4gMCAmJiB0b3RhbFNjb3JlICUgdGhpcy5zdWJzdGl0dXRpb25Hb2FscyA9PT0gMDtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlTWFuYWdlciA9IFNjb3JlTWFuYWdlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYXRlU3lzdGVtID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBHYXRlU3lzdGVtIHtcbiAgICB1cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGdhbWVXb3JsZC5nYXRlcy51cGRhdGUoZGVsdGFNcywgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT04pO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZVN5c3RlbSA9IEdhdGVTeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IEtleWJvYXJkSW5wdXRNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vLi4vaW5wdXQvS2V5Ym9hcmRJbnB1dE1hbmFnZXJcIik7XG5jb25zdCBDaGVja2VyU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9jaGVja2Vycy9DaGVja2VyU3lzdGVtXCIpO1xuY29uc3QgQ29sbGlzaW9uU3lzdGVtXzEgPSByZXF1aXJlKFwiLi9jb2xsaXNpb24vQ29sbGlzaW9uU3lzdGVtXCIpO1xuY29uc3QgR2F0ZVN5c3RlbV8xID0gcmVxdWlyZShcIi4vR2F0ZVN5c3RlbVwiKTtcbmNvbnN0IE1vdmVtZW50U3lzdGVtXzEgPSByZXF1aXJlKFwiLi9tb3ZlbWVudC9Nb3ZlbWVudFN5c3RlbVwiKTtcbmNsYXNzIE1haW5TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuc3lzdGVtcyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLnN5c3RlbXMucHVzaChuZXcgTW92ZW1lbnRTeXN0ZW1fMS5Nb3ZlbWVudFN5c3RlbShnYW1lQ29uZmlncywgbmV3IEtleWJvYXJkSW5wdXRNYW5hZ2VyXzEuS2V5Ym9hcmRJbnB1dE1hbmFnZXIoKSkpO1xuICAgICAgICB0aGlzLnN5c3RlbXMucHVzaChuZXcgQ29sbGlzaW9uU3lzdGVtXzEuQ29sbGlzaW9uU3lzdGVtKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5wdXNoKG5ldyBHYXRlU3lzdGVtXzEuR2F0ZVN5c3RlbSgpKTtcbiAgICAgICAgdGhpcy5zeXN0ZW1zLnB1c2gobmV3IENoZWNrZXJTeXN0ZW1fMS5DaGVja2VyU3lzdGVtKCkpO1xuICAgIH1cbiAgICB1cGRhdGUoZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuc3lzdGVtcy5mb3JFYWNoKHN5c3RlbSA9PiBzeXN0ZW0udXBkYXRlKGdhbWVXb3JsZCwgZGVsdGFNcykpO1xuICAgIH1cbn1cbmV4cG9ydHMuTWFpblN5c3RlbSA9IE1haW5TeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ2hlY2tlclN5c3RlbSA9IHZvaWQgMDtcbmNvbnN0IFN1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9TdWJzdGl0dXRpb25DaGVja2VyU3RyYXRlZ3lcIik7XG5jb25zdCBXYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneVwiKTtcbmNsYXNzIENoZWNrZXJTeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFN1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneV8xLlN1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5zdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsQ2hlY2tlclN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3koKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIF9kZWx0YU1zKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llc1xuICAgICAgICAgICAgLmZpbHRlcihzdHJhdGVneSA9PiBzdHJhdGVneS5jYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZCkpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ2hlY2tlclN5c3RlbSA9IENoZWNrZXJTeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU3Vic3RpdHV0aW9uQ2hlY2tlclN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTjtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGFyZUFsbFBsYXllcnNJbkluaXRpYWxQb3NpdGlvbiA9IGdhbWVXb3JsZC5wbGF5ZXJzLmV2ZXJ5KHBsYXllciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gUG9pbnRfMS5Qb2ludC5hcmVQb2ludEVxdWFscyhwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgcGxheWVyLmluaXRpYWxQb3NpdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYXJlQWxsUGxheWVyc0luSW5pdGlhbFBvc2l0aW9uKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlN1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneSA9IFN1YnN0aXR1dGlvbkNoZWNrZXJTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3kge1xuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEw7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBhcmVBbGxQbGF5ZXJzSW5Qb3NpdGlvbiA9IGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5ldmVyeShwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgaXNCYWxsU3RvcHBlZCA9IGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA9PT0gMDtcbiAgICAgICAgaWYgKGFyZUFsbFBsYXllcnNJblBvc2l0aW9uICYmIGlzQmFsbFN0b3BwZWQpIHtcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5zY2hlZHVsZVN0YXR1c0NoYW5nZSgxNTAwLCBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxDaGVja2VyU3RyYXRlZ3kgPSBXYWl0aW5nQmFsbENoZWNrZXJTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Db2xsaXNpb25TeXN0ZW0gPSB2b2lkIDA7XG5jb25zdCBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL0JhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IEJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNvbnN0IFBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL1BsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY29uc3QgUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBDb2xsaXNpb25TeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcyA9IFtdO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbFBsYXllckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5ZXJCb3JkZXJDb2xsaXNpb25TdHJhdGVneV8xLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5ZXJDb2xsaXNpb25TdHJhdGVneV8xLlBsYXllckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEJvcmRlckNvbGxpc2lvblN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuc3RyYXRlZ2llcy5wdXNoKG5ldyBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5XzEuQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneShnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXMucHVzaChuZXcgQm91bmNpbmdQb3dlclNob3RDb2xsaXNpb25TdHJhdGVneV8xLkJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICB9XG4gICAgdXBkYXRlKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLnN0cmF0ZWdpZXNcbiAgICAgICAgICAgIC5maWx0ZXIoc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAuZm9yRWFjaChzdHJhdGVneSA9PiBzdHJhdGVneS5hcHBseShnYW1lV29ybGQpKTtcbiAgICB9XG59XG5leHBvcnRzLkNvbGxpc2lvblN5c3RlbSA9IENvbGxpc2lvblN5c3RlbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBCb3JkZXJMaW1pdHNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Cb3JkZXJMaW1pdHNcIik7XG5jbGFzcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGdldEZpZWxkQm9yZGVyTGltaXRzKHNpemUpIHtcbiAgICAgICAgY29uc3QgY2ZnID0gdGhpcy5nYW1lQ29uZmlncztcbiAgICAgICAgcmV0dXJuIG5ldyBCb3JkZXJMaW1pdHNfMS5Cb3JkZXJMaW1pdHMoY2ZnLmZpZWxkWE9mZnNldCArIHNpemUsIGNmZy5maWVsZFhPZmZzZXQgKyBjZmcuZmllbGRXaWR0aCAtIHNpemUsIGNmZy5maWVsZEJvcmRlclNpemUgKyBzaXplLCBjZmcuZmllbGRIZWlnaHQgLSBjZmcuZmllbGRCb3JkZXJTaXplIC0gc2l6ZSk7XG4gICAgfVxuICAgIGhhbmRsZUJvcmRlckNvbGxpc2lvbihtb3ZlbWVudFBvaW50LCBib3JkZXJMaW1pdHMsIGludmVydFNwZWVkLCBhdm9pZEJvdW5jZU9uR29hbCA9IHRydWUsIGF2b2lkQm91bmNlT25TdWJzdGl0dXRpb24gPSBmYWxzZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICBjb25zdCBpc0luR29hbFlSYW5nZSA9ICFhdm9pZEJvdW5jZU9uR29hbCAmJlxuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID49IGNmZy5nb2FsWU9mZnNldCAmJlxuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55IDw9IGNmZy5nb2FsWU9mZnNldCArIGNmZy5nb2FsSGVpZ2h0O1xuICAgICAgICBjb25zdCBpc0luU3Vic3RpdHV0aW9uWVJhbmdlID0gYXZvaWRCb3VuY2VPblN1YnN0aXR1dGlvbiAmJlxuICAgICAgICAgICAgKChtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPj0gY2ZnLnBsYXllclN1YnN0aXR1dGlvblggLSBjZmcuZ2F0ZXNMZW5ndGggLyAyICYmXG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54IDw9IGNmZy5wbGF5ZXJTdWJzdGl0dXRpb25YICsgY2ZnLmdhdGVzTGVuZ3RoIC8gMikgfHxcbiAgICAgICAgICAgICAgICAobW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID49IGNmZy5jcHVTdWJzdGl0dXRpb25YIC0gY2ZnLmdhdGVzTGVuZ3RoIC8gMiAmJlxuICAgICAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPD0gY2ZnLmNwdVN1YnN0aXR1dGlvblggKyBjZmcuZ2F0ZXNMZW5ndGggLyAyKSk7XG4gICAgICAgIGxldCBoYXNDb2xsaWRlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoIWlzSW5Hb2FsWVJhbmdlICYmIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueCA8IGJvcmRlckxpbWl0cy5sZWZ0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMubGVmdDtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGguYWJzKG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSBNYXRoLm1heCgwLCBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNJbkdvYWxZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi54ID4gYm9yZGVyTGltaXRzLnJpZ2h0KSB7XG4gICAgICAgICAgICBtb3ZlbWVudFBvaW50LnBvc2l0aW9uLnggPSBib3JkZXJMaW1pdHMucmlnaHQ7XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnggPSAtTWF0aC5hYnMobW92ZW1lbnRQb2ludC52ZWxvY2l0eS54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCA9IE1hdGgubWluKDAsIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA8IGJvcmRlckxpbWl0cy50b3ApIHtcbiAgICAgICAgICAgIG1vdmVtZW50UG9pbnQucG9zaXRpb24ueSA9IGJvcmRlckxpbWl0cy50b3A7XG4gICAgICAgICAgICBoYXNDb2xsaWRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaW52ZXJ0U3BlZWQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkgPSBNYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5tYXgoMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzSW5TdWJzdGl0dXRpb25ZUmFuZ2UgJiYgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID4gYm9yZGVyTGltaXRzLmJvdHRvbSkge1xuICAgICAgICAgICAgbW92ZW1lbnRQb2ludC5wb3NpdGlvbi55ID0gYm9yZGVyTGltaXRzLmJvdHRvbTtcbiAgICAgICAgICAgIGhhc0NvbGxpZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpbnZlcnRTcGVlZCkge1xuICAgICAgICAgICAgICAgIG1vdmVtZW50UG9pbnQudmVsb2NpdHkueSA9IC1NYXRoLmFicyhtb3ZlbWVudFBvaW50LnZlbG9jaXR5LnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55ID0gTWF0aC5taW4oMCwgbW92ZW1lbnRQb2ludC52ZWxvY2l0eS55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGFzQ29sbGlkZWQ7XG4gICAgfVxuICAgIGdldEdvYWxCb3JkZXJMaW1pdHMoc2l6ZSwgcGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCBjZmcgPSB0aGlzLmdhbWVDb25maWdzO1xuICAgICAgICBjb25zdCB0b3AgPSBjZmcuZ29hbFlPZmZzZXQgKyBzaXplO1xuICAgICAgICBjb25zdCBib3R0b20gPSBjZmcuZ29hbFlPZmZzZXQgKyBjZmcuZ29hbEhlaWdodCAtIHNpemU7XG4gICAgICAgIGlmIChwbGF5ZXJTaWRlID09PSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJvcmRlckxpbWl0c18xLkJvcmRlckxpbWl0cyhzaXplLCBjZmcuZmllbGRYT2Zmc2V0IC0gc2l6ZSwgdG9wLCBib3R0b20pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQm9yZGVyTGltaXRzXzEuQm9yZGVyTGltaXRzKGNmZy5maWVsZFhPZmZzZXQgKyBjZmcuZmllbGRXaWR0aCArIHNpemUsIGNmZy53aWR0aCAtIHNpemUsIHRvcCwgYm90dG9tKTtcbiAgICB9XG59XG5leHBvcnRzLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kgPSBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxCb3JkZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5oYW5kbGVCb3JkZXJDb2xsaXNpb24oYmFsbE1vdmVtZW50LCB0aGlzLmdldEZpZWxkQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplKSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlQpO1xuICAgICAgICB0aGlzLmNoZWNrSWZCYWxsSW5zaWRlR29hbChnYW1lV29ybGQsIFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLlJJR0hUKTtcbiAgICB9XG4gICAgY2hlY2tJZkJhbGxJbnNpZGVHb2FsKGdhbWVXb3JsZCwgcGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCBiYWxsTW92ZW1lbnQgPSBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uO1xuICAgICAgICBjb25zdCBnb2FsQm9yZGVyID0gdGhpcy5nZXRHb2FsQm9yZGVyTGltaXRzKGJhbGxNb3ZlbWVudC5zaXplLCBwbGF5ZXJTaWRlKTtcbiAgICAgICAgaWYgKGdvYWxCb3JkZXIuaXNQb2ludEluc2lkZShiYWxsTW92ZW1lbnQucG9zaXRpb24pKSB7XG4gICAgICAgICAgICBnYW1lV29ybGQuaW5jcmVhc2VTY29yZShQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZVV0aWxpdGllcy5nZXRPcHBvc2l0ZVNpZGUocGxheWVyU2lkZSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICgoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCB8fFxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuU1VCU1RJVElPTikgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IDApO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgYmFsbE1vdmVtZW50ID0gZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbjtcbiAgICAgICAgbGV0IHNpZGUgPSBQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUO1xuICAgICAgICBpZiAoYmFsbE1vdmVtZW50LnBvc2l0aW9uLnggPlxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGggLyAyKSB7XG4gICAgICAgICAgICBzaWRlID0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZ29hbEJvcmRlciA9IHRoaXMuZ2V0R29hbEJvcmRlckxpbWl0cyhiYWxsTW92ZW1lbnQuc2l6ZSwgc2lkZSk7XG4gICAgICAgIHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKGJhbGxNb3ZlbWVudCwgZ29hbEJvcmRlciwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5CYWxsR29hbENvbGxpc2lvblN0cmF0ZWd5ID0gQmFsbEdvYWxDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5CYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgQmFsbEdvYWxTdGFrZXNDb2xsaXNpb25TdHJhdGVneSBleHRlbmRzIEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMS5BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICBzdXBlcihnYW1lQ29uZmlncyk7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQuZ29hbFBvc3RzLnBvc2l0aW9ucy5mb3JFYWNoKHBvc2l0aW9uID0+IHtcbiAgICAgICAgICAgIGlmIChQb2ludF8xLlBvaW50LmdldERpc3RhbmNlKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSA8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zaXplICsgZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbmdsZSA9IFBvaW50XzEuUG9pbnQuZ2V0QW5nbGVCZXR3ZWVuUG9pbnRzKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIHBvc2l0aW9uKSAtIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCksIGFuZ2xlKTtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi54ICsgTWF0aC5jb3MoYW5nbGUpICogZ2FtZVdvcmxkLmdvYWxQb3N0cy5yYWRpdXM7XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55ID1cbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueSArIE1hdGguc2luKGFuZ2xlKSAqIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxHb2FsU3Rha2VzQ29sbGlzaW9uU3RyYXRlZ3kgPSBCYWxsR29hbFN0YWtlc0NvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCYWxsUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5iYWxsLmJhbGxQb3dlclNob3Quc2hvdWxkU3RvcE9uUGxheWVyQm91bmNlKCkpO1xuICAgIH1cbiAgICBhcHBseShnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnNcbiAgICAgICAgICAgIC5maWx0ZXIocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlKVxuICAgICAgICAgICAgLmZvckVhY2gocGxheWVyID0+IHtcbiAgICAgICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhnYW1lV29ybGQuYmFsbC5tb3ZlbWVudFBvc2l0aW9uLCBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuYmFsbC5hdHRhY2hUb1BsYXllcihwbGF5ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IEJhbGxQbGF5ZXJDb2xsaXNpb25TdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5Cb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNvbnN0IEFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL0Fic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3lcIik7XG5jbGFzcyBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGdhbWVXb3JsZC5iYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICAhZ2FtZVdvcmxkLmJhbGwuYmFsbFBvd2VyU2hvdC5zaG91bGRTdG9wT25QbGF5ZXJCb3VuY2UoKSk7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVyc1xuICAgICAgICAgICAgLmZpbHRlcihwbGF5ZXIgPT4gIXBsYXllci5pc1N1YnN0aXR1dGUpXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgaWYgKE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50LmFyZVRvdWNoaW5nKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24sIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pZGRsZVBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpIC9cbiAgICAgICAgICAgICAgICAgICAgMiwgKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAgICAgMik7XG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhtaWRkbGVQb2ludCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNldFNwZWVkKGdhbWVXb3JsZC5iYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSwgYW5nbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkJvdW5jaW5nUG93ZXJTaG90Q29sbGlzaW9uU3RyYXRlZ3kgPSBCb3VuY2luZ1Bvd2VyU2hvdENvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9BYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XCIpO1xuY2xhc3MgUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3kgZXh0ZW5kcyBBYnN0cmFjdENvbGxpc2lvblN0cmF0ZWd5XzEuQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgc3VwZXIoZ2FtZUNvbmZpZ3MpO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoX2dhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgYXBwbHkoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGdhbWVXb3JsZC5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdm9pZEJvdW5jZU9uU3Vic3RpdHV0aW9uID0gZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT047XG4gICAgICAgICAgICBjb25zdCBoYXNDb2xsaWRlZCA9IHRoaXMuaGFuZGxlQm9yZGVyQ29sbGlzaW9uKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLCB0aGlzLmdldEZpZWxkQm9yZGVyTGltaXRzKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUpLCBmYWxzZSwgdHJ1ZSwgYXZvaWRCb3VuY2VPblN1YnN0aXR1dGlvbik7XG4gICAgICAgICAgICBpZiAoaGFzQ29sbGlkZWQpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc3RhcnRCb3VuY2luZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllckJvcmRlckNvbGxpc2lvblN0cmF0ZWd5ID0gUGxheWVyQm9yZGVyQ29sbGlzaW9uU3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyQ29sbGlzaW9uU3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY29uc3QgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xID0gcmVxdWlyZShcIi4vQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneVwiKTtcbmNsYXNzIFBsYXllckNvbGxpc2lvblN0cmF0ZWd5IGV4dGVuZHMgQWJzdHJhY3RDb2xsaXNpb25TdHJhdGVneV8xLkFic3RyYWN0Q29sbGlzaW9uU3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzKSB7XG4gICAgICAgIHN1cGVyKGdhbWVDb25maWdzKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKF9nYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGFwcGx5KGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBodW1hblBsYXllciA9IGdhbWVXb3JsZC5wbGF5ZXJzLmZpbmQocGxheWVyID0+ICFwbGF5ZXIuaXNTdWJzdGl0dXRlICYmICFwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBjb25zdCBjcHVQbGF5ZXIgPSBnYW1lV29ybGQucGxheWVycy5maW5kKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSAmJiBwbGF5ZXIuaXNDcHUpO1xuICAgICAgICBpZiAoaHVtYW5QbGF5ZXIgPT09IHVuZGVmaW5lZCB8fCBjcHVQbGF5ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludC5hcmVUb3VjaGluZyhodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLCBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORykge1xuICAgICAgICAgICAgICAgIGh1bWFuUGxheWVyLnN0dW5uZWRXcmFwcGVyLnVwZGF0ZVN0dW5uZWRWYWx1ZShjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKTtcbiAgICAgICAgICAgICAgICBjcHVQbGF5ZXIuc3R1bm5lZFdyYXBwZXIudXBkYXRlU3R1bm5lZFZhbHVlKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3Rpb25Qb2ludCA9IG5ldyBQb2ludF8xLlBvaW50KChodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggKyBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KSAvXG4gICAgICAgICAgICAgICAgMiwgKGh1bWFuUGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArIGNwdVBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAyKTtcbiAgICAgICAgICAgIGh1bWFuUGxheWVyLnN0YXJ0Qm91bmNpbmcoKTtcbiAgICAgICAgICAgIGNwdVBsYXllci5zdGFydEJvdW5jaW5nKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xsaXNpb25TcGVlZCA9IChodW1hblBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgKyBjcHVQbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpKSAvXG4gICAgICAgICAgICAgICAgMjtcbiAgICAgICAgICAgIHRoaXMuYm91bmNlUGxheWVycyhodW1hblBsYXllciwgY3B1UGxheWVyLCBpbnRlcnNlY3Rpb25Qb2ludCwgY29sbGlzaW9uU3BlZWQpO1xuICAgICAgICAgICAgdGhpcy5ib3VuY2VQbGF5ZXJzKGNwdVBsYXllciwgaHVtYW5QbGF5ZXIsIGludGVyc2VjdGlvblBvaW50LCBjb2xsaXNpb25TcGVlZCk7XG4gICAgICAgICAgICBjb25zdCBiYWxsID0gZ2FtZVdvcmxkLmJhbGw7XG4gICAgICAgICAgICBpZiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCkge1xuICAgICAgICAgICAgICAgIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChjb2xsaXNpb25TcGVlZCwgUG9pbnRfMS5Qb2ludC5nZXRBbmdsZUJldHdlZW5Qb2ludHMoaW50ZXJzZWN0aW9uUG9pbnQsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbikpO1xuICAgICAgICAgICAgICAgIGJhbGwuYmFsbFN0YXR1cyA9IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkZSRUU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYm91bmNlUGxheWVycyhwbGF5ZXIxLCBwbGF5ZXIyLCBpbnRlcnNlY3Rpb25Qb2ludCwgY29sbGlzaW9uU3BlZWQpIHtcbiAgICAgICAgY29uc3QgYW5nbGUgPSBQb2ludF8xLlBvaW50LmdldEFuZ2xlQmV0d2VlblBvaW50cyhwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24sIGludGVyc2VjdGlvblBvaW50KSAtXG4gICAgICAgICAgICBNYXRoLlBJO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoY29sbGlzaW9uU3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgcGxheWVyMS5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgaW50ZXJzZWN0aW9uUG9pbnQueCArIE1hdGguY29zKGFuZ2xlKSAqIHBsYXllcjIubW92ZW1lbnRQb3NpdGlvbi5zaXplO1xuICAgICAgICBwbGF5ZXIxLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSA9XG4gICAgICAgICAgICBpbnRlcnNlY3Rpb25Qb2ludC55ICsgTWF0aC5zaW4oYW5nbGUpICogcGxheWVyMi5tb3ZlbWVudFBvc2l0aW9uLnNpemU7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJDb2xsaXNpb25TdHJhdGVneSA9IFBsYXllckNvbGxpc2lvblN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1vdmVtZW50U3lzdGVtID0gdm9pZCAwO1xuY29uc3QgQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL0F0dGFjaGVkV2l0aG91dEtleVByZXNzZWRCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IE1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9Nb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL2JhbGxTdHJhdGVnaWVzL1BsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9iYWxsU3RyYXRlZ2llcy9XYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgQ3B1TW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvQ3B1TW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xID0gcmVxdWlyZShcIi4vcGxheWVyc1N0cmF0ZWdpZXMvSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgTWVudU1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL01lbnVNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL1N0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XCIpO1xuY29uc3QgU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3lcIik7XG5jb25zdCBXYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3lfMSA9IHJlcXVpcmUoXCIuL3BsYXllcnNTdHJhdGVnaWVzL1dhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNvbnN0IFdpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEgPSByZXF1aXJlKFwiLi9wbGF5ZXJzU3RyYXRlZ2llcy9XaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneVwiKTtcbmNsYXNzIE1vdmVtZW50U3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywga2V5Ym9hcmRJbnB1dE1hbmFnZXIpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzID0gW107XG4gICAgICAgIHRoaXMuYmFsbFN0cmF0ZWdpZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IE1lbnVNb3ZlbWVudFN0cmF0ZWd5XzEuTWVudU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneV8xLldhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IElucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneV8xLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneShrZXlib2FyZElucHV0TWFuYWdlcikpO1xuICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXMucHVzaChuZXcgQ3B1TW92ZW1lbnRTdHJhdGVneV8xLkNwdU1vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdHJhdGVnaWVzLnB1c2gobmV3IFN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5XzEuU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3koKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneV8xLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVyU3RyYXRlZ2llcy5wdXNoKG5ldyBTdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3lfMS5TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3koZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBXYWl0aW5nQmFsbEJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5XzEuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSgpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3lfMS5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3koa2V5Ym9hcmRJbnB1dE1hbmFnZXIpKTtcbiAgICAgICAgdGhpcy5iYWxsU3RyYXRlZ2llcy5wdXNoKG5ldyBNb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneV8xLk1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5KGdhbWVDb25maWdzKSk7XG4gICAgfVxuICAgIHVwZGF0ZShnYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcyk7XG4gICAgICAgIHRoaXMudXBkYXRlQmFsbChnYW1lV29ybGQsIGRlbHRhTXMpO1xuICAgIH1cbiAgICB1cGRhdGVQbGF5ZXJzKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsYXllclN0cmF0ZWdpZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkpXG4gICAgICAgICAgICAgICAgLmZvckVhY2goc3RyYXRlZ3kgPT4gc3RyYXRlZ3kuYXBwbHkocGxheWVyLCBnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICAgICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5kZWNyZW1lbnRTdHVubmVkVmFsdWUoZGVsdGFNcyk7XG4gICAgICAgICAgICBwbGF5ZXIudXBkYXRlUG93ZXJTaG90KGRlbHRhTXMpO1xuICAgICAgICAgICAgcGxheWVyLm1vdmUoZGVsdGFNcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVCYWxsKGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICB0aGlzLmJhbGxTdHJhdGVnaWVzXG4gICAgICAgICAgICAuZmlsdGVyKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmNhbkJlQXBwbGllZChnYW1lV29ybGQuYmFsbCwgZ2FtZVdvcmxkKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHN0cmF0ZWd5ID0+IHN0cmF0ZWd5LmFwcGx5KGdhbWVXb3JsZC5iYWxsLCBnYW1lV29ybGQsIGRlbHRhTXMpKTtcbiAgICAgICAgZ2FtZVdvcmxkLmJhbGwudXBkYXRlVHJhamVjdG9yeShkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVtZW50U3lzdGVtID0gTW92ZW1lbnRTeXN0ZW07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgQXR0YWNoZWRXaXRoS2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyID0ga2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChiYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3QgcGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgcmV0dXJuIChiYWxsLmJhbGxTdGF0dXMgPT09IEJhbGxTdGF0dXNfMS5CYWxsU3RhdHVzLkFUVEFDSEVEICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgcGxheWVyICE9PSBudWxsICYmXG4gICAgICAgICAgICAhcGxheWVyLmlzQ3B1ICYmXG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmlzS2V5UHJlc3NlZChLZXlzXzEuS2V5cy5TUEFDRSkpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGJhbGwuZGV0YWNoRnJvbVBsYXllcigpO1xuICAgICAgICBiYWxsLm1vdmUoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5BdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBBdHRhY2hlZFdpdGhLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgQmFsbFN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0JhbGxTdGF0dXNcIik7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9LZXlzXCIpO1xuY2xhc3MgQXR0YWNoZWRXaXRob3V0S2V5UHJlc3NlZEJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihrZXlib2FyZElucHV0TWFuYWdlcikge1xuICAgICAgICB0aGlzLmFuZ2xlVG9sbGVyYW5jZSA9IE1hdGguUEkgLyAzMDtcbiAgICAgICAgdGhpcy5rZXlib2FyZElucHV0TWFuYWdlciA9IGtleWJvYXJkSW5wdXRNYW5hZ2VyO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgICF0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmlzS2V5UHJlc3NlZChLZXlzXzEuS2V5cy5TUEFDRSkpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IHBsYXllciA9IGJhbGwuYXR0YWNoZWRQbGF5ZXI7XG4gICAgICAgIGlmIChwbGF5ZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFkanVzdEJhbGxQb3NpdGlvbkFyb3VuZFBsYXllcihiYWxsLCBwbGF5ZXIsIGRlbHRhTXMpO1xuICAgIH1cbiAgICBhZGp1c3RCYWxsUG9zaXRpb25Bcm91bmRQbGF5ZXIoYmFsbCwgcGxheWVyLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGNvbWJpbmVkU2l6ZSA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUgKyBiYWxsLm1vdmVtZW50UG9zaXRpb24uc2l6ZTtcbiAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggPVxuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCArIE1hdGguY29zKGJhbGwuYW5nbGVXaXRoUGxheWVyKSAqIGNvbWJpbmVkU2l6ZTtcbiAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgPVxuICAgICAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSArIE1hdGguc2luKGJhbGwuYW5nbGVXaXRoUGxheWVyKSAqIGNvbWJpbmVkU2l6ZTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoc3BlZWQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRBbmdsZSA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSArIE1hdGguUEk7XG4gICAgICAgICAgICBjb25zdCBhbmdsZURpZmZlcmVuY2UgPSB0aGlzLm5vcm1hbGl6ZUFuZ2xlKHRhcmdldEFuZ2xlIC0gYmFsbC5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGFuZ2xlRGlmZmVyZW5jZSkgPiB0aGlzLmFuZ2xlVG9sbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSAoc3BlZWQgLyBwbGF5ZXIubm9ybWFsTWF4U3BlZWQpICogMC4wMSAqIGRlbHRhTXM7XG4gICAgICAgICAgICAgICAgYmFsbC5hbmdsZVdpdGhQbGF5ZXIgKz0gYW5nbGVEaWZmZXJlbmNlID4gMCA/IHN0ZXAgOiAtc3RlcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJhbGwuYW5nbGVXaXRoUGxheWVyID0gdGFyZ2V0QW5nbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiYWxsLmFuZ2xlV2l0aFBsYXllciA9IHRoaXMubm9ybWFsaXplQW5nbGUoYmFsbC5hbmdsZVdpdGhQbGF5ZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5vcm1hbGl6ZUFuZ2xlKGFuZ2xlKSB7XG4gICAgICAgIHdoaWxlIChhbmdsZSA+IE1hdGguUEkpIHtcbiAgICAgICAgICAgIGFuZ2xlIC09IDIgKiBNYXRoLlBJO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChhbmdsZSA8IC1NYXRoLlBJKSB7XG4gICAgICAgICAgICBhbmdsZSArPSAyICogTWF0aC5QSTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYW5nbGU7XG4gICAgfVxufVxuZXhwb3J0cy5BdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSBBdHRhY2hlZFdpdGhvdXRLZXlQcmVzc2VkQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvQmFsbFN0YXR1c1wiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUGxheWVyU2lkZV8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL1BsYXllclNpZGVcIik7XG5jb25zdCBQb3dlclNob3RUeXBlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUG93ZXJTaG90VHlwZVwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNb3ZlVG9Hb2FsUG93ZXJTaG90TW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5iYWxsUm90YXRlT2Zmc2V0ID0gMjUwO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMubWluR29hbERpc3RhbmNlID0gZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyA1MDtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKGJhbGwsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gKGJhbGwuYmFsbFN0YXR1cyA9PT0gQmFsbFN0YXR1c18xLkJhbGxTdGF0dXMuRlJFRSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIGJhbGwuYmFsbFBvd2VyU2hvdC5zaG91bGRNb3ZlVG9Hb2FsKCkpO1xuICAgIH1cbiAgICBhcHBseShiYWxsLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5nZXREaXJlY3Rpb25EaXN0YW5jZShiYWxsLCBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpKTtcbiAgICAgICAgaWYgKGRpc3RhbmNlID4gdGhpcy5taW5Hb2FsRGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3RhbmNlMSA9IHRoaXMuZ2V0RGlyZWN0aW9uRGlzdGFuY2UoYmFsbCwgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSArIE1hdGguUEkgLyB0aGlzLmJhbGxSb3RhdGVPZmZzZXQpO1xuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2UyID0gdGhpcy5nZXREaXJlY3Rpb25EaXN0YW5jZShiYWxsLCBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpIC0gTWF0aC5QSSAvIHRoaXMuYmFsbFJvdGF0ZU9mZnNldCk7XG4gICAgICAgICAgICBiYWxsLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoYmFsbC5tYXhTcGVlZCAqXG4gICAgICAgICAgICAgICAgUG93ZXJTaG90VHlwZV8xLlBvd2VyU2hvdFV0aWxpdGllcy5nZXRTcGVlZEZhY3RvcihiYWxsLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90VHlwZSgpKSwgZGlzdGFuY2UxIDwgZGlzdGFuY2UyXG4gICAgICAgICAgICAgICAgPyBiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpICtcbiAgICAgICAgICAgICAgICAgICAgKE1hdGguUEkgLyB0aGlzLmJhbGxSb3RhdGVPZmZzZXQpICogZGVsdGFNc1xuICAgICAgICAgICAgICAgIDogYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkQW5nbGUoKSAtXG4gICAgICAgICAgICAgICAgICAgIChNYXRoLlBJIC8gdGhpcy5iYWxsUm90YXRlT2Zmc2V0KSAqIGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldERpcmVjdGlvbkRpc3RhbmNlKGJhbGwsIGJhbGxTcGVlZEFuZ2xlKSB7XG4gICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uWCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICtcbiAgICAgICAgICAgIChiYWxsLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90RGVzdGluYXRpb25TaWRlKCkgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICA/IDBcbiAgICAgICAgICAgICAgICA6IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCk7XG4gICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uWSA9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLyAyO1xuICAgICAgICBsZXQgZGlzdCA9IFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLCBuZXcgUG9pbnRfMS5Qb2ludChkZXN0aW5hdGlvblgsIGRlc3RpbmF0aW9uWSkpO1xuICAgICAgICBjb25zdCBuZXdYID0gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggKyBNYXRoLmNvcyhiYWxsU3BlZWRBbmdsZSkgKiBkaXN0O1xuICAgICAgICBjb25zdCBuZXdZID0gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkgKyBNYXRoLnNpbihiYWxsU3BlZWRBbmdsZSkgKiBkaXN0O1xuICAgICAgICByZXR1cm4gUG9pbnRfMS5Qb2ludC5nZXREaXN0YW5jZShuZXcgUG9pbnRfMS5Qb2ludChuZXdYLCBuZXdZKSwgbmV3IFBvaW50XzEuUG9pbnQoZGVzdGluYXRpb25YLCBkZXN0aW5hdGlvblkpKTtcbiAgICB9XG59XG5leHBvcnRzLk1vdmVUb0dvYWxQb3dlclNob3RNb3ZlbWVudFN0cmF0ZWd5ID0gTW92ZVRvR29hbFBvd2VyU2hvdE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jbGFzcyBQbGF5aW5nRnJlZUJhbGxNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjYW5CZUFwcGxpZWQoYmFsbCwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyk7XG4gICAgfVxuICAgIGFwcGx5KGJhbGwsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgYmFsbC5zZXRGb3JTdGFydEdhbWUoKTtcbiAgICAgICAgYmFsbC5tb3ZlKGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGxheWluZ0ZyZWVCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFBsYXlpbmdGcmVlQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY2xhc3MgV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKF9iYWxsLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICBnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgfHxcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKTtcbiAgICB9XG4gICAgYXBwbHkoYmFsbCwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPiAwKSB7XG4gICAgICAgICAgICBiYWxsLm1vdmUoZGVsdGFNcyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBiYWxsLnJlc2V0VG9TdGFydEdhbWUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxCYWxsTW92ZW1lbnRTdHJhdGVneSA9IFdhaXRpbmdCYWxsQmFsbE1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQ3B1TW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEJhbGxTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBDcHVNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IDA7XG4gICAgICAgIHRoaXMucm90YXRlQW5nbGUgPSAwO1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgICAgIHRoaXMuY2VudGVyRmllbGRYID0gZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDI7XG4gICAgICAgIHRoaXMuZ29hbE9mZnNldCA9IHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCAqIDAuNTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIHBsYXllci5pc0NwdSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlBMQVlJTkcgJiZcbiAgICAgICAgICAgIHBsYXllci5wbGF5ZXJTdGF0dXMgPT09IFBsYXllclN0YXR1c18xLlBsYXllclN0YXR1cy5OT1JNQUwpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBjb25zdCBiYWxsID0gZ2FtZVdvcmxkLmJhbGw7XG4gICAgICAgIGNvbnN0IGF0dGFjaGVkUGxheWVyID0gYmFsbC5hdHRhY2hlZFBsYXllcjtcbiAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IHBsYXllci5ub3JtYWxNYXhTcGVlZDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uUG9zaXRpb24gPSBudWxsO1xuICAgICAgICBpZiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5GUkVFKSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblBvc2l0aW9uID0gYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYmFsbC5iYWxsU3RhdHVzID09PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCAmJiBhdHRhY2hlZFBsYXllciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKCFhdHRhY2hlZFBsYXllci5pc0NwdSkge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9zaXRpb24gPSBhdHRhY2hlZFBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmNsb25lKCk7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb25Qb3NpdGlvbi52ZWxvY2l0eSA9IG5ldyBQb2ludF8xLlBvaW50KDAsIDApO1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9zaXRpb24uYWNjZWxlcmF0aW9uID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54ID4gdGhpcy5jZW50ZXJGaWVsZFgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25Qb3NpdGlvbiA9IG5ldyBNb3ZlbWVudFBvaW50XzEuTW92ZW1lbnRQb2ludChuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAvIDIpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdGF0ZUNwdShwbGF5ZXIsIGRlbHRhTXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRyeUtpY2socGxheWVyLCBiYWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVzdGluYXRpb25Qb3NpdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBkZXN0aW5hdGlvblBvc2l0aW9uO1xuICAgICAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJvdGF0ZUNwdShwbGF5ZXIsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHRoaXMucm90YXRlRGlyZWN0aW9uID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZURpcmVjdGlvbiA9IE1hdGgucmFuZG9tKCkgPCAwLjUgPyAtMSA6IDE7XG4gICAgICAgICAgICB0aGlzLnJvdGF0ZUFuZ2xlID1cbiAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAqIChNYXRoLlBJIC8gNTAgLSBNYXRoLlBJIC8gMTAwKSArIE1hdGguUEkgLyAxMDApICogMC4wNztcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3BlZWQgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZCgpO1xuICAgICAgICBsZXQgYW5nbGUgPSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCk7XG4gICAgICAgIHNwZWVkID0gc3BlZWQgKyBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5hY2NlbGVyYXRpb24gKiBkZWx0YU1zO1xuICAgICAgICBhbmdsZSA9IGFuZ2xlICsgdGhpcy5yb3RhdGVEaXJlY3Rpb24gKiB0aGlzLnJvdGF0ZUFuZ2xlICogZGVsdGFNcztcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uc2V0U3BlZWQoc3BlZWQsIGFuZ2xlKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgdHJ5S2ljayhwbGF5ZXIsIGJhbGwpIHtcbiAgICAgICAgaWYgKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54IDwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgY29uc3QgbSA9IChiYWxsLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueSAtIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpIC9cbiAgICAgICAgICAgICAgICAoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnggLSBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi54KTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBtICogKHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24ucG9zaXRpb24ueCkgK1xuICAgICAgICAgICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnk7XG4gICAgICAgICAgICBpZiAoeSA+PSB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nb2FsT2Zmc2V0ICYmXG4gICAgICAgICAgICAgICAgeSA8PSB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nb2FsT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgYmFsbC5kZXRhY2hGcm9tUGxheWVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkNwdU1vdmVtZW50U3RyYXRlZ3kgPSBDcHVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLklucHV0UGxheWVyTW92ZW1lbnRTdHJhdGVneSA9IHZvaWQgMDtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgS2V5c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0tleXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBJbnB1dFBsYXllck1vdmVtZW50U3RyYXRlZ3kge1xuICAgIGNvbnN0cnVjdG9yKGtleWJvYXJkSW5wdXRNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmRJbnB1dE1hbmFnZXIgPSBrZXlib2FyZElucHV0TWFuYWdlcjtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICFwbGF5ZXIuaXNDcHUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5QTEFZSU5HICYmXG4gICAgICAgICAgICBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuTk9STUFMKTtcbiAgICB9XG4gICAgYXBwbHkocGxheWVyLCBfZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxLZXkgPSB0aGlzLmtleWJvYXJkSW5wdXRNYW5hZ2VyLmdldERpcmVjdGlvblByZXNzZWQoS2V5c18xLktleXNEaXJlY3Rpb24uSE9SSVpPTlRBTCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsS2V5ID0gdGhpcy5rZXlib2FyZElucHV0TWFuYWdlci5nZXREaXJlY3Rpb25QcmVzc2VkKEtleXNfMS5LZXlzRGlyZWN0aW9uLlZFUlRJQ0FMKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCA9IHRoaXMuYXBwbHlBeGlzTW92ZW1lbnQocGxheWVyLm1vdmVtZW50UG9zaXRpb24udmVsb2NpdHkueCwgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWNjZWxlcmF0aW9uLCBkZWx0YU1zLCBob3Jpem9udGFsS2V5LCBLZXlzXzEuS2V5cy5BUlJPV19MRUZULCBLZXlzXzEuS2V5cy5BUlJPV19SSUdIVCk7XG4gICAgICAgIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnkgPSB0aGlzLmFwcGx5QXhpc01vdmVtZW50KHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnZlbG9jaXR5LnksIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLmFjY2VsZXJhdGlvbiwgZGVsdGFNcywgdmVydGljYWxLZXksIEtleXNfMS5LZXlzLkFSUk9XX1VQLCBLZXlzXzEuS2V5cy5BUlJPV19ET1dOKTtcbiAgICAgICAgcGxheWVyLm1vdmVtZW50UG9zaXRpb24uYWRqdXN0VG9NYXhTcGVlZChwbGF5ZXIuY3VycmVudE1heFNwZWVkKTtcbiAgICB9XG4gICAgYXBwbHlBeGlzTW92ZW1lbnQoY3VycmVudFNwZWVkLCBhY2NlbGVyYXRpb24sIGRlbHRhTXMsIGtleSwgbmVnYXRpdmVLZXksIHBvc2l0aXZlS2V5KSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gYWNjZWxlcmF0aW9uICogZGVsdGFNcztcbiAgICAgICAgaWYgKGtleSA9PT0gbmVnYXRpdmVLZXkpXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNwZWVkIC0gZGVsdGE7XG4gICAgICAgIGlmIChrZXkgPT09IHBvc2l0aXZlS2V5KVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTcGVlZCArIGRlbHRhO1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGN1cnJlbnRTcGVlZCkgKiBNYXRoLm1heChNYXRoLmFicyhjdXJyZW50U3BlZWQpIC0gZGVsdGEsIDApO1xuICAgIH1cbn1cbmV4cG9ydHMuSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gSW5wdXRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLk1lbnVNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTaWRlXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvUGxheWVyU2lkZVwiKTtcbmNvbnN0IE1vdmVtZW50UG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Nb3ZlbWVudFBvaW50XCIpO1xuY29uc3QgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9nZW9tZXRyeS9Qb2ludFwiKTtcbmNsYXNzIE1lbnVNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmdhbWVDb25maWdzID0gZ2FtZUNvbmZpZ3M7XG4gICAgfVxuICAgIGNhbkJlQXBwbGllZChwbGF5ZXIsIGdhbWVXb3JsZCkge1xuICAgICAgICByZXR1cm4gIXBsYXllci5pc1N1YnN0aXR1dGUgJiYgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLk1FTlU7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgX2dhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIGxldCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgICgoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgpIC8gMjtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIuc2lkZSA9PT0gUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpIHtcbiAgICAgICAgICAgICAgICB4ICs9IHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB5ID0gKE1hdGgucmFuZG9tKCkgKiAwLjggKyAwLjEpICogdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodDtcbiAgICAgICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KG5ldyBQb2ludF8xLlBvaW50KHgsIHkpLCBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKSwgMCwgMCk7XG4gICAgICAgICAgICBwbGF5ZXIuY3VycmVudE1heFNwZWVkID1cbiAgICAgICAgICAgICAgICAocGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNSkgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkIC8gNztcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuYWRqdXN0U3BlZWRUb0Rlc3RpbmF0aW9uUG9pbnQoZGVsdGFNcyk7XG4gICAgfVxufVxuZXhwb3J0cy5NZW51TW92ZW1lbnRTdHJhdGVneSA9IE1lbnVNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlN0dW5uZWRQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBQbGF5ZXJTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgICh0aGlzLmlzUGxheWVyU3R1bm5lZER1cmluZ1BsYXkocGxheWVyLCBnYW1lV29ybGQpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5oYXNQbGF5ZXJMb3NlZEdhbWUocGxheWVyLCBnYW1lV29ybGQpKSk7XG4gICAgfVxuICAgIGFwcGx5KHBsYXllciwgZ2FtZVdvcmxkLCBkZWx0YU1zKSB7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUpIHtcbiAgICAgICAgICAgIHBsYXllci5zdHVubmVkV3JhcHBlci5mb3JjZVN0dW5uZWQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSA+IHBsYXllci5jdXJyZW50TWF4U3BlZWQgLyA1KSB7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5kZWNyZW1lbnRTcGVlZChkZWx0YU1zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNwZWVkID0gcGxheWVyLmN1cnJlbnRNYXhTcGVlZCAvIDE1O1xuICAgICAgICAgICAgbGV0IGFuZ2xlID0gcGxheWVyLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWRBbmdsZSgpO1xuICAgICAgICAgICAgYW5nbGUgPSBhbmdsZSArIChNYXRoLlBJIC8gMzApICogZGVsdGFNcyAqIDAuMDU7XG4gICAgICAgICAgICBwbGF5ZXIubW92ZW1lbnRQb3NpdGlvbi5zZXRTcGVlZChzcGVlZCwgYW5nbGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlzUGxheWVyU3R1bm5lZER1cmluZ1BsYXkocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyAmJlxuICAgICAgICAgICAgcGxheWVyLnBsYXllclN0YXR1cyA9PT0gUGxheWVyU3RhdHVzXzEuUGxheWVyU3RhdHVzLlNUVU5ORUQpO1xuICAgIH1cbiAgICBoYXNQbGF5ZXJMb3NlZEdhbWUocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgY29uc3Qgd2lubmluZ1BsYXllclNpZGUgPSBnYW1lV29ybGQuc2NvcmUuZ2V0V2lubmluZ1BsYXllclNpZGUoKTtcbiAgICAgICAgcmV0dXJuIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuRU5EX0dBTUUgJiZcbiAgICAgICAgICAgIHdpbm5pbmdQbGF5ZXJTaWRlICE9PSBudWxsICYmXG4gICAgICAgICAgICB3aW5uaW5nUGxheWVyU2lkZSAhPT0gcGxheWVyLnNpZGUpO1xuICAgIH1cbn1cbmV4cG9ydHMuU3R1bm5lZFBsYXllck1vdmVtZW50U3RyYXRlZ3kgPSBTdHVubmVkUGxheWVyTW92ZW1lbnRTdHJhdGVneTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdWJzdGl0dXRlUGxheWVyc01vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNvbnN0IFBsYXllclNpZGVfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9lbnVtcy9QbGF5ZXJTaWRlXCIpO1xuY29uc3QgTW92ZW1lbnRQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L01vdmVtZW50UG9pbnRcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL2dlb21ldHJ5L1BvaW50XCIpO1xuY2xhc3MgU3Vic3RpdHV0ZVBsYXllcnNNb3ZlbWVudFN0cmF0ZWd5IHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5zdWJQb3NpdGlvbnNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZULCB0aGlzLmdldFN1YnN0aXR1dGlvbkRlc3RpbmF0aW9ucyhQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5MRUZUKSk7XG4gICAgICAgIHRoaXMuc3ViUG9zaXRpb25zTWFwLnNldChQbGF5ZXJTaWRlXzEuUGxheWVyU2lkZS5SSUdIVCwgdGhpcy5nZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMoUGxheWVyU2lkZV8xLlBsYXllclNpZGUuUklHSFQpKTtcbiAgICB9XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT04gJiYgIXBsYXllci5pc1N1YnN0aXR1dGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyRGVzdGluYXRpb25Qb2ludE1hcC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTGlzdCA9IHRoaXMuc3ViUG9zaXRpb25zTWFwLmdldChwbGF5ZXIuc2lkZSk7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvbkxpc3QgPT09IHVuZGVmaW5lZCB8fCBkZXN0aW5hdGlvbkxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uUG9pbnQgPSB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuZ2V0KHBsYXllcik7XG4gICAgICAgIGlmIChkZXN0aW5hdGlvblBvaW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9pbnQgPSBkZXN0aW5hdGlvbkxpc3RbMF07XG4gICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgZGVzdGluYXRpb25Qb2ludCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmN1cnJlbnRNYXhTcGVlZCA9IChwbGF5ZXIubm9ybWFsTWF4U3BlZWQgKiAyKSAvIDM7XG4gICAgICAgIHBsYXllci5kZXN0aW5hdGlvblBvc2l0aW9uID0gbmV3IE1vdmVtZW50UG9pbnRfMS5Nb3ZlbWVudFBvaW50KGRlc3RpbmF0aW9uUG9pbnQucG9pbnQsIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgICAgICBpZiAocGxheWVyLnJlYWNoZWREZXN0aW5hdGlvblBvc2l0aW9uKCkpIHtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUG9pbnQuYWN0aW9uKHBsYXllciwgZ2FtZVdvcmxkKTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gZGVzdGluYXRpb25MaXN0LmZpbmRJbmRleChkZXN0aW5hdGlvblBvaW50ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUG9pbnRfMS5Qb2ludC5hcmVQb2ludEVxdWFscyhkZXN0aW5hdGlvblBvaW50LnBvaW50LCBwbGF5ZXIuZGVzdGluYXRpb25Qb3NpdGlvbi5wb3NpdGlvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4IDwgZGVzdGluYXRpb25MaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgZGVzdGluYXRpb25MaXN0W2luZGV4ICsgMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW5kZXggPj0gZGVzdGluYXRpb25MaXN0Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllckRlc3RpbmF0aW9uUG9pbnRNYXAuc2V0KHBsYXllciwgbmV3IFBvaW50V2l0aEFjdGlvbihwbGF5ZXIuaW5pdGlhbFBvc2l0aW9uLCAoKSA9PiB7IH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRTdWJzdGl0dXRpb25EZXN0aW5hdGlvbnMocGxheWVyU2lkZSkge1xuICAgICAgICBjb25zdCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgKHBsYXllclNpZGUgPT09IFBsYXllclNpZGVfMS5QbGF5ZXJTaWRlLkxFRlRcbiAgICAgICAgICAgICAgICA/IHRoaXMuZ2FtZUNvbmZpZ3Muc3Vic3RpdHV0aW9uT2Zmc2V0WFxuICAgICAgICAgICAgICAgIDogdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoIC0gdGhpcy5nYW1lQ29uZmlncy5zdWJzdGl0dXRpb25PZmZzZXRYKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG5ldyBQb2ludFdpdGhBY3Rpb24obmV3IFBvaW50XzEuUG9pbnQoeCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCAtIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgLyAyKSwgKCkgPT4geyB9KSxcbiAgICAgICAgICAgIG5ldyBQb2ludFdpdGhBY3Rpb24obmV3IFBvaW50XzEuUG9pbnQoeCwgdGhpcy5nYW1lQ29uZmlncy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQpLCAocGxheWVyLCBnYW1lV29ybGQpID0+IHtcbiAgICAgICAgICAgICAgICBnYW1lV29ybGQuc3dpdGNoUGxheWVyQ29sb3IocGxheWVyLnNpZGUpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBuZXcgUG9pbnRXaXRoQWN0aW9uKG5ldyBQb2ludF8xLlBvaW50KHgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQgLSB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyKSwgKCkgPT4geyB9KSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5leHBvcnRzLlN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneSA9IFN1YnN0aXR1dGVQbGF5ZXJzTW92ZW1lbnRTdHJhdGVneTtcbmNsYXNzIFBvaW50V2l0aEFjdGlvbiB7XG4gICAgY29uc3RydWN0b3IocG9pbnQsIGFjdGlvbikge1xuICAgICAgICB0aGlzLnBvaW50ID0gcG9pbnQ7XG4gICAgICAgIHRoaXMuYWN0aW9uID0gYWN0aW9uO1xuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5XYWl0aW5nQmFsbE1vdmVtZW50U3RyYXRlZ3kgPSB2b2lkIDA7XG5jb25zdCBHYW1lU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIFdhaXRpbmdCYWxsTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY2FuQmVBcHBsaWVkKHBsYXllciwgZ2FtZVdvcmxkKSB7XG4gICAgICAgIHJldHVybiAoIXBsYXllci5pc1N1YnN0aXR1dGUgJiZcbiAgICAgICAgICAgIGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5XQUlUSU5HX0JBTEwpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIGdhbWVXb3JsZCwgZGVsdGFNcykge1xuICAgICAgICBpZiAoZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmlzU3RhdHVzQ2hhbmdlZFJlY2VudGx5KCkpIHtcbiAgICAgICAgICAgIHBsYXllci5yZXNldFRvU3RhcnRHYW1lKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmFkanVzdFNwZWVkVG9EZXN0aW5hdGlvblBvaW50KGRlbHRhTXMpO1xuICAgIH1cbn1cbmV4cG9ydHMuV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5ID0gV2FpdGluZ0JhbGxNb3ZlbWVudFN0cmF0ZWd5O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uLy4uL2VudW1zL0dhbWVTdGF0dXNcIik7XG5jb25zdCBNb3ZlbWVudFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvTW92ZW1lbnRQb2ludFwiKTtcbmNvbnN0IFBvaW50XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBXaW5uaW5nUGxheWVyTW92ZW1lbnRTdHJhdGVneSB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbmZpZ3MpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICBjYW5CZUFwcGxpZWQocGxheWVyLCBnYW1lV29ybGQpIHtcbiAgICAgICAgcmV0dXJuICghcGxheWVyLmlzU3Vic3RpdHV0ZSAmJlxuICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FICYmXG4gICAgICAgICAgICBnYW1lV29ybGQuc2NvcmUuZ2V0V2lubmluZ1BsYXllclNpZGUoKSA9PT0gcGxheWVyLnNpZGUpO1xuICAgIH1cbiAgICBhcHBseShwbGF5ZXIsIF9nYW1lV29ybGQsIGRlbHRhTXMpIHtcbiAgICAgICAgaWYgKHBsYXllci5yZWFjaGVkRGVzdGluYXRpb25Qb3NpdGlvbigpKSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgK1xuICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMC44ICsgMC4xKSAqIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IHkgPSAoTWF0aC5yYW5kb20oKSAqIDAuOCArIDAuMSkgKiB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0O1xuICAgICAgICAgICAgcGxheWVyLmRlc3RpbmF0aW9uUG9zaXRpb24gPSBuZXcgTW92ZW1lbnRQb2ludF8xLk1vdmVtZW50UG9pbnQobmV3IFBvaW50XzEuUG9pbnQoeCwgeSksIG5ldyBQb2ludF8xLlBvaW50KDAsIDApLCAwLCAwKTtcbiAgICAgICAgICAgIHBsYXllci5jdXJyZW50TWF4U3BlZWQgPVxuICAgICAgICAgICAgICAgIHBsYXllci5ub3JtYWxNYXhTcGVlZCAqIDIgKiBNYXRoLnJhbmRvbSgpICsgcGxheWVyLm5vcm1hbE1heFNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIHBsYXllci5hZGp1c3RTcGVlZFRvRGVzdGluYXRpb25Qb2ludChkZWx0YU1zKTtcbiAgICB9XG59XG5leHBvcnRzLldpbm5pbmdQbGF5ZXJNb3ZlbWVudFN0cmF0ZWd5ID0gV2lubmluZ1BsYXllck1vdmVtZW50U3RyYXRlZ3k7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVdvcmxkID0gdm9pZCAwO1xuY29uc3QgdHNfYnVzXzEgPSByZXF1aXJlKFwidHMtYnVzXCIpO1xuY29uc3QgRXZlbnRCdXNVdGlsaXRpZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9FdmVudEJ1c1V0aWxpdGllc1wiKTtcbmNvbnN0IEJhbGxfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9CYWxsXCIpO1xuY29uc3QgRXhwbG9zaW9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRXhwbG9zaW9uXCIpO1xuY29uc3QgRmlyZXdvcmtzXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvRmlyZXdvcmtzXCIpO1xuY29uc3QgR2F0ZV8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL0dhdGVcIik7XG5jb25zdCBHb2FsUG9zdHNfMSA9IHJlcXVpcmUoXCIuLi9lbnRpdGllcy9Hb2FsUG9zdHNcIik7XG5jb25zdCBNZW51QnV0dG9uXzEgPSByZXF1aXJlKFwiLi4vZW50aXRpZXMvTWVudUJ1dHRvblwiKTtcbmNvbnN0IFBsYXllcl8xID0gcmVxdWlyZShcIi4uL2VudGl0aWVzL1BsYXllclwiKTtcbmNvbnN0IEdhbWVTdGF0dXNfMSA9IHJlcXVpcmUoXCIuLi9lbnVtcy9HYW1lU3RhdHVzXCIpO1xuY29uc3QgUG93ZXJTaG90VHlwZV8xID0gcmVxdWlyZShcIi4uL2VudW1zL1Bvd2VyU2hvdFR5cGVcIik7XG5jb25zdCBHYW1lU3RhdHVzTWFuYWdlcl8xID0gcmVxdWlyZShcIi4uL21hbmFnZXJzL0dhbWVTdGF0dXNNYW5hZ2VyXCIpO1xuY29uc3QgU2NvcmVNYW5hZ2VyXzEgPSByZXF1aXJlKFwiLi4vbWFuYWdlcnMvU2NvcmVNYW5hZ2VyXCIpO1xuY2xhc3MgR2FtZVdvcmxkIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzID0gW107XG4gICAgICAgIHRoaXMuZ29hbFBvc3RzID0gbmV3IEdvYWxQb3N0c18xLkdvYWxQb3N0cyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVIdW1hblBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlQ3B1UGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucGxheWVycy5wdXNoKFBsYXllcl8xLlBsYXllci5jcmVhdGVMZWZ0U3Vic3RpdHV0ZVBsYXllcihnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnBsYXllcnMucHVzaChQbGF5ZXJfMS5QbGF5ZXIuY3JlYXRlUmlnaHRTdWJzdGl0dXRlUGxheWVyKGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMuYmFsbCA9IG5ldyBCYWxsXzEuQmFsbChnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZmlyZXdvcmtzID0gbmV3IEZpcmV3b3Jrc18xLkZpcmV3b3JrcyhnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZXhwbG9zaW9uID0gbmV3IEV4cGxvc2lvbl8xLkV4cGxvc2lvbihnYW1lQ29uZmlncyk7XG4gICAgICAgIHRoaXMuZ2F0ZXMgPSBuZXcgR2F0ZV8xLkdhdGUoKTtcbiAgICAgICAgY29uc3QgYnVzID0gbmV3IHRzX2J1c18xLkV2ZW50QnVzKCk7XG4gICAgICAgIHRoaXMuc2NvcmUgPSBuZXcgU2NvcmVNYW5hZ2VyXzEuU2NvcmVNYW5hZ2VyKCk7XG4gICAgICAgIGNvbnN0IHBsYXlJbWcgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInBsYXkucG5nXCIpO1xuICAgICAgICB0aGlzLm1lbnVCdXR0b24gPSBuZXcgTWVudUJ1dHRvbl8xLk1lbnVCdXR0b24oZ2FtZUNvbmZpZ3MsIHBsYXlJbWcud2lkdGgsIHBsYXlJbWcuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5nYW1lU3RhdHVzTWFuYWdlciA9IG5ldyBHYW1lU3RhdHVzTWFuYWdlcl8xLkdhbWVTdGF0dXNNYW5hZ2VyKGJ1cyk7XG4gICAgICAgIGJ1cy5zdWJzY3JpYmUoRXZlbnRCdXNVdGlsaXRpZXNfMS5FdmVudEJ1c1V0aWxpdGllcy5zdGF0dXNDaGFuZ2VkRXZlbnQsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgIGlmIChldmVudC5wYXlsb2FkID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldEVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGluY3JlYXNlU2NvcmUocGxheWVyU2lkZSkge1xuICAgICAgICB0aGlzLnNjb3JlLmluY3JlYXNlU2NvcmUocGxheWVyU2lkZSk7XG4gICAgICAgIGlmICh0aGlzLnNjb3JlLmlzU3Vic3RpdHV0aW9uVGltZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5TVUJTVElUSU9OKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZVN0YXR1c01hbmFnZXIuY2hhbmdlU3RhdHVzKEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLldBSVRJTkdfQkFMTCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiAhcGxheWVyLmlzU3Vic3RpdHV0ZSlcbiAgICAgICAgICAgIC5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBwbGF5ZXIucmVzZXRPbkdvYWwoKTtcbiAgICAgICAgICAgIHBsYXllci5wb3dlclNob3RXcmFwcGVyLnVwZGF0ZVNjb3JlZEdvYWwocGxheWVyU2lkZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5iYWxsLmJhbGxQb3dlclNob3QuaXNQb3dlclNob3QpIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbG9zaW9uLmFkZEV4cGxvc2lvbih0aGlzLmJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbiwgdGhpcy5iYWxsLmJhbGxQb3dlclNob3QuZ2V0UG93ZXJTaG90VHlwZSgpID8/IFBvd2VyU2hvdFR5cGVfMS5Qb3dlclNob3RUeXBlLkZJUkUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFsbC5yZXNldE9uR29hbCgpO1xuICAgICAgICBpZiAodGhpcy5zY29yZS5pc0dhbWVPdmVyKSB7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLmNoYW5nZVN0YXR1cyhHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5FTkRfR0FNRSk7XG4gICAgICAgICAgICB0aGlzLmZpcmV3b3Jrcy5pbml0RmlyZXdvcmtzKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVTdGF0dXNNYW5hZ2VyLnNjaGVkdWxlU3RhdHVzQ2hhbmdlKEZpcmV3b3Jrc18xLkZpcmV3b3Jrcy5hbmltYXRpb25UaW1lLCBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKTtcbiAgICAgICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnBvd2VyU2hvdFdyYXBwZXIucmVzZXRQb3dlclNob3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN3aXRjaFBsYXllckNvbG9yKHBsYXllclNpZGUpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzXG4gICAgICAgICAgICAuZmlsdGVyKHBsYXllciA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcGxheWVyLnNpZGUgPT09IHBsYXllclNpZGU7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZm9yRWFjaChwbGF5ZXIgPT4gcGxheWVyLnN3aXRjaENvbG9ySW5kZXgoKSk7XG4gICAgfVxuICAgIHJlc2V0RW5kR2FtZSgpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXJzLmZvckVhY2gocGxheWVyID0+IHBsYXllci5yZXNldE9uR29hbCgpKTtcbiAgICAgICAgdGhpcy5iYWxsLnJlc2V0T25Hb2FsKCk7XG4gICAgICAgIHRoaXMuc2NvcmUucmVzZXQoKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWVXb3JsZCA9IEdhbWVXb3JsZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5LZXlib2FyZElucHV0TWFuYWdlciA9IHZvaWQgMDtcbmNvbnN0IEtleXNfMSA9IHJlcXVpcmUoXCIuLi9nYW1lL2VudW1zL0tleXNcIik7XG5jbGFzcyBLZXlib2FyZElucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJlc3NlZEtleXMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMub25LZXlEb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLmFkZChldmVudC5rZXkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uS2V5VXAgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuZGVsZXRlKGV2ZW50LmtleSk7XG4gICAgICAgIH07XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMub25LZXlEb3duKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXlVcCk7XG4gICAgfVxuICAgIGlzS2V5UHJlc3NlZChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlc3NlZEtleXMuaGFzKGtleSk7XG4gICAgfVxuICAgIGdldERpcmVjdGlvblByZXNzZWQoZGlyZWN0aW9uKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIHRoaXMucHJlc3NlZEtleXMpIHtcbiAgICAgICAgICAgIGlmIChLZXlzXzEuS2V5c1V0aWxpdGllcy5nZXRLZXlEaXJlY3Rpb24oa2V5KSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5leHBvcnRzLktleWJvYXJkSW5wdXRNYW5hZ2VyID0gS2V5Ym9hcmRJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTW91c2VJbnB1dE1hbmFnZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBNb3VzZUlucHV0TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgICAgICB0aGlzLm1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnRfMS5Qb2ludCgwLCAwKTtcbiAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTW91c2VNb3ZlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdGhpcy5tb3VzZVBvc2l0aW9uID0gbmV3IFBvaW50XzEuUG9pbnQoZXZlbnQuY2xpZW50WCAtIHJlY3QubGVmdCwgZXZlbnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5vbkNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pc01vdXNlUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuaXNNb3VzZVByZXNzZWQgPSBmYWxzZTtcbiAgICB9XG59XG5leHBvcnRzLk1vdXNlSW5wdXRNYW5hZ2VyID0gTW91c2VJbnB1dE1hbmFnZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTWFpblJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IEJhbGxSZW5kZXJfMSA9IHJlcXVpcmUoXCIuL2ltcGwvQmFsbFJlbmRlclwiKTtcbmNvbnN0IEJhbGxUcmFqZWN0b3J5UmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0JhbGxUcmFqZWN0b3J5UmVuZGVyXCIpO1xuY29uc3QgRXhwbG9zaW9uUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0V4cGxvc2lvblJlbmRlclwiKTtcbmNvbnN0IEZpZWxkUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0ZpZWxkUmVuZGVyXCIpO1xuY29uc3QgRmlyZXdvcmtzUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0ZpcmV3b3Jrc1JlbmRlclwiKTtcbmNvbnN0IEdhdGVzUmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL0dhdGVzUmVuZGVyXCIpO1xuY29uc3QgTWVudVJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9NZW51UmVuZGVyXCIpO1xuY29uc3QgUGxheWVyUG93ZXJTaG90UmVuZGVyXzEgPSByZXF1aXJlKFwiLi9pbXBsL1BsYXllclBvd2VyU2hvdFJlbmRlclwiKTtcbmNvbnN0IFBsYXllclJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9QbGF5ZXJSZW5kZXJcIik7XG5jb25zdCBTY29yZVJlbmRlcl8xID0gcmVxdWlyZShcIi4vaW1wbC9TY29yZVJlbmRlclwiKTtcbmNsYXNzIE1haW5SZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLnJlbmRlcnMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyID0gZG9tSGFuZGxlcjtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEZpZWxkUmVuZGVyXzEuRmllbGRSZW5kZXIoZG9tSGFuZGxlci5iYWNrZ3JvdW5kQ29udGV4dCwgZ2FtZUNvbmZpZ3MsIGFzc2V0TG9hZGVyKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBCYWxsVHJhamVjdG9yeVJlbmRlcl8xLkJhbGxUcmFqZWN0b3J5UmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBTY29yZVJlbmRlcl8xLlNjb3JlUmVuZGVyKGRvbUhhbmRsZXIuc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgR2F0ZXNSZW5kZXJfMS5HYXRlc1JlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgUGxheWVyUmVuZGVyXzEuUGxheWVyUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgQmFsbFJlbmRlcl8xLkJhbGxSZW5kZXIoZG9tSGFuZGxlci5nYW1lQ29udGV4dCwgZ2FtZUNvbmZpZ3MpKTtcbiAgICAgICAgdGhpcy5yZW5kZXJzLnB1c2gobmV3IEV4cGxvc2lvblJlbmRlcl8xLkV4cGxvc2lvblJlbmRlcihkb21IYW5kbGVyLmdhbWVDb250ZXh0KSk7XG4gICAgICAgIHRoaXMucmVuZGVycy5wdXNoKG5ldyBNZW51UmVuZGVyXzEuTWVudVJlbmRlcihkb21IYW5kbGVyLm1lbnVDb250ZXh0LCBhc3NldExvYWRlcikpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgUGxheWVyUG93ZXJTaG90UmVuZGVyXzEuUGxheWVyUG93ZXJTaG90UmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQsIGFzc2V0TG9hZGVyLCBnYW1lQ29uZmlncykpO1xuICAgICAgICB0aGlzLnJlbmRlcnMucHVzaChuZXcgRmlyZXdvcmtzUmVuZGVyXzEuRmlyZXdvcmtzUmVuZGVyKGRvbUhhbmRsZXIuZ2FtZUNvbnRleHQpKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMucmVuZGVycy5mb3JFYWNoKHJlbmRlciA9PiByZW5kZXIucmVuZGVyKGdhbWVXb3JsZCkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5kb21IYW5kbGVyLmdhbWVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRvbUhhbmRsZXIuZ2FtZUNhbnZhcy53aWR0aCwgdGhpcy5kb21IYW5kbGVyLmdhbWVDYW52YXMuaGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLk1haW5SZW5kZXIgPSBNYWluUmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkJhbGxSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBCYWxsU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9CYWxsU3RhdHVzXCIpO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIEJhbGxSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLm1heFJlc2l6ZUZhY3RvciA9IDI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGJhbGwgPSBnYW1lV29ybGQuYmFsbDtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIGlmIChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuUExBWUlORyB8fFxuICAgICAgICAgICAgKChnYW1lV29ybGQuZ2FtZVN0YXR1c01hbmFnZXIuZ2FtZVN0YXR1cyA9PT0gR2FtZVN0YXR1c18xLkdhbWVTdGF0dXMuV0FJVElOR19CQUxMIHx8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLkVORF9HQU1FIHx8XG4gICAgICAgICAgICAgICAgZ2FtZVdvcmxkLmdhbWVTdGF0dXNNYW5hZ2VyLmdhbWVTdGF0dXMgPT09IEdhbWVTdGF0dXNfMS5HYW1lU3RhdHVzLlNVQlNUSVRJT04pICYmXG4gICAgICAgICAgICAgICAgYmFsbC5tb3ZlbWVudFBvc2l0aW9uLmdldFNwZWVkKCkgPiAwKSkge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoYmFsbC5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngsIGJhbGwubW92ZW1lbnRQb3NpdGlvbi5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGJhbGwubW92ZW1lbnRQb3NpdGlvbi5nZXRTcGVlZEFuZ2xlKCkpO1xuICAgICAgICAgICAgbGV0IHJlc2l6ZUZhY3RvciA9IDE7XG4gICAgICAgICAgICBpZiAoYmFsbC5iYWxsU3RhdHVzICE9PSBCYWxsU3RhdHVzXzEuQmFsbFN0YXR1cy5BVFRBQ0hFRCkge1xuICAgICAgICAgICAgICAgIHJlc2l6ZUZhY3RvciA9XG4gICAgICAgICAgICAgICAgICAgIChiYWxsLm1vdmVtZW50UG9zaXRpb24uZ2V0U3BlZWQoKSAvIGJhbGwubWF4U3BlZWQpICpcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLm1heFJlc2l6ZUZhY3RvciAtIDEpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNjYWxlKHJlc2l6ZUZhY3RvciwgMSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0NvbG9yID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxTaXplV2l0aG91dEJvcmRlciAqIDAuNTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IHRoaXMuZ2FtZUNvbmZpZ3MuYmFsbFNpemVXaXRob3V0Qm9yZGVyICogMC41O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dCbHVyID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5hcmMoMCwgMCwgdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBcIiNGRjMzMzNcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLmJhbGxCb3JkZXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMzMwMDAwXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFJlbmRlciA9IEJhbGxSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQmFsbFRyYWplY3RvcnlSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBCYWxsVHJhamVjdG9yeVJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgICAgICB0aGlzLnRyYWplY3RvcnlNYXhEaXN0YW5jZSA9IGdhbWVDb25maWdzLmZpZWxkSGVpZ2h0IC8gMztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBiYWxsID0gZ2FtZVdvcmxkLmJhbGw7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2F2ZSgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiIzExMTExMVwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMTExMTExXCI7XG4gICAgICAgIGJhbGwucG9zaXRpb25IaXN0b3J5LnBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IGJhbGwucG9zaXRpb25IaXN0b3J5LnBvc2l0aW9ucy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dFBvc2l0aW9uID0gYmFsbC5wb3NpdGlvbkhpc3RvcnkucG9zaXRpb25zW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgaWYgKFBvaW50XzEuUG9pbnQuZ2V0RGlzdGFuY2UocG9zaXRpb24ucG9zaXRpb24sIG5leHRQb3NpdGlvbi5wb3NpdGlvbikgPFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYWplY3RvcnlNYXhEaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lmdsb2JhbEFscGhhID0gMSAtIGJhbGwucG9zaXRpb25IaXN0b3J5LmdldEZhY3RvcihpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gdGhpcy5nYW1lQ29uZmlncy5iYWxsU2l6ZVdpdGhCb3JkZXI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubW92ZVRvKHBvc2l0aW9uLnBvc2l0aW9uLngsIHBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVUbyhuZXh0UG9zaXRpb24ucG9zaXRpb24ueCwgbmV4dFBvc2l0aW9uLnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQmFsbFRyYWplY3RvcnlSZW5kZXIgPSBCYWxsVHJhamVjdG9yeVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5FeHBsb3Npb25SZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBFeHBsb3Npb25SZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0KSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBjb25zdCBleHBsb3Npb24gPSBnYW1lV29ybGQuZXhwbG9zaW9uO1xuICAgICAgICBleHBsb3Npb24uY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCB4ID0gZXhwbG9zaW9uLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudC5hbmdsZSkgKiBjb21wb25lbnQuZ2V0RmFjdG9yKCkgKiBleHBsb3Npb24ubWF4RGlzdGFuY2U7XG4gICAgICAgICAgICBjb25zdCB5ID0gZXhwbG9zaW9uLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudC5hbmdsZSkgKiBjb21wb25lbnQuZ2V0RmFjdG9yKCkgKiBleHBsb3Npb24ubWF4RGlzdGFuY2U7XG4gICAgICAgICAgICBjb25zdCBzaXplID0gKDEgLSBjb21wb25lbnQuZ2V0RmFjdG9yKCkpICogZXhwbG9zaW9uLm1heFNpemU7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmFyYyh4LCB5LCBzaXplLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb21wb25lbnQuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5FeHBsb3Npb25SZW5kZXIgPSBFeHBsb3Npb25SZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmllbGRSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBGaWVsZFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoYmFja2dyb3VuZENvbnRleHQsIGdhbWVDb25maWdzLCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmFscmVhZHlSZW5kZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZpZWxkSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImZpZWxkLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5nb2FsSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcImdvYWxfZmllbGQucG5nXCIpO1xuICAgICAgICB0aGlzLnRyYWNrRmllbGRJbWFnZSA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwidHJhY2suanBnXCIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0ID0gYmFja2dyb3VuZENvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBpZiAodGhpcy5hbHJlYWR5UmVuZGVyZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmJhY2tncm91bmRDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFja2dyb3VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlckF0aGxldGljVHJhY2soKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dDb2xvciA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnNoYWRvd09mZnNldFggPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd09mZnNldDtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuc2hhZG93Qmx1ciA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93Qmx1cjtcbiAgICAgICAgdGhpcy5yZW5kZXJCb3JkZXIoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJHb2FsUG9zdHMoZ2FtZVdvcmxkKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgIHRoaXMuYWxyZWFkeVJlbmRlcmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmVuZGVyQmFja2dyb3VuZCgpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5maWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5nb2FsSW1hZ2UsIDAsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmRyYXdJbWFnZSh0aGlzLmdvYWxJbWFnZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0LCB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQpO1xuICAgIH1cbiAgICByZW5kZXJCb3JkZXIoKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbFN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgMCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiArXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuY3B1U3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICsgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU3Vic3RpdHV0aW9uWCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmdhdGVzTGVuZ3RoIC8gMiwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoLXRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0IC0gdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCArIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbEhlaWdodCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QoMCwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCAtdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmdvYWxIZWlnaHQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKyB0aGlzLmdhbWVDb25maWdzLmZpZWxkV2lkdGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZ29hbFlPZmZzZXQgLSB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5yZWN0KHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRYT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZFdpZHRoLCB0aGlzLmdhbWVDb25maWdzLmdvYWxZT2Zmc2V0ICsgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0LCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnJlY3QodGhpcy5nYW1lQ29uZmlncy5maWVsZFhPZmZzZXQgKiAyICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCAtXG4gICAgICAgICAgICB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsWU9mZnNldCAtIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSwgdGhpcy5nYW1lQ29uZmlncy5nb2FsSGVpZ2h0ICsgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgKiAyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsKCk7XG4gICAgfVxuICAgIHJlbmRlckdvYWxQb3N0cyhnYW1lV29ybGQpIHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5maWxsU3R5bGUgPSBcIiNBQUFBQUFcIjtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgIGdhbWVXb3JsZC5nb2FsUG9zdHMucG9zaXRpb25zLmZvckVhY2gocG9zaXRpb24gPT4ge1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGdhbWVXb3JsZC5nb2FsUG9zdHMucmFkaXVzLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckF0aGxldGljVHJhY2soKSB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZENvbnRleHQuZHJhd0ltYWdlKHRoaXMudHJhY2tGaWVsZEltYWdlLCB0aGlzLmdhbWVDb25maWdzLmZpZWxkWE9mZnNldCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuYXRobGV0aWNUcmFja1lPZmZzZXQsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRXaWR0aCwgdGhpcy5nYW1lQ29uZmlncy5hdGhsZXRpY1RyYWNrSGVpZ2h0KTtcbiAgICB9XG59XG5leHBvcnRzLkZpZWxkUmVuZGVyID0gRmllbGRSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRmlyZXdvcmtzUmVuZGVyID0gdm9pZCAwO1xuY2xhc3MgRmlyZXdvcmtzUmVuZGVyIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lQ29udGV4dCkge1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLmZpcmV3b3Jrcy5maXJld29ya3MuZm9yRWFjaChmaXJld29yayA9PiB7XG4gICAgICAgICAgICBpZiAoZmlyZXdvcmsuaXNGaXJpbmcoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyRmlyZXdvcmsoZmlyZXdvcmssIGdhbWVXb3JsZC5maXJld29ya3MubGluZVdpZHRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckZpcmV3b3JrKGZpcmV3b3JrLCBsaW5lV2lkdGgpIHtcbiAgICAgICAgZmlyZXdvcmsuY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICAgICAgICBjb25zdCBsZW5naHQgPSBmaXJld29yay5nZXRMZW5naHQoKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVGYWN0b3IgPSBmaXJld29yay5nZXRUaW1lRmFjdG9yKCk7XG4gICAgICAgICAgICBjb25zdCB4MSA9IGZpcmV3b3JrLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gLSBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB5MSA9IGZpcmV3b3JrLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gLSBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB4MiA9IGZpcmV3b3JrLnBvc2l0aW9uLnggK1xuICAgICAgICAgICAgICAgIE1hdGguY29zKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKyBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICBjb25zdCB5MiA9IGZpcmV3b3JrLnBvc2l0aW9uLnkgK1xuICAgICAgICAgICAgICAgIE1hdGguc2luKGNvbXBvbmVudFtcImFuZ2xlXCJdKSAqXG4gICAgICAgICAgICAgICAgICAgICh0aW1lRmFjdG9yICogY29tcG9uZW50W1wiZGlzdGFuY2VcIl0gKyBjb21wb25lbnRbXCJkaXN0YW5jZVwiXSAqIGxlbmdodCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb21wb25lbnRbXCJjb2xvclwiXTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubW92ZVRvKE1hdGgucm91bmQoeDEpLCBNYXRoLnJvdW5kKHkxKSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmxpbmVUbyhNYXRoLnJvdW5kKHgyKSwgTWF0aC5yb3VuZCh5MikpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaXJld29ya3NSZW5kZXIgPSBGaXJld29ya3NSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSB2b2lkIDA7XG5jbGFzcyBHYXRlc1JlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGdhbWVDb25maWdzKSB7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQgPSBnYW1lQ29udGV4dDtcbiAgICAgICAgdGhpcy5nYW1lQ29uZmlncyA9IGdhbWVDb25maWdzO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gZ2FtZVdvcmxkLmdhdGVzLmN1cnJlbnRBbmdsZTtcbiAgICAgICAgdGhpcy5yZW5kZXJTaW5nbGVHYXRlKGFuZ2xlLCB0aGlzLmdhbWVDb25maWdzLnBsYXllclN1YnN0aXR1dGlvblggLVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5nYXRlc0xlbmd0aCAvIDIgK1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29uZmlncy5maWVsZEJvcmRlclNpemUgLyAyKTtcbiAgICAgICAgdGhpcy5yZW5kZXJTaW5nbGVHYXRlKE1hdGguUEkgLSBhbmdsZSwgdGhpcy5nYW1lQ29uZmlncy5jcHVTdWJzdGl0dXRpb25YICtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGggLyAyIC1cbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgfVxuICAgIHJlbmRlclNpbmdsZUdhdGUoYW5nbGUsIHgpIHtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjRkYwMDAwXCI7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoeCwgdGhpcy5nYW1lQ29uZmlncy5maWVsZEhlaWdodCArIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplIC8gMik7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKGFuZ2xlKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZWN0KC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIsIC10aGlzLmdhbWVDb25maWdzLmZpZWxkQm9yZGVyU2l6ZSAvIDIsIHRoaXMuZ2FtZUNvbmZpZ3MuZ2F0ZXNMZW5ndGgsIHRoaXMuZ2FtZUNvbmZpZ3MuZmllbGRCb3JkZXJTaXplKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuR2F0ZXNSZW5kZXIgPSBHYXRlc1JlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5NZW51UmVuZGVyID0gdm9pZCAwO1xuY29uc3QgR2FtZVN0YXR1c18xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW51bXMvR2FtZVN0YXR1c1wiKTtcbmNsYXNzIE1lbnVSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKG1lbnVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmhvdmVyRmFjdG9yID0gMS4zO1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0ID0gbWVudUNvbnRleHQ7XG4gICAgICAgIHRoaXMucGxheUltYWdlID0gYXNzZXRMb2FkZXIuZ2V0SW1hZ2UoXCJwbGF5LnBuZ1wiKTtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLm1lbnVDb250ZXh0LmNhbnZhcy53aWR0aCwgdGhpcy5tZW51Q29udGV4dC5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgaWYgKGdhbWVXb3JsZC5nYW1lU3RhdHVzTWFuYWdlci5nYW1lU3RhdHVzID09PSBHYW1lU3RhdHVzXzEuR2FtZVN0YXR1cy5NRU5VKSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IDEgKyAodGhpcy5ob3ZlckZhY3RvciAtIDEpICogZ2FtZVdvcmxkLm1lbnVCdXR0b24uaG92ZXJQcm9ncmVzcztcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoICogc2NhbGU7XG4gICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgICAgICB0aGlzLm1lbnVDb250ZXh0LmRyYXdJbWFnZSh0aGlzLnBsYXlJbWFnZSwgZ2FtZVdvcmxkLm1lbnVCdXR0b24ucG9zaXRpb24ueCAtXG4gICAgICAgICAgICAgICAgKHdpZHRoIC0gZ2FtZVdvcmxkLm1lbnVCdXR0b24uZGltZW5zaW9uLndpZHRoKSAvIDIsIGdhbWVXb3JsZC5tZW51QnV0dG9uLnBvc2l0aW9uLnkgLVxuICAgICAgICAgICAgICAgIChoZWlnaHQgLSBnYW1lV29ybGQubWVudUJ1dHRvbi5kaW1lbnNpb24uaGVpZ2h0KSAvIDIsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5NZW51UmVuZGVyID0gTWVudVJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QbGF5ZXJQb3dlclNob3RSZW5kZXIgPSB2b2lkIDA7XG5jb25zdCBFbGVjdHJpY1Bvd2VyU2hvdF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZW50aXRpZXMvcG93ZXJTaG90cy9FbGVjdHJpY1Bvd2VyU2hvdFwiKTtcbmNvbnN0IEZpcmVQb3dlclNob3RfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2VudGl0aWVzL3Bvd2VyU2hvdHMvRmlyZVBvd2VyU2hvdFwiKTtcbmNsYXNzIFBsYXllclBvd2VyU2hvdFJlbmRlciB7XG4gICAgY29uc3RydWN0b3IoZ2FtZUNvbnRleHQsIGFzc2V0TG9hZGVyLCBnYW1lQ29uZmlncykge1xuICAgICAgICB0aGlzLmNlbGxzUGVyUm93ID0gNDtcbiAgICAgICAgdGhpcy5jZWxsc1BlckNvbHVtbiA9IDQ7XG4gICAgICAgIHRoaXMubGlnaHRuaW5nQm9sdE51bWJlciA9IDM7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dCA9IGdhbWVDb250ZXh0O1xuICAgICAgICB0aGlzLmZsYW1lSW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcIlJlZFBhcnRpY2xlLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5jZWxsV2lkdGggPSB0aGlzLmZsYW1lSW1hZ2Uud2lkdGggLyB0aGlzLmNlbGxzUGVyUm93O1xuICAgICAgICB0aGlzLmNlbGxIZWlnaHQgPSB0aGlzLmZsYW1lSW1hZ2UuaGVpZ2h0IC8gdGhpcy5jZWxsc1BlckNvbHVtbjtcbiAgICB9XG4gICAgcmVuZGVyKGdhbWVXb3JsZCkge1xuICAgICAgICBnYW1lV29ybGQucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb3dlclNob3RFbnRpdGllcyA9IHBsYXllci5wb3dlclNob3RXcmFwcGVyLnBvd2VyU2hvdEVudGl0aWVzO1xuICAgICAgICAgICAgcG93ZXJTaG90RW50aXRpZXMuZm9yRWFjaChwb3dlclNob3RFbnRpdHkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwb3dlclNob3RFbnRpdHkuc2hvdWxkUmVuZGVyKHBsYXllcikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvd2VyU2hvdEVudGl0eSBpbnN0YW5jZW9mIEZpcmVQb3dlclNob3RfMS5GaXJlUG93ZXJTaG90KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckZpcmVQb3dlclNob3QocG93ZXJTaG90RW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwb3dlclNob3RFbnRpdHkgaW5zdGFuY2VvZiBFbGVjdHJpY1Bvd2VyU2hvdF8xLkVsZWN0cmljUG93ZXJTaG90KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckVsZWN0cmljUG93ZXJTaG90KHBsYXllciwgcG93ZXJTaG90RW50aXR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyRmlyZVBvd2VyU2hvdChmaXJlUG93ZXJTaG90KSB7XG4gICAgICAgIGZpcmVQb3dlclNob3QuZmxhbWVzLmZvckVhY2goZmxhbWUgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGZsYW1lLmdldER1cmF0aW9uRmFjdG9yKCkgKiAoZmlyZVBvd2VyU2hvdC5tYXhTaXplIC0gZmlyZVBvd2VyU2hvdC5taW5TaXplKSArXG4gICAgICAgICAgICAgICAgZmlyZVBvd2VyU2hvdC5taW5TaXplO1xuICAgICAgICAgICAgY29uc3QgYWxwaGEgPSAxIC0gZmxhbWUuZ2V0RHVyYXRpb25GYWN0b3IoKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd0luZGV4ID0gTWF0aC5mbG9vcihmbGFtZS5pbmRleCAvIHRoaXMuY2VsbHNQZXJSb3cpO1xuICAgICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBmbGFtZS5pbmRleCAlIHRoaXMuY2VsbHNQZXJSb3c7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSBhbHBoYTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZmxhbWVJbWFnZSwgdGhpcy5jZWxsV2lkdGggKiByb3dJbmRleCwgdGhpcy5jZWxsSGVpZ2h0ICogY29sdW1uSW5kZXgsIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQsIE1hdGgucm91bmQoZmxhbWUucG9zaXRpb24ueCAtIHNpemUgLyAyKSwgTWF0aC5yb3VuZChmbGFtZS5wb3NpdGlvbi55IC0gc2l6ZSAvIDIpLCBNYXRoLnJvdW5kKHNpemUpLCBNYXRoLnJvdW5kKHNpemUpKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVuZGVyRWxlY3RyaWNQb3dlclNob3QocGxheWVyLCBlbGVjdHJpY1Bvd2VyU2hvdCkge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNhdmUoKTtcbiAgICAgICAgY29uc3QgZ3JhZGllbnQgPSB0aGlzLmdhbWVDb250ZXh0LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIgLyA1LCBwb3NpdGlvbi54LCBwb3NpdGlvbi55LCB0aGlzLmdhbWVDb25maWdzLnBsYXllclNpemVXaXRoQm9yZGVyKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsIFwiI0ZGRkZGRlwiKTtcbiAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsIFwidHJhbnNwYXJlbnRcIik7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHRoaXMuZ2FtZUNvbmZpZ3MucGxheWVyU2l6ZVdpdGhCb3JkZXIsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbCgpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgIHRoaXMuZ2FtZUNvbnRleHQudHJhbnNsYXRlKHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShlbGVjdHJpY1Bvd2VyU2hvdC5hbmdsZU9mZnNldCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5saWdodG5pbmdCb2x0TnVtYmVyOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucm90YXRlKE1hdGguUEkgLyB0aGlzLmxpZ2h0bmluZ0JvbHROdW1iZXIpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5nbG9iYWxBbHBoYSA9IDAuNTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZWxlY3RyaWNQb3dlclNob3QubGlnaHRuaW5nQm9sdFNpemUgLSAxOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb2ludCA9IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5W2pdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQb2ludCA9IGVsZWN0cmljUG93ZXJTaG90LmxpZ2h0bmluZ0JvbHRQb2ludEFycmF5W2ogKyAxXTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZmlsbFN0eWxlID0gXCIjMDAwMDAwXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gZWxlY3RyaWNQb3dlclNob3QuYmlnTGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubW92ZVRvKHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVRvKG5leHRQb2ludC54LCBuZXh0UG9pbnQueSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChlbGVjdHJpY1Bvd2VyU2hvdC53aGl0ZUxpbmVWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmZpbGxTdHlsZSA9IFwiI0ZGRkZGRlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjRkZGRkZGXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQubGluZVdpZHRoID0gZWxlY3RyaWNQb3dlclNob3QubGluZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0Lm1vdmVUbyhwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lVG8obmV4dFBvaW50LngsIG5leHRQb2ludC55KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxufVxuZXhwb3J0cy5QbGF5ZXJQb3dlclNob3RSZW5kZXIgPSBQbGF5ZXJQb3dlclNob3RSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuUGxheWVyUmVuZGVyID0gdm9pZCAwO1xuY29uc3QgUGxheWVyU3RhdHVzXzEgPSByZXF1aXJlKFwiLi4vLi4vZ2FtZS9lbnVtcy9QbGF5ZXJTdGF0dXNcIik7XG5jbGFzcyBQbGF5ZXJSZW5kZXIge1xuICAgIGNvbnN0cnVjdG9yKGdhbWVDb250ZXh0LCBnYW1lQ29uZmlncywgYXNzZXRMb2FkZXIpIHtcbiAgICAgICAgdGhpcy5jb2xvck1hcCA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiTEVGVC0wXCIsIFwiIzAwODAwMFwiXSxcbiAgICAgICAgICAgIFtcIkxFRlQtMVwiLCBcIiMzMzgwODhcIl0sXG4gICAgICAgICAgICBbXCJSSUdIVC0wXCIsIFwiI0ZGQTUwMFwiXSxcbiAgICAgICAgICAgIFtcIlJJR0hULTFcIiwgXCIjRkZGRjAwXCJdLFxuICAgICAgICBdKTtcbiAgICAgICAgdGhpcy5zdHVubmVkQ29sb3IgPSBcIiNGRkZGRkZcIjtcbiAgICAgICAgdGhpcy5ib3JkZXJDb2xvciA9IFwiIzAwMzMwMFwiO1xuICAgICAgICB0aGlzLmdhbWVDb250ZXh0ID0gZ2FtZUNvbnRleHQ7XG4gICAgICAgIHRoaXMuZ2FtZUNvbmZpZ3MgPSBnYW1lQ29uZmlncztcbiAgICAgICAgdGhpcy5zdGFySW1hZ2UgPSBhc3NldExvYWRlci5nZXRJbWFnZShcInN0YXIucG5nXCIpO1xuICAgICAgICB0aGlzLnN0YXJNYXhTaXplID0gdGhpcy5nYW1lQ29uZmlncy5wbGF5ZXJTaXplV2l0aG91dEJvcmRlcjtcbiAgICAgICAgdGhpcy5zdGFydE1heERpc3RhbmNlID0gdGhpcy5zdGFyTWF4U2l6ZSAqIDU7XG4gICAgfVxuICAgIHJlbmRlcihnYW1lV29ybGQpIHtcbiAgICAgICAgZ2FtZVdvcmxkLnBsYXllcnMuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBjb2xvcktleSA9IGAke3BsYXllci5zaWRlfS0ke3BsYXllci5jb2xvckluZGV4fWA7XG4gICAgICAgICAgICBjb25zdCBpc1N0dW5uZWQgPSBwbGF5ZXIucGxheWVyU3RhdHVzID09PSBQbGF5ZXJTdGF0dXNfMS5QbGF5ZXJTdGF0dXMuU1RVTk5FRDtcbiAgICAgICAgICAgIGxldCBjb2xvciA9IGlzU3R1bm5lZCA/IHRoaXMuc3R1bm5lZENvbG9yIDogdGhpcy5jb2xvck1hcC5nZXQoY29sb3JLZXkpO1xuICAgICAgICAgICAgaWYgKGNvbG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IFwiI0ZGMDAwMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlckNvbG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5saW5lV2lkdGggPSB0aGlzLmdhbWVDb25maWdzLnBsYXllckJvcmRlcjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93Q29sb3IgPSBcIiMwMDAwMDBcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IHRoaXMuZ2FtZUNvbmZpZ3Muc2hhZG93T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zaGFkb3dPZmZzZXRZID0gdGhpcy5nYW1lQ29uZmlncy5zaGFkb3dPZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnNoYWRvd0JsdXIgPSB0aGlzLmdhbWVDb25maWdzLnNoYWRvd0JsdXI7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnRyYW5zbGF0ZShNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLngpLCBNYXRoLnJvdW5kKHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnBvc2l0aW9uLnkpKTtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gcGxheWVyLmJvdW5jZVdyYXBwZXIuZ2V0Qm91bmNpbmdBbXBsaXR1ZGUoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuc2NhbGUoMSAtIHNjYWxlLCAxICsgc2NhbGUpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuYXJjKDAsIDAsIHBsYXllci5tb3ZlbWVudFBvc2l0aW9uLnNpemUsIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICBpZiAoaXNTdHVubmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJTdHVubmVkU3RhcnMocGxheWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlclN0dW5uZWRTdGFycyhwbGF5ZXIpIHtcbiAgICAgICAgcGxheWVyLnN0dW5uZWRXcmFwcGVyLnN0dW5uZWRTdGFycy5zdGFycy5mb3JFYWNoKHN0YXIgPT4ge1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICBjb25zdCBmYWN0b3IgPSBzdGFyLmdldEZhY3RvcigpO1xuICAgICAgICAgICAgY29uc3QgeCA9IHN0YXIucG9zaXRpb24ueCArIE1hdGguY29zKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgY29uc3QgeSA9IHN0YXIucG9zaXRpb24ueSArIE1hdGguc2luKHN0YXIuZGlyZWN0aW9uKSAqIChmYWN0b3IgKiB0aGlzLnN0YXJ0TWF4RGlzdGFuY2UpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC50cmFuc2xhdGUoeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmdhbWVDb250ZXh0LnJvdGF0ZShzdGFyLmFuZ2xlKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxIC0gZmFjdG9yO1xuICAgICAgICAgICAgdGhpcy5nYW1lQ29udGV4dC5kcmF3SW1hZ2UodGhpcy5zdGFySW1hZ2UsIC10aGlzLnN0YXJNYXhTaXplIC8gMiwgLXRoaXMuc3Rhck1heFNpemUgLyAyLCB0aGlzLnN0YXJNYXhTaXplLCB0aGlzLnN0YXJNYXhTaXplKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlBsYXllclJlbmRlciA9IFBsYXllclJlbmRlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TY29yZVJlbmRlciA9IHZvaWQgMDtcbmNvbnN0IERpbWVuc2lvbnNfMSA9IHJlcXVpcmUoXCIuLi8uLi9nYW1lL2dlb21ldHJ5L0RpbWVuc2lvbnNcIik7XG5jb25zdCBQb2ludF8xID0gcmVxdWlyZShcIi4uLy4uL2dhbWUvZ2VvbWV0cnkvUG9pbnRcIik7XG5jbGFzcyBTY29yZVJlbmRlciB7XG4gICAgY29uc3RydWN0b3Ioc2NvcmVDb250ZXh0LCBhc3NldExvYWRlcikge1xuICAgICAgICB0aGlzLmZyYW1lRm9yTnVtYmVyID0gNjtcbiAgICAgICAgdGhpcy50b3RhbE51bWJlcnMgPSA5O1xuICAgICAgICB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSA9IDMwMDtcbiAgICAgICAgdGhpcy5mcmFtZVRpbWUgPSB0aGlzLnRvdGFsQW5pbWF0aW9uVGltZSAvIHRoaXMuZnJhbWVGb3JOdW1iZXI7XG4gICAgICAgIHRoaXMuc2NvcmVGcmFtZXMgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0ID0gc2NvcmVDb250ZXh0O1xuICAgICAgICB0aGlzLmRpZ2l0c0ltYWdlcyA9IGFzc2V0TG9hZGVyLmdldEltYWdlKFwiZGlnaXRzLnBuZ1wiKTtcbiAgICAgICAgdGhpcy5pbm5lckltYWdlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucyh0aGlzLmRpZ2l0c0ltYWdlcy53aWR0aCwgdGhpcy5kaWdpdHNJbWFnZXMuaGVpZ2h0IC8gKHRoaXMudG90YWxOdW1iZXJzICogdGhpcy5mcmFtZUZvck51bWJlciArIDEpKTtcbiAgICAgICAgY29uc3Qgc2NvcmVIZWlnaHQgPSAoc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQgKiA5KSAvIDEwO1xuICAgICAgICB0aGlzLnNjb3JlRGltZW5zaW9ucyA9IG5ldyBEaW1lbnNpb25zXzEuRGltZW5zaW9ucygoc2NvcmVIZWlnaHQgKiB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoKSAvIHRoaXMuaW5uZXJJbWFnZURpbWVuc2lvbnMuaGVpZ2h0LCBzY29yZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IHlQb3NpdGlvbiA9IChzY29yZUNvbnRleHQuY2FudmFzLmhlaWdodCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLmhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnBvc2l0aW9uQXJyYXkgPSBbXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCgwLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGgsIHlQb3NpdGlvbiksXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludChzY29yZUNvbnRleHQuY2FudmFzLndpZHRoIC0gdGhpcy5zY29yZURpbWVuc2lvbnMud2lkdGggKiAyLCB5UG9zaXRpb24pLFxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQoc2NvcmVDb250ZXh0LmNhbnZhcy53aWR0aCAtIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB5UG9zaXRpb24pLFxuICAgICAgICBdO1xuICAgIH1cbiAgICByZW5kZXIoZ2FtZVdvcmxkKSB7XG4gICAgICAgIHRoaXMuc2NvcmVDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLnNjb3JlQ29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuc2NvcmVDb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBjb25zdCBzY29yZUFycmF5ID0gZ2FtZVdvcmxkLnNjb3JlLmdldFNjb3JlQXNBcnJheSgpO1xuICAgICAgICBzY29yZUFycmF5LmZvckVhY2goKG51bWJlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZyYW1lID0gbnVtYmVyICogdGhpcy5mcmFtZUZvck51bWJlcjtcbiAgICAgICAgICAgIGxldCBmcmFtZVRvRHJhdyA9IHRhcmdldEZyYW1lO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdICE9PSB0YXJnZXRGcmFtZSkge1xuICAgICAgICAgICAgICAgIGxldCBzdGVwID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIGdhbWVXb3JsZC5zY29yZS5sYXN0VXBkYXRlKSAvIHRoaXMuZnJhbWVUaW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zY29yZUZyYW1lc1tpbmRleF0gPiB0YXJnZXRGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzdGVwICo9IDI7XG4gICAgICAgICAgICAgICAgICAgIGZyYW1lVG9EcmF3ID0gTWF0aC5tYXgodGFyZ2V0RnJhbWUsIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdIC0gc3RlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmcmFtZVRvRHJhdyA9IE1hdGgubWluKHRhcmdldEZyYW1lLCB0aGlzLnNjb3JlRnJhbWVzW2luZGV4XSArIHN0ZXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVUb0RyYXcgPT09IHRhcmdldEZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2NvcmVGcmFtZXNbaW5kZXhdID0gdGFyZ2V0RnJhbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zY29yZUNvbnRleHQuZHJhd0ltYWdlKHRoaXMuZGlnaXRzSW1hZ2VzLCAwLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCAqIGZyYW1lVG9EcmF3LCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLndpZHRoLCB0aGlzLmlubmVySW1hZ2VEaW1lbnNpb25zLmhlaWdodCwgdGhpcy5wb3NpdGlvbkFycmF5W2luZGV4XS54LCB0aGlzLnBvc2l0aW9uQXJyYXlbaW5kZXhdLnksIHRoaXMuc2NvcmVEaW1lbnNpb25zLndpZHRoLCB0aGlzLnNjb3JlRGltZW5zaW9ucy5oZWlnaHQpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlNjb3JlUmVuZGVyID0gU2NvcmVSZW5kZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuRG9tSGFuZGxlciA9IHZvaWQgMDtcbmNsYXNzIERvbUhhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBbdGhpcy5iYWNrZ3JvdW5kQ2FudmFzLCB0aGlzLmJhY2tncm91bmRDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwiYmFja2dyb3VuZENhbnZhc1wiKTtcbiAgICAgICAgW3RoaXMuc2NvcmVDYW52YXMsIHRoaXMuc2NvcmVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwic2NvcmVDYW52YXNcIik7XG4gICAgICAgIFt0aGlzLmdhbWVDYW52YXMsIHRoaXMuZ2FtZUNvbnRleHRdID0gRG9tSGFuZGxlci5nZXRDYW52YXMoXCJnYW1lQ2FudmFzXCIpO1xuICAgICAgICBbdGhpcy5tZW51Q2FudmFzLCB0aGlzLm1lbnVDb250ZXh0XSA9IERvbUhhbmRsZXIuZ2V0Q2FudmFzKFwibWVudUNhbnZhc1wiKTtcbiAgICB9XG4gICAgc3RhdGljIGdldENhbnZhcyhpZCkge1xuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7aWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtpZH0gY29udGV4dCBub3QgZm91bmRgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW2NhbnZhcywgY29udGV4dF07XG4gICAgfVxufVxuZXhwb3J0cy5Eb21IYW5kbGVyID0gRG9tSGFuZGxlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VSUludGVyYWN0aW9uU3lzdGVtID0gdm9pZCAwO1xuY2xhc3MgVUlJbnRlcmFjdGlvblN5c3RlbSB7XG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIH1cbiAgICB1cGRhdGUoaG92ZXJhYmxlLCBvbkNsaWNrLCBkZWx0YU1zKSB7XG4gICAgICAgIGhvdmVyYWJsZS5ob3ZlcmVkID0gaG92ZXJhYmxlLmNvbnRhaW5zKHRoaXMuaW5wdXQubW91c2VQb3NpdGlvbik7XG4gICAgICAgIGlmIChob3ZlcmFibGUuaG92ZXJlZCAmJiB0aGlzLmlucHV0LmlzTW91c2VQcmVzc2VkKSB7XG4gICAgICAgICAgICBvbkNsaWNrKCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RlcCA9IChkZWx0YU1zIC8gaG92ZXJhYmxlLmdldFRyYW5zaXRpb25UaW1lKCkpICogKGhvdmVyYWJsZS5ob3ZlcmVkID8gMSA6IC0xKTtcbiAgICAgICAgaG92ZXJhYmxlLmhvdmVyUHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBob3ZlcmFibGUuaG92ZXJQcm9ncmVzcyArIHN0ZXApKTtcbiAgICB9XG59XG5leHBvcnRzLlVJSW50ZXJhY3Rpb25TeXN0ZW0gPSBVSUludGVyYWN0aW9uU3lzdGVtO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkV2ZW50QnVzVXRpbGl0aWVzID0gdm9pZCAwO1xuY29uc3QgdHNfYnVzXzEgPSByZXF1aXJlKFwidHMtYnVzXCIpO1xuY2xhc3MgRXZlbnRCdXNVdGlsaXRpZXMge1xufVxuZXhwb3J0cy5FdmVudEJ1c1V0aWxpdGllcyA9IEV2ZW50QnVzVXRpbGl0aWVzO1xuRXZlbnRCdXNVdGlsaXRpZXMuc3RhdHVzQ2hhbmdlZEV2ZW50ID0gKDAsIHRzX2J1c18xLmNyZWF0ZUV2ZW50RGVmaW5pdGlvbikoKShcInN0YXR1c0NoYW5nZWRcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZUNvbmZpZ3MgPSB2b2lkIDA7XG5jbGFzcyBHYW1lQ29uZmlncyB7XG4gICAgY29uc3RydWN0b3IoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCkge1xuICAgICAgICB0aGlzLnBsYXllckJvcmRlciA9IDI7XG4gICAgICAgIHRoaXMuYmFsbEJvcmRlciA9IDE7XG4gICAgICAgIHRoaXMud2lkdGggPSBjYW52YXNXaWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXNIZWlnaHQ7XG4gICAgICAgIHRoaXMuZmllbGRIZWlnaHQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAqIDQuNSkgLyA2KTtcbiAgICAgICAgdGhpcy5maWVsZFhPZmZzZXQgPSBNYXRoLnJvdW5kKHRoaXMud2lkdGggLyAxNik7XG4gICAgICAgIHRoaXMuZmllbGRXaWR0aCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAtIHRoaXMuZmllbGRYT2Zmc2V0ICogMik7XG4gICAgICAgIHRoaXMuZ29hbEhlaWdodCA9IE1hdGgucm91bmQodGhpcy5maWVsZEhlaWdodCAvIDUpO1xuICAgICAgICB0aGlzLmdvYWxZT2Zmc2V0ID0gTWF0aC5yb3VuZCgodGhpcy5maWVsZEhlaWdodCAtIHRoaXMuZ29hbEhlaWdodCkgLyAyKTtcbiAgICAgICAgdGhpcy5nb2FsUG9zdFJhZGl1cyA9IE1hdGgucm91bmQodGhpcy5nb2FsSGVpZ2h0IC8gMjApO1xuICAgICAgICB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgPSBNYXRoLnJvdW5kKCgodGhpcy5oZWlnaHQgLSB0aGlzLmZpZWxkSGVpZ2h0KSAqIDUpIC8gNyk7XG4gICAgICAgIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgPSBNYXRoLnJvdW5kKCh0aGlzLmhlaWdodCAtIHRoaXMuZmllbGRIZWlnaHQgLSB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQpIC8gMik7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLmZsb29yKHRoaXMuZmllbGRIZWlnaHQgLyAyOCk7XG4gICAgICAgIHRoaXMucGxheWVyU2l6ZVdpdGhCb3JkZXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyICsgdGhpcy5wbGF5ZXJCb3JkZXI7XG4gICAgICAgIHRoaXMuc3Vic3RpdHV0aW9uT2Zmc2V0WCA9IE1hdGgucm91bmQodGhpcy5maWVsZFdpZHRoIC8gNCk7XG4gICAgICAgIHRoaXMucGxheWVyU3Vic3RpdHV0aW9uWCA9IHRoaXMuZmllbGRYT2Zmc2V0ICsgdGhpcy5zdWJzdGl0dXRpb25PZmZzZXRYO1xuICAgICAgICB0aGlzLmNwdVN1YnN0aXR1dGlvblggPSB0aGlzLmZpZWxkWE9mZnNldCArICh0aGlzLmZpZWxkV2lkdGggLSB0aGlzLnN1YnN0aXR1dGlvbk9mZnNldFgpO1xuICAgICAgICB0aGlzLnNoYWRvd0JsdXIgPSB0aGlzLnBsYXllclNpemVXaXRob3V0Qm9yZGVyO1xuICAgICAgICB0aGlzLnNoYWRvd09mZnNldCA9IHRoaXMucGxheWVyU2l6ZVdpdGhvdXRCb3JkZXIgKiAwLjM7XG4gICAgICAgIHRoaXMuZmllbGRCb3JkZXJTaXplID0gTWF0aC5yb3VuZCh0aGlzLmZpZWxkSGVpZ2h0IC8gMTAwKTtcbiAgICAgICAgdGhpcy5wbGF5ZXJTdGFydFBvc2l0aW9uWE9mZnNldCA9IHRoaXMuZmllbGRXaWR0aCAvIDg7XG4gICAgICAgIHRoaXMucGxheWVyU3RhcnRQb3NpdGlvbllPZmZzZXQgPSB0aGlzLmZpZWxkSGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5zdWJzdGl0dXRlU3RhcnRQb3NpdGlvbllPZmZzZXQgPVxuICAgICAgICAgICAgdGhpcy5maWVsZEhlaWdodCArIHRoaXMuYXRobGV0aWNUcmFja1lPZmZzZXQgKyB0aGlzLmF0aGxldGljVHJhY2tIZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLmdhdGVzTGVuZ3RoID0gdGhpcy5wbGF5ZXJTaXplV2l0aEJvcmRlciAqIDMuNTtcbiAgICAgICAgdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgPSBNYXRoLnJvdW5kKHRoaXMuZmllbGRIZWlnaHQgLyA4MCk7XG4gICAgICAgIHRoaXMuYmFsbFNpemVXaXRoQm9yZGVyID0gdGhpcy5iYWxsU2l6ZVdpdGhvdXRCb3JkZXIgKyB0aGlzLmJhbGxCb3JkZXI7XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lQ29uZmlncyA9IEdhbWVDb25maWdzO1xuR2FtZUNvbmZpZ3MuSVNfREVCVUcgPSB0cnVlO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBc3NldExvYWRlcl8xID0gcmVxdWlyZShcIi4vYXNzZXRzL0Fzc2V0TG9hZGVyXCIpO1xuY29uc3QgR2FtZUxvb3BfMSA9IHJlcXVpcmUoXCIuL2NvcmUvR2FtZUxvb3BcIik7XG5jb25zdCBEb21IYW5kbGVyXzEgPSByZXF1aXJlKFwiLi91aS9Eb21IYW5kbGVyXCIpO1xuY29uc3QgR2FtZUNvbmZpZ3NfMSA9IHJlcXVpcmUoXCIuL3V0aWxzL0dhbWVDb25maWdzXCIpO1xuY2xhc3MgTWFpbiB7XG4gICAgYXN5bmMgaW5pdCgpIHtcbiAgICAgICAgY29uc3QgYXNzZXRMb2FkZXIgPSBuZXcgQXNzZXRMb2FkZXJfMS5Bc3NldExvYWRlcigpO1xuICAgICAgICBhd2FpdCBhc3NldExvYWRlci5pbml0KCk7XG4gICAgICAgIGNvbnN0IGRvbUhhbmRsZXIgPSBuZXcgRG9tSGFuZGxlcl8xLkRvbUhhbmRsZXIoKTtcbiAgICAgICAgY29uc3QgZ2FtZUNvbmZpZ3MgPSBuZXcgR2FtZUNvbmZpZ3NfMS5HYW1lQ29uZmlncyhkb21IYW5kbGVyLmJhY2tncm91bmRDYW52YXMud2lkdGgsIGRvbUhhbmRsZXIuYmFja2dyb3VuZENhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmNsb3NlTG9hZGluZ1dpbmRvdygpO1xuICAgICAgICBjb25zdCBnYW1lTG9vcCA9IG5ldyBHYW1lTG9vcF8xLkdhbWVMb29wKGdhbWVDb25maWdzLCBkb21IYW5kbGVyLCBhc3NldExvYWRlcik7XG4gICAgICAgIGdhbWVMb29wLm1haW4oKTtcbiAgICB9XG4gICAgY2xvc2VMb2FkaW5nV2luZG93KCkge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2FkaW5nRGl2XCIpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBcIjBcIjtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kKTtcbiAgICAgICAgICAgIC8vZG9tSGFuZGxlci5tZW51Q2FudmFzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIH0sIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG59XG5jb25zdCBtYWluID0gbmV3IE1haW4oKTtcbm1haW4uaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9
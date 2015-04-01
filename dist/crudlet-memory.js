(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
var extend       = require("xtend/mutable");
var sift         = require("sift");
var protoclass   = require("protoclass");
var Writable     = require("obj-stream").Writable;

/**
 */

function _json(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 */

function MemoryDatabase(options) {
  if (!options) options = {};

  this.options    = options;
  this.idProperty = options.idProperty || "id";
  this.name       = options.name       || "memory";
  this.db         = {};
}

/**
 */

protoclass(MemoryDatabase, {

  /**
   */

  run: function(operation, onRun) {
    var method = this[operation.name];
    if (!method) return onRun();
    operation = extend({}, this.options, operation, operation[this.name] || {});
    if (!operation.collection) return onRun(new Error("collection must exist"));
    var self = this;
    method.call(this, this._collection(operation), operation, function() {
      onRun.apply(this, arguments);
    });
  },

  /**
   */

  insert: function(collection, options, onRun) {

    var newData = _json(options.data || {});

    if (Object.prototype.toString.call(newData) === "[object Array]") {
      collection.push.apply(collection, newData);
    } else {
      collection.push(newData);
    }

    onRun(void 0, newData);
  },

  /**
   */

  update: function(collection, options, onRun) {
    var items = sift(options.query, collection);
    var ret = items;

    if (options.multi) {
      for (var i = items.length; i--;) extend(items[i], options.data);
    } else {
      var item = items.shift();
      ret = item;
      if (item) extend(item, options.data);
    }

    onRun(void 0, ret);
  },

  /**
   */

  upsert: function(collection, options, onRun) {
    var self = this;
    this.update(collection, options, function(err, item) {
      if (item) return onRun(err, item);
      self.insert(collection, options, onRun);
    });
  },

  /**
   */

  remove: function(collection, options, onRun) {

    var items = sift(options.query, collection);
    var ret = items;

    if (options.multi) {
      for (var i = items.length; i--;) collection.splice(collection.indexOf(items[i]), 1);
    } else {
      var item = items.shift();
      ret = item;
      if (item) collection.splice(collection.indexOf(item), 1);
    }

    onRun(void 0, ret);
  },

  /**
   */

  load: function(collection, options, onRun) {
    var items = options.query ? sift(options.query, collection) : collection.concat();
    onRun(void 0, options.multi ? items : items.shift());
  },

  /**
   */

  _collection: function(options) {
    return this.db[options.collection] || (this.db[options.collection] = []);
  }
});

/**
 */

module.exports = function(options) {
  return module.exports.getStreamer(MemoryDatabase)(options);
};

/**
 */

module.exports.getStreamer = function(clazz) {
  return function(options) {
    var db = new clazz(options);

    function ret (name, properties) {

      var stream = new Writable();

      process.nextTick(function() {
        db.run(extend({name:name}, properties), function(err, data) {
          if (err) stream.emit("error", err);
          if (Object.prototype.toString.call(data) === "[object Array]") {
            data.forEach(function(item) {
              stream.write(item);
            });
          } else if (data) {
            stream.write(data);
          }
          stream.end();
        });
      });

      return stream.reader;
    }

    ret.target = db;
    return ret;
  };
};

/**
 */

module.exports.extend = function() {
  return MemoryDatabase.extend.apply(MemoryDatabase, arguments);
};

}).call(this,require('_process'))
},{"_process":3,"obj-stream":5,"protoclass":11,"sift":12,"xtend/mutable":13}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
var protoclass = require("protoclass");
var Writer     = require("./writable");

/**
 */

function Stream (reader, writer) {
  if (!(this instanceof Stream)) return new Stream();
  this._writer = writer || new Writer();
  this._reader = reader || this._writer.reader;
}

/**
 */

protoclass(Stream, {

  /**
   */

  readable: true,
  writable: true,

  /**
   */

  pause: function() {
    return this._reader.pause();
  },

  /**
   */

  resume: function() {
    return this._reader.resume();
  },

  /**
   */

  write: function(object) {
    return this._writer.write.apply(this._writer, arguments);
  },

  /**
   */

  end: function(object) {
    return this._writer.end.apply(this._writer, arguments);
  },

  /**
   */

  emit: function() {
    return this._reader.emit.apply(this._reader, arguments);
  },

  /**
   */

  on: function() {
    this._reader.on.apply(this._reader, arguments);
    return this;
  },

  /**
   */

  once: function() {
    this._reader.once.apply(this._reader, arguments);
    return this;
  },

  /**
   */

  removeListener: function() {
    return this._reader.removeListener.apply(this._reader, arguments);
  },

  /**
   */

  pipe: function() {
    return this._reader.pipe.apply(this._reader, arguments);
  }
});

module.exports = Stream;

},{"./writable":10,"protoclass":11}],5:[function(require,module,exports){
var Readable = require("./readable");
var Writable = require("./writable");
var Stream   = require("./Stream");
var through  = require("./through");

exports.Readable = Readable;
exports.readable = Readable;

exports.Writable = Writable;
exports.writable = Writable;

exports.Stream = Stream;
exports.stream = Stream;

exports.through = through;

},{"./Stream":4,"./readable":7,"./through":9,"./writable":10}],6:[function(require,module,exports){
module.exports = function(src, dst, ops) {

  var listeners = [];

  function cleanup() {
    for (var i = listeners.length; i--;) listeners[i].dispose();
  }

  function onData(data) {
    if (dst.writable && dst.write(data) === false) {
      src.pause();
    }
  }

  function onDrain() {
    if (src.readable) {
      src.resume();
    }
  }

  function onError(error) {
    cleanup();
    // TODO: throw error if there are no handlers here
  }

  var didEnd = false;

  function onEnd() {
    if (didEnd) return;
    didEnd = true;
    dst.end();
  }

  function onClose() {
    if (didEnd) return;
    didEnd = true;
    if (typeof dst.destroy === "function") dst.destroy();
  }

  function listen(target, event, listener) {
    target.on(event, listener);
    return {
      dispose: function() {
        return target.removeListener(event, listener);
      }
    };
  }

  if (!ops || ops.end !== false) {
    listeners.push(
      listen(src, "end", onEnd),
      listen(src, "close", onClose)
    );
  }

  listeners.push(
    listen(src, "data", onData),
    listen(dst, "drain", onDrain),
    listen(src, "end", cleanup),
    listen(src, "close", cleanup),
    listen(dst, "close", cleanup),
    listen(src, "error", onError),
    listen(dst, "error", onError)
  );

  dst.emit("pipe", src);

  return dst;
};

},{}],7:[function(require,module,exports){
var protoclass   = require("protoclass");
var EventEmitter = require("events").EventEmitter;
var pipe         = require("./pipe");

/**
 */

function Readable () {
  if (!(this instanceof Readable)) return new Readable();
  EventEmitter.call(this);
}

/**
 */

protoclass(EventEmitter, Readable, {

  /**
   */

  _flowing: true,
  readable: true,
  writable: false,

  /**
   */

  pause: function() {
    if (!this._flowing) return;
    this._flowing = false;
    this.emit("pause");
  },

  /**
   */

  resume: function() {
    if (this._flowing) return;
    this._flowing = true;
    this.emit("resume");
  },

  /**
   */

  isPaused: function() {
    return !this._flowing;
  },

  /**
   */

  pipe: function(dst, ops) {
    return pipe(this, dst, ops);
  }
});

module.exports = Readable;

},{"./pipe":6,"events":2,"protoclass":11}],8:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"./writable":10,"dup":4,"protoclass":11}],9:[function(require,module,exports){
var protoclass = require("protoclass");
var Readable   = require("./readable");
var Stream     = require("./stream");
var Writable   = require("./writable");

/**
 */

function Through (stream) {
  this._stream = stream;
}

/**
 */

protoclass(Through, {
  push: function(object) {
    this._stream.write(object);
  }
});

/**
 */

module.exports = function(write, end) {

  var dstWriter = new Writable();
  var srcWriter = new Writable();
  var stream    = new Stream(dstWriter.reader, srcWriter);
  var through   = new Through(dstWriter);

  var buffer  = [];
  var running = false;
  var ended   = false;

  function _write() {
    if (running) return;

    if (buffer.length) {
      running = true;
      return write.call(through, buffer.shift(), function() {
        running = false;
        _write();
      });
    }

    if (ended) {
      dstWriter.end();
    }
  }

  srcWriter.reader.on("data", function(data) {
    buffer.push(data);
    _write();
  }).on("end", function() {
    ended = true;
    _write();
  });

  return stream;
};

},{"./readable":7,"./stream":8,"./writable":10,"protoclass":11}],10:[function(require,module,exports){
var protoclass   = require("protoclass");
var EventEmitter = require("events").EventEmitter;
var Reader       = require("./readable");

/**
 */

function Writable () {
  if (!(this instanceof Writable)) return new Writable();
  EventEmitter.call(this);

  this._pool  = [];
  this.reader = new Reader();

  var self = this;

  this.reader.on("pause", function() {
    self._pause();
  });

  this.reader.on("resume", function() {
    self._resume();
  });

}

/**
 */

protoclass(EventEmitter, Writable, {

  /**
   */

  _flowing: true,
  readable: false,

  /**
   */

  write: function(object) {
    if (!this._write(object)) {
      this._pool.push(object);
      return false;
    }
    return true;
  },

  /**
   */

  end: function(object) {

    if (object != void 0) {
      this.write(object);
    }

    this.reader.emit("end");
  },

  /**
   */

  _write: function(object) {
    if (this._flowing) {
      this.reader.emit("data", object);

      // might have changed on emit
      return this._flowing;
    } else {
      return false;
    }
  },

  /**
   */

  _pause: function() {
    this._flowing = false;
  },

  /**
   */

  _resume: function() {
    if (this._flowing) return;
    this._flowing = true;
    this.emit("drain");
    while (this._pool.length) {
      var item = this._pool.shift();
      if (!this._write(item)) {
        this._pool.unshift(item);
        break;
      }
    }
  }
});

module.exports = Writable;

},{"./readable":7,"events":2,"protoclass":11}],11:[function(require,module,exports){
function _copy (to, from) {

  for (var i = 0, n = from.length; i < n; i++) {

    var target = from[i];

    for (var property in target) {
      to[property] = target[property];
    }
  }

  return to;
}

function protoclass (parent, child) {

  var mixins = Array.prototype.slice.call(arguments, 2);

  if (typeof child !== "function") {
    if(child) mixins.unshift(child); // constructor is a mixin
    child   = parent;
    parent  = function() { };
  }

  _copy(child, parent); 

  function ctor () {
    this.constructor = child;
  }

  ctor.prototype  = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  child.parent    = child.superclass = parent;

  _copy(child.prototype, mixins);

  protoclass.setup(child);

  return child;
}

protoclass.setup = function (child) {


  if (!child.extend) {
    child.extend = function(constructor) {

      var args = Array.prototype.slice.call(arguments, 0);

      if (typeof constructor !== "function") {
        args.unshift(constructor = function () {
          constructor.parent.apply(this, arguments);
        });
      }

      return protoclass.apply(this, [this].concat(args));
    }

    child.mixin = function(proto) {
      _copy(this.prototype, arguments);
    }

    child.create = function () {
      var obj = Object.create(child.prototype);
      child.apply(obj, arguments);
      return obj;
    }
  }

  return child;
}


module.exports = protoclass;
},{}],12:[function(require,module,exports){
/*
 * Sift
 *
 * Copryright 2011, Craig Condon
 * Licensed under MIT
 *
 * Inspired by mongodb's query language
 */

(function() {

  "use strict";

  //traversable statements
  var TRAV_OP = {
    $and  : true,
    $or   : true,
    $nor  : true,
    $trav : true,
    $not  : true
  };

  var _testers = {

    /**
     */

    $eq: function(a, b) {
      return a.test(b);
    },

    /**
     */

    $ne: function(a, b) {
      return !a.test(b);
    },

    /**
     */

    $lt: function(a, b) {
      return a > b;
    },

    /**
     */

    $gt: function(a, b) {
      return a < b;
    },

    /**
     */

    $lte: function(a, b) {
      return a >= b;
    },

    /**
     */

    $gte: function(a, b) {
      return a <= b;
    },

    /**
     */

    $exists: function(a, b) {
      return a === (b != null);
    },

    /**
     */

    $in: function(a, b) {

      //intersecting an array
      if (b instanceof Array) {

        for (var i = b.length; i--;) {
          if (~a.indexOf(b[i])) return true;
        }

      } else {
        return ~a.indexOf(b);
      }

      return false;
    },

    /**
     */

    $not: function(a, b) {
      if (!a.test) throw new Error("$not test should include an expression, not a value. Use $ne instead.");
      return !a.test(b);
    },

    /**
     */

    $type: function(a, b, org) {
      //instanceof doesn't work for strings / boolean. instanceof works with inheritance
      return org != null ? org instanceof a || org.constructor == a : false;
    },

    /**
     */

    $nin: function(a, b) {
      return !_testers.$in(a, b);
    },

    /**
     */

    $mod: function(a, b) {
      return b % a[0] == a[1];
    },

    /**
     */

    $all: function(a, b) {
      if (!b) b = [];
      for (var i = a.length; i--;) {
        var a1 = a[i];
        var indexInB = ~b.indexOf(a1);
        if (!indexInB) return false;
      }

      return true;
    },

    /**
     */

    $size: function(a, b) {
      return b ? a === b.length : false;
    },

    /**
     */

    $or: function(a, b) {

      var i = a.length;
      var n = i;

      for (; i--;) {
        if (test(a[i], b)) {
          return true;
        }
      }

      return n === 0;
    },

    /**
     */

    $nor: function(a, b) {

      var i = a.length;

      for (; i--;) {
        if (test(a[i], b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $and: function(a, b) {

      for (var i = a.length; i--;) {
        if (!test(a[i], b)) {
          return false;
        }
      }

      return true;
    },

    /**
     */

    $trav: function(a, b) {

      if (b instanceof Array) {

        for (var i = b.length; i--;) {
          var subb = b[i];
          if (subb[a.k] && test(a, subb[a.k])) return true;
        }

        return false;
      }

      //continue to traverse even if there isn't a value - this is needed for
      //something like name:{$exists:false}
      return test(a, b ? b[a.k] : void 0);
    },

    /**
     */

    $regex: function(a, b) {
      var aRE = new RegExp(a);
      return aRE.test(b);
    },

    /**
     */

    $where: function(a, b) {
      return a.call(b, b);
    },

    /**
     */

    $elemMatch: function (a, b) {
      return a.test(b);
    }
  };

  var _prepare = {

    /**
     */

    $eq: function(a) {

      var fn;

      if (a instanceof RegExp) {
        return a;
      } else if (a instanceof Function) {
        fn = a;
      } else {
        fn = function(b) {
          if (b instanceof Array) {
            return ~b.indexOf(a);
          } else {
            return a === b;
          }
        };
      }

      return {
        test: fn
      };
    },

    /**
     */

    $ne: function(a) {
      return _prepare.$eq(a);
    },

     /**
      */

    $where: function(a) {

      if (typeof a === "string") {
        return new Function("obj", "return " + a);
      }

      return a;
    },

    /**
     */

    $elemMatch: function (a) {
      return parse(a);
    }
  };

  /**
   */

  function getExpr(type, key, value) {

    var v = comparable(value);

    return {

      //k key
      k: key,

      //v value
      v: _prepare[type] ? _prepare[type](v) : v,

      //e eval
      e: _testers[type]
    };
  }

  /**
   * tests against data
   */

  function test(statement, data) {

    var exprs    = statement.exprs;

    //generally, expressions are ordered from least efficient, to most efficient.
    for (var i = 0, n = exprs.length; i < n; i++) {

      var expr = exprs[i];

      if (!expr.e(expr.v, comparable(data), data)) return false;

    }

    return true;
  }

  /**
   * parses a statement into something evaluable
   */

  function parse(statement, key) {

    //fixes sift(null, []) issue
    if (!statement) statement = { $eq: statement };

    var testers = [];

    //if the statement is an object, then we're looking at something like: { key: match }
    if (statement && statement.constructor === Object) {

      for (var k in statement) {

        //find the apropriate operator. If one doesn't exist and the key does not start
        //with a $ character, then it's a property, which means we create a new statement
        //(traversing)
        var operator;
        if (!!_testers[k]) {
          operator = k;

        // $ == 36
        } else if (k.charCodeAt(0) !== 36) {
          operator = "$trav";
        } else {
          throw new Error("Unknown operator " + k + ".");
        }

        //value of given statement (the match)
        var value = statement[k];

        //default = match
        var exprValue = value;

        //if we're working with a traversable operator, then set the expr value
        if (TRAV_OP[operator]) {

          //using dot notation? convert into a sub-object
          if (~k.indexOf(".")) {
            var keyParts = k.split(".");
            k = keyParts.shift(); //we're using the first key, so remove it

            exprValue = value = convertDotToSubObject(keyParts, value);
          }

          //*if* the value is an array, then we're dealing with something like: $or, $and
          if (value instanceof Array) {

            exprValue = [];

            for (var i = value.length; i--;) {
              exprValue.push(parse(value[i]));
            }

          //otherwise we're dealing with $trav
          } else {
            exprValue = parse(value, k);
          }
        }

        testers.push(getExpr(operator, k, exprValue));
      }

    //otherwise we're comparing a particular value, so set to eq
    } else {
      testers.push(getExpr("$eq", key, statement));
    }

    var stmt =  {
      exprs: testers,
      k: key,
      test: function(value) {
        return test(stmt, value);
      }
    };

    return stmt;
  }

  /**
   */

  function comparable(value) {
    if (value instanceof Date) {
      return value.getTime();
    } else if (value instanceof Array) {
      return value.map(comparable);
    } else {
      return value;
    }
  }

  /**
   */

  function convertDotToSubObject(keyParts, value) {

    var subObject    = {};
    var currentValue = subObject;

    for (var i = 0, n = keyParts.length - 1; i < n; i++) {
      currentValue = currentValue[keyParts[i]] = {};
    }

    currentValue[keyParts[i]] = value;

    return subObject;
  }

  /**
   */

  function getSelector(selector) {

    if (!selector) {

      return function(value) {
        return value;
      };

    } else if (typeof selector == "function") {
      return selector;
    }

    throw new Error("Unknown sift selector " + selector);
  }

  /**
   * sifts the given function
   * @param query the mongodb query
   * @param target the target array
   * @param rawSelector the selector for plucking data from the given target
   */

  function sift(query, target, rawSelector) {

    //must be an array
    if (typeof target != "object") {
      rawSelector = target;
      target = void 0;
    }

    var selector = getSelector(rawSelector);

    //build the filter for the sifter
    var sifter = parse(query);

    function filter(value) {
      return sifter.test(selector(value));
    }

    if (target) return target.filter(filter);

    filter.query = query;

    return filter;
  }

  sift.use = function(options) {
    if (options.operators) sift.useOperators(options.operators);
    if (typeof options === "function") options(sift);
  };

  sift.useOperators = function(operators) {
    for (var key in operators) {
      sift.useOperator(key, operators[key]);
    }
  };

  sift.useOperator = function(operator, optionsOrFn) {

    var options = {};

    if (typeof optionsOrFn == "object") {
      options = optionsOrFn;
    } else {
      options = { test: optionsOrFn };
    }

    var key = "$" + operator;
    _testers[key] = options.test;

    if (options.traversable || options.traverse) {
      TRAV_OP[key] = true;
    }
  };

  /* istanbul ignore next */
  if ((typeof module != "undefined") && (typeof module.exports != "undefined")) {
    module.exports = sift;
  } else
  if (typeof window != "undefined") {
    window.sift = sift;
  }
})();

},{}],13:[function(require,module,exports){
module.exports = extend

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1]);

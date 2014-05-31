(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
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

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright Joyent, Inc. and other Node contributors.
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":4,"__browserify_process":3,"inherits":2}],6:[function(require,module,exports){
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sampleUrls = require('./sampleUrls');
var Scheduler = require('./Scheduler');
var StepSequencer = require('./StepSequencer');
var Transport = require('./Transport');
var GainControl = require('./GainControl');
var FilterControl = require('./FilterControl');
var QControl = require('./QControl');
var BufferLoader = require('./BufferLoader');
var Sample = require('./Sample');
var Tempo = require('./Tempo');
var ControlPanel = require('./ControlPanel');
var Save = require('./Save');

// Sort out the AudioContext
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  window.oAudioContext ||
  window.msAudioContext;

/**
 * @constructor
 */
function App() {
  this.socket = null;
  this.context = null;
  this.bufferLoader = null;
  this.bufferList = null;
  this.scheduler = null;
  this.stepSequencer = null;
  this.transport = null;
  this.gainControl = null;
  this.filterControl = null;
  this.qControl = null;
  this.sampleUrls = null;
  this.samples = [];
  this.tempo = null;
  this.controlPanel = null;
  this.pubsub = null;
  this.save = null;
}

/**
 * Bootstrap the app
 * @return this
 */
App.prototype.init = function() {
  var body,
    callback = this.callbackLoaded.bind(this);

  if (window.AudioContext) {
    this.socket = io.connect('http://localhost');
    this.pubsub = new EventEmitter();
    this.pubsub.setMaxListeners(0);
    this.context = new AudioContext();
    this.tempo = new Tempo('tempo', this.pubsub);
    this.controlPanel = new ControlPanel('control-panel', 'control-panel-title', this.pubsub);
    this.scheduler = new Scheduler(this.context, this.pubsub, this.tempo.tempo);
    this.stepSequencer = new StepSequencer('step-sequencer', this.context, this.pubsub, this.scheduler, this.socket, 'Drums');
    this.transport = new Transport('transport', 'play', 'pause', this.context, this.pubsub);
    this.gainControl = new GainControl('gain-control', this.socket, this.pubsub);
    this.filterControl = new FilterControl('filter-control', this.context, this.pubsub, this.socket, 'filter-toggle', 'lowpass', 440);
    this.qControl = new QControl('q-control', this.socket, this.pubsub);
    this.sampleUrls = sampleUrls;
    this.bufferLoader = new BufferLoader(
      this.context,
      this.sampleUrls,
      callback
    );
    this.save = new Save('save', this.pubsub, this.filterControl, this.qControl, this.gainControl, this.tempo, this.stepSequencer);

    this.bufferLoader.load();
  } else {
    this.handleNoSupport();
  }

  return this;
}

/**
 * Callback passed as a parameter to the BufferLoader instance
 * @param bufferList {array}
 */
App.prototype.callbackLoaded = function(bufferList) {
  this.setBufferList(bufferList);

  // @TODO manage all the controls within a ControlPanel instance
  this.controlPanel.init();
  this.gainControl.init(this.context.createGain());
  this.filterControl.init(this.context.createBiquadFilter());
  this.qControl.init(this.filterControl.node);
  this.transport.init();
  this.tempo.init();
  this.save.init();

  this.createSamples();
  this.stepSequencer.init(this.samples);
  this.scheduler.init(this.stepSequencer);

  this._handleIO();
}

/**
 * Tell user to use a better browser.
 */
App.prototype.handleNoSupport = function() {
  body = document.getElementsByTagName('body');
  body[0].innerHTML = '<h1>Aww snap! This browser does not support the Web Audio API.</h1>';
}

/**
 *  Handle websockets events and communication
 */
App.prototype._handleIO = function() {
  this.socket.emit('app:loaded');
}

/**
 *  Errr, umm, create the sample instances
 * @return this
 */
App.prototype.createSamples = function() {
  for (var i = 0; i < this.bufferList.length; i++) {
    this.samples[i] = new Sample(this.context, this.pubsub, this.filterControl.node, this.gainControl.node, this.sampleUrls[i], this.bufferList[i]);
    this.samples[i].init(this.filterControl.isEnabled);
  }
  return this;
}

/**
 * Set bufferList property
 * @param bufferList {array}
 * @return this
 */
App.prototype.setBufferList = function(bufferList) {
  this.bufferList = bufferList;
  return this;
}

/**
 * Fired when the init method is called and app is successfully bootstrapped
 *
 * @event
 * @name app:loaded
 * @memberOf App
 */

module.exports = App;

},{"./BufferLoader":7,"./ControlPanel":8,"./FilterControl":9,"./GainControl":10,"./QControl":13,"./Sample":14,"./Save":15,"./Scheduler":16,"./StepSequencer":17,"./Tempo":18,"./Transport":19,"./sampleUrls":22,"events":1,"util":5}],7:[function(require,module,exports){
// Borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/
function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i) {
  	this.loadBuffer(this.urlList[i], i);
  }
}

module.exports = BufferLoader;

},{}],8:[function(require,module,exports){
function ControlPanel(id, titleId, pubsub) {
  this.id = id;
  this.titleId = titleId;
  this.domEl = document.getElementById(this.id);
  this.titleDomEl = null;
  this.isOpen = true;
  this.isClosed = false;
  this.openClass = 'open';
  this.closedClass = 'closed';
}

ControlPanel.prototype.init = function() {
  this.setTitleDomEl();
  this._handleEvents();
}

ControlPanel.prototype.setTitleDomEl = function() {
  this.titleDomEl = document.getElementById(this.titleId);
  return this;
}

ControlPanel.prototype._handleEvents = function() {
  var self = this;


  // click
  this.titleDomEl.addEventListener('click', function(e) {

    if (self.isClosed) {
      self.open();
    } else {
      self.close();
    }

  }, false);

  // key press
  window.addEventListener('keydown', function(e) {

    // 67 = c
    if (67 === e.which) {
      if (self.isClosed) {
        self.open();
      } else {
        self.close();
      }
    }

  }, false);

  this._handleResize();
}

ControlPanel.prototype._handleResize = function() {
  var mql = window.matchMedia('(min-width: 70em)');
  mql.addListener(this._handleMql.bind(this));
  this._handleMql(mql);
}

ControlPanel.prototype._handleMql = function(mql) {
  if (mql.matches) {
    //viewport is wider than 70em
    this.open();
  } else {
    // viewport is less than 70em
    this.close();
  }
}

ControlPanel.prototype.open = function() {
  this.isOpen = true;
  this.isClosed = false;
  this.domEl.classList.remove(this.closedClass);
  this.domEl.classList.add(this.openClass);
}

ControlPanel.prototype.close = function() {
  this.isOpen = false;
  this.isClosed = true;
  this.domEl.classList.add(this.closedClass);
  this.domEl.classList.remove(this.openClass);
}

module.exports = ControlPanel;

},{}],9:[function(require,module,exports){
var Knob = require('./Knob');

/**
 * @constructor
 * Manages a filter ui control and the audio context filter node
 */
function FilterControl(id, context, pubsub, socket, toggleId, type, cutoff) {

  /**
   * Hidden html range input id
   * @property {string}
   */
  this.id = id;

  /**
   * The audio context instance
   * @property {object}
   */
  this.context = context;

  /**
   * the pubsub instance
   * @property {object}
   */
  this.pubsub = pubsub;

  /**
   * the websocket instance
   * @property {object}
   */
  this.socket = socket;

  /**
   * Html checkbox id
   * @property {string}
   */
  this.toggleId = toggleId;

  /**
   * filter type (lowpass, hipass, etc)
   * @property {string}
   */
  this.type = type;

  /**
   * filter cutoff frequency value
   * @property {number}
   */
  this.cutoffFrequency = cutoff;

  /**
   * Hidden html range input dom reference
   * @property {object}
   */
  this.domEl = document.getElementById(this.id);

  /**
   * filter node instance
   * @property {object}
   */
  this.node = null;

  /**
   * html checkbox dom reference
   * @property {object}
   */
  this.toggleEl = document.getElementById(this.toggleId);

  /**
   * Is the filter currently enabled?
   * @property {boolean}
   */
  this.isEnabled = false;

  /**
   * instance of the Knob class
   * @property {object}
   */
  this.knob = new Knob('filter-knob', this.pubsub, 1);
}

/**
 * Init setup the instance
 * @param node {object} instance of context.createBiquadFilterNode()
 * @return this
 */
FilterControl.prototype.init = function(node) {
  this.knob.init();
  this._setIsEnabled();
  this._setNode(node);
  this._setFilterType(this.type);
  this._setCutoffFrequency(this.cutoffFrequency);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Sets the biquadfilternode instances filter type
 * @private
 * @param type {string} filter type per the webaudio BiQuadFilter w3c spec:
 *  http://www.w3.org/TR/webaudio/#BiquadFilterNode-section
 * @return this
 */
FilterControl.prototype._setFilterType = function(type) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.type = type || 'lowpass';
  return this;
}

/**
 * Sets the biquadfilternode instances frequency cutoff value
 * @private
 * @param frequency {number} the cutoff frequency value (in Hz)
 * @return this
 */
FilterControl.prototype._setCutoffFrequency = function(frequency) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.frequency.value = frequency || 440;
}

/**
 * Sets the isEnabled property
 * @private
 */
FilterControl.prototype._setIsEnabled = function() {
  this.isEnabled = (this.toggleEl !== null) ? this.toggleEl.checked : false;
}

/**
 * Set node property
 * @private
 * @param node {object} instance of context.createFilterNode()
 * @return this
 */
FilterControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
FilterControl.prototype.changeFilter = function(element) {
  // Clamp the frequency between the minimum value (40 Hz) and half of the
  // sampling rate.
  var minValue = 40;
  var maxValue = this.context.sampleRate / 2;
  // Logarithm (base 2) to compute how many octaves fall in the range.
  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  // Compute a multiplier from 0 to 1 based on an exponential scale.
  var multiplier = Math.pow(2, numberOfOctaves * (element.value - 1.0));
  // Get back to the frequency value between min and max.
  this.node.frequency.value = maxValue * multiplier;
}

/**
 * Bind listeners to events
 * @private
 */
FilterControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeFilter(e.target);
  }, false);

  //click
  this.toggleEl.addEventListener('click', function(e) {
    self.isEnabled = self.toggleEl.checked;
    self.pubsub.emit('filter:enabled:' + self.isEnabled);
  }, false);

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
    self.setInputRangeValue(data.value);
    self.changeFilter(self.domEl);
  });
}

/**
 * Handle websockets events and communication
 */
FilterControl.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('control:filter:loaded');

  this.socket.on('j5:buttonFilter:down', function() {
    self.toggleFilter();
  });

  this.socket.on('j5:potFilter:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Handle filter checkbox checked status; emit a corresponding event
 */
FilterControl.prototype.toggleFilter = function() {
  this.isEnabled = !this.isEnabled;
  this.toggleEl.checked = this.isEnabled;
  this.pubsub.emit('filter:enabled:' + this.isEnabled);
}

/**
 * Update filter ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
FilterControl.prototype._updateKnob = function(data) {
  this.setInputRangeValue(data.calculated);
  this.changeFilter(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Set the filter's html input range value
 * @param data {number}
 */
FilterControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Fired when the filter checkbox is checked
 *
 * @event
 * @name filter:enabled:true
 * @memberOf FilterControl
 */

/**
 * Fired when the filter checkbox is unchecked
 *
 * @event
 * @name filter:enabled:false
 * @memberOf FilterControl
 */


/**
 * Fired when the init method is called
 *
 * @event
 * @name control:filter:loaded
 * @memberOf FilterControl
 */

module.exports = FilterControl;

},{"./Knob":11}],10:[function(require,module,exports){
var Knob = require('./Knob');

/**
 * @constructor
 */
function GainControl(id, socket, pubsub) {
  this.id = id;
  this.socket = socket;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.node = null;
  this.knob = new Knob('gain-knob', this.pubsub, 100, true);
}

/**
 * Iinit setup the instance
 * @param node {object} instance of context.createGainNode()
 * @return this
 */
GainControl.prototype.init = function(node) {
  this.knob.init();
  this._setNode(node);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Set node property
 * @param node {object} instance of context.createGainNode()
 * @return this
 */
GainControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/volume-sample.js
GainControl.prototype.changeGain = function(element) {
  var volume = element.value;
  var fraction = parseInt(element.value) / parseInt(element.max);
  // Let's use an x*x curve (x-squared) since simple linear (x) does not sound as good.
  this.node.gain.value = fraction * fraction;
}

/**
 * Bind listeners to events
 * @private
 * @return undefined
 */
GainControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeGain(e.target);
  }, false);

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
    self.setInputRangeValue(data.value);
    self.changeGain(self.domEl);
  });
}

/**
 * Handle websockets events
 */
GainControl.prototype._handleIO = function() {
  var self = this,
    gainKnob = document.getElementById('gain-knob');

  this.socket.emit('control:gain:loaded');

  this.socket.on('j5:potGain:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Set the gain's html input range value
 * @param data {number}
 */
GainControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Update ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
GainControl.prototype._updateKnob = function(data) {
  this.setInputRangeValue(data.calculated);
  this.changeGain(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name control:gain:loaded
 * @memberOf GainControl
 */

module.exports = GainControl;

},{"./Knob":11}],11:[function(require,module,exports){
var dom = require('./dom');
var utils = require('./utils');

/**
 * Borrowed the general concept and math from
 * https://github.com/martinaglv/KnobKnob/blob/master/knobKnob/knobKnob.jquery.js
 * @constructor
 */
function Knob(id, pubsub, rangeMax, initMax) {

  /**
   * dom element id
   */
  this.id = id;

  /**
   * The pubsub instance
   */
  this.pubsub = pubsub;

  /**
   * The html input range max value for the knob control
   * @member {number}
   */
  this.rangeMax = rangeMax;

  /**
   * Dynamically named event emitted on mouse events
   * @member {string}
   */
  this.eventName = this.id + ':turn';

  /**
   * dom element reference
   * @member {object}
   */
  this.domEl = document.getElementById(this.id);

  /**
   * Save the starting position of the drag
   * @member {number}
   */
  this.startDeg = -1;

  /**
   * Keep track of the current degree the knob is turned to
   * @member {number}
   */
  this.currentDeg = 0;

  /**
   * Store the current degree the knob is turned to on mouseup
   * @member {number}
   */
  this.rotation = 0;

  /**
   * The last degree the knob was turned to
   * @member {number}
   */
  this.lastDeg = 0;

  /**
   * Maximum degree the knob should be turned
   * @member {number}
   */
  this.maxDeg = 270;

  /**
   * Should the knob be turned to the maxDeg on initialization
   * @member {boolean}
   */
  this.initMax = initMax;
}

Knob.prototype.init = function() {
  this._handleEvents();

  if (this.initMax) {
    this.rotation = this.lastDeg = this.currentDeg = this.maxDeg;
    this.turn(this.maxDeg);
  }
}

/**
 * Rotate the knob dom element
 * @return this
 */
Knob.prototype.turn = function(value) {
  this.domEl.style.webkitTransform = 'rotate(' + value + 'deg)';
  this.domEl.style.transform = 'rotate(' + value + 'deg)';
  return this;
}

//@TODO Add touch support
Knob.prototype._handleEvents = function() {
  var self = this;

  //mousedown, touchstart
  this.domEl.addEventListener('mousedown', function(e) {

    e.preventDefault();

    var offset = dom.getOffset(self.domEl);

    var center = {
      y: offset.top + dom.getHeight(self.domEl) / 2,
      x: offset.left + dom.getWidth(self.domEl) / 2
    };

    var a, b, deg, tmp;

    var rad2deg = 180 / Math.PI;

    var handleMousemove = function(e) {

      //e = (e.touches) ? e.touches[0] : e;

      a = center.y - e.pageY;
      b = center.x - e.pageX;
      deg = Math.atan2(a, b) * rad2deg;

      // we have to make sure that negative
      // angles are turned into positive:
      if (deg < 0) {
          deg = self.maxDeg + deg;
      }

      // Save the starting position of the drag
      if (self.startDeg === -1) {
          self.startDeg = deg;
      }

      // Calculating the current rotation
      tmp = Math.floor((deg - self.startDeg) + self.rotation);

      // Making sure the current rotation
      // stays between 0 and (this.maxDeg - 1)
      if (tmp < 0) {
          tmp = self.maxDeg + tmp;
      } else if (tmp > (self.maxDeg - 1)) {
          tmp = tmp % self.maxDeg;
      }

      // This would suggest we are at an end position;
      // we need to block further rotation.
      if (Math.abs(tmp - self.lastDeg) > 180) {
          return false;
      }

      self.currentDeg = tmp;
      self.lastDeg = tmp;

      self.turn(self.currentDeg);

      self.pubsub.emit(self.eventName, {value: utils.normalize(self.rangeMax, self.maxDeg, self.currentDeg)});
    };

    var handleMouseup = function(e) {
      self.domEl.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('mouseup', handleMouseup);

      // Saving the current rotation
      self.rotation = self.currentDeg;

      // Marking the starting degree as invalid
      self.startDeg = -1;
    };

    //mousemove, touchmove
    self.domEl.addEventListener('mousemove', handleMousemove);

    //mouseup, touchend
    document.addEventListener('mouseup', handleMouseup);
  });
}

/**
 * Fired when the knob is turning
 *
 * @event
 * @name {id}-knob:turn
 * @memberOf Knob
 */

module.exports = Knob;

},{"./dom":20,"./utils":23}],12:[function(require,module,exports){
/**
 * @constructor
 */
function Pad(id, sample, key, domEl) {
  this.id = id;
  this.sample = sample;
  this.key = key;
  this.domEl = domEl;
  this.enabled = false;
  this.enabledClass = 'enabled';
}

/**
 * Bind event listeners for events we're interested in.
 * @param when {number} Where to begin playback
 * @return this
 */
Pad.prototype.press = function(when) {
  this.sample.play(when);
  return this;
}

/**
 * Toggle the enabled css class on the pad dom element
 * @return this
 */
Pad.prototype.toggleEnabled = function() {
  this.enabled = !this.enabled;
  if (this.enabled) {
    this.domEl.classList.add(this.enabledClass);
  } else {
    this.domEl.classList.remove(this.enabledClass);
  }
  return this;
}

module.exports = Pad;

},{}],13:[function(require,module,exports){
var Knob = require('./Knob');
/**
 * @constructor
 */
function QControl(id, socket, pubsub) {
  this.id = id;
  this.socket = socket;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.node = null;
  this.mult = 30;
  this.knob = new Knob('q-knob', this.pubsub, 1);
}

/**
 * Init setup the instance
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype.init = function(node) {
  this.knob.init();
  this._setNode(node);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Set node property
 * @param node {object} instance of context.createQNode()
 * @return this
 */
QControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
QControl.prototype.changeQ = function(element) {
  this.node.Q.value = element.value * this.mult;
}

/**
 * Bind listeners to events
 * @private
 * @return undefined
 */
QControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeQ(e.target);
  }, false);

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
    self.setInputRangeValue(data.value);
    self.changeQ(self.domEl);
  });
}

/**
 * Handle websockets events and communication
 */
QControl.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('control:q:loaded');

  this.socket.on('j5:potQ:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Update q ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
QControl.prototype._updateKnob = function(data) {
  this.setInputRangeValue(data.calculated);
  this.changeQ(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Set the Q's html input range value
 * @param data {number}
 */
QControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name control:q:loaded
 * @memberOf QControl
 */

module.exports = QControl;

},{"./Knob":11}],14:[function(require,module,exports){
/**
 * @constructor
 */
function Sample (context, pubsub, filterNode, gainNode, url, buffer) {
  this.context = context;
  this.pubsub = pubsub;
  this.filterNode = filterNode;
  this.gainNode = gainNode;
	this.url = url;
  this.buffer = buffer;
  this.source = null;
  this.filterEnabled = null;
};

/**
 * Setup the sample instance
 * @param isEnabled {boolean} value to se the isFilterEnabled property
 * @return this
 */
Sample.prototype.init = function(isEnabled) {
  var self = this;

  this.setFilterEnabled(isEnabled);

  this.pubsub.on('filter:enabled:true', function() {
    self.setFilterEnabled(true);
  });

  this.pubsub.on('filter:enabled:false', function() {
    self.setFilterEnabled(false);
  });

  return this;
}

/**
 * Set the filterEnabled property
 * @param isEnabled {boolean}
 * @return this
 */
Sample.prototype.setFilterEnabled = function(isEnabled) {
  this.filterEnabled = isEnabled;
  return this;
}

/**
 * Play the sound!
 * @param time {number} time to begin playback
 * @return this
 */
Sample.prototype.play = function (time) {
  time = time || 0;

  // create sample's sound source
  this.source = this.context.createBufferSource();

  // tell source which sound to play
  this.source.buffer = this.buffer;

  // connect source to specified nodes and destination
  // @TODO totally not sustainable, come up with something more clever
  // and abstract this out of here too.
  if (this.filterNode && this.filterEnabled && this.gainNode) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  } else if (this.filterNode && this.filterEnabled) {
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.context.destination);
  } else if (this.gainNode) {
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  } else {
    this.source.connect(this.context.destination);
  }

  this.source.start(time);

  return this;
}

/**
 * @param time {number} which point to stop the sample playback
 * @return this
 */
Sample.prototype.stop = function(time) {
  this.source.stop(time);
  return this;
}

module.exports = Sample;

},{}],15:[function(require,module,exports){
/**
 * @constructor
 */
function Save(id, pubsub, filterControl, qControl, gainControl, tempo, stepSequencer) {

  /**
   * The save control html element's id
   */
  this.id = id;

  /**
   * The app pubsub instance
   */
  this.pubsub = pubsub;

  /**
   * The save control html element dom reference
   */
  this.domEl = document.getElementById(this.id);

  /**
   * The FilterControl instance
   */
  this.filterControl = filterControl;

  /**
   * The QControl instance
   */
  this.qControl = qControl;

  /**
   * The GainControl instance
   */
  this.gainControl = gainControl;

  /**
   * The Tempo instance
   */
  this.tempo = tempo;

  /**
   * The StepSequencer instance
   */
  this.stepSequencer = stepSequencer;
}

/**
 * Setup the Save instance
 * @return this
 */
Save.prototype.init = function() {
  this.saveBtn = this.domEl.querySelector('.btn-save');
  this.saveOK = this.domEl.querySelector('.glyphicon-ok');
  this._handleEvents();

  return this;
}

/**
 * Subscribe and bind listeners to events
 * @private
 */
Save.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {
    self.save();
  });

  this.pubsub.on('save:ok', function(data) {
    self.onOK(data);
  });

  this.pubsub.on('save:error', function(data) {
    self.onError(data);
  });
}

/**
 * Save the current state of the app to localstorage
 * and emit an event on success/fail.
 * @TODO Create a save method for App.
 */
Save.prototype.save = function() {
  var xhr,
    self = this;

  var data = {
    q: this.qControl.domEl.value,
    filter: this.filterControl.domEl.value,
    filterEnabled: this.filterControl.isEnabled,
    gain: this.gainControl.domEl.value,
    tempo: this.tempo.getTempo(),
    stepSequencer: this.stepSequencer.getSequence()
  };

  xhr = new XMLHttpRequest();

  xhr.open('POST', '/save', true);

  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        console.log(xhr.responseText);
        self.pubsub.emit('save:ok', xhr.responseText);
      } else {
        self.pubsub.emit('save:error', {'error': xhr.statusText});
      }
    }
  }

  xhr.send(JSON.stringify(data));
}

/**
 * Handle successful save event
 * @param ajax success response
 */
Save.prototype.onOK = function(data) {
  this.saveOK.classList.remove('is-hidden');
  console.log('data from onOK', data);
}

/**
 * Handle failed save event
 * @param error {object}
 */
Save.prototype.onError = function(error) {
  //tell the user that save failed.
  console.log(error);
}

/**
 * Fired on a successful save
 *
 * @event
 * @name save:ok
 * @memberOf Save
 */

/**
 * Fired on a failed save attempt
 *
 * @event
 * @name save:error
 * @memberOf Save
 */

module.exports = Save;

},{}],16:[function(require,module,exports){
/**
 * Great read here:
 * http://www.html5rocks.com/en/tutorials/audio/scheduling/
 *
 * Borrowed (and mangled) ideas with gratitude from:
 * https://github.com/cwilso/metronome/blob/master/js/metronome.js
 *
 * Also borrowed some ideas from this one:
 * http://chromium.googlecode.com/svn/trunk/samples/audio/shiny-drum-machine.html
 *
 * @constructor
 */
function Scheduler(context, pubsub, tempo) {
  this.context = context;
  this.pubsub = pubsub;
  this.stepSequencer = null;

  /**
   * The start time of the entire sequence.
   */
  this.startTime;

  /**
   * What note is currently last scheduled?
   */
  this.currentNote;

  /**
   * What is the current time Mr. Templar?
   */
  this.currentTime = 0;

  /**
   * tempo (in beats per minute)
   */
  this.tempo = tempo;

  /**
   * How frequently to call scheduling function
   * (in milliseconds)
   */
  this.lookahead = 0.0;

  /**
   * How far ahead to schedule audio (sec)
   * This is calculated from lookahead, and overlaps
   * with next interval (in case the timer is late)
   */
  this.scheduleAheadTime = 0.2;

  /**
   * when the next note is due.
   */
  this.nextNoteTime = 0.0;

  /**
   * setTimeout identifier
   */
  this.timerID = 0;

  /**
   * An attempt to sync drawing time with sound
   */
  this.lastDrawTime = -1;
}

/**
 * Setup the instance
 * @return this
 */
Scheduler.prototype.init = function(stepSequencer) {
  this.stepSequencer = stepSequencer;
  this._handleEvents();
  return this;
}

/**
 * Increment currentNote and advance nextNoteTime
 */
Scheduler.prototype.nextNote = function() {
  // Advance current note and time by a 16th note...
  // Notice this picks up the CURRENT tempo value to calculate beat length.
  var secondsPerBeat = 60.0 / this.tempo;

  // Add beat length to last beat time
  this.nextNoteTime += 0.25 * secondsPerBeat;

  // Advance the beat number, wrap to zero
  this.currentNote++;
  if (this.currentNote == this.stepSequencer.sequenceLength) {
    this.currentNote = 0;
  }
}

/**
 * The "loop" to "schedule" notes to be played.
 * Also tries to sync drawing time with sound playback.
 * Is triggered when play button is pressed, recurses while step sequencer is playing.
 */
Scheduler.prototype.run = function() {
  var self = this,
    activeRowSamples = [];

  this.currentTime = this.context.currentTime;

  // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
  this.currentTime -= this.startTime;

  // determine which pads in the step sequencer's current row are enabled
  // and create an array of the samples corresponding to the enabled pads
  // for playback.
  // @TODO Is there a much better way to manage this?
  for (var j = 0, row = this.stepSequencer.grid[this.currentNote].pads; j < row.length; j++) {
    if (row[j].enabled) {
      activeRowSamples.push(row[j].sample);
    }
  }

  // while there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (this.nextNoteTime < this.currentTime + this.scheduleAheadTime) {
    // Convert noteTime to context time.
    var contextPlayTime = this.nextNoteTime + this.startTime;

    for (var i = 0; i < activeRowSamples.length; i++) {
      (function(x) {
        activeRowSamples[x].play(contextPlayTime);
      }(i));
    }

    // Attempt to synchronize drawing time with sound
    if (this.nextNoteTime !== this.lastDrawTime) {
      this.lastDrawTime = this.nextNoteTime;
      this.stepSequencer.draw((this.currentNote + 7) % this.stepSequencer.sequenceLength);
    }

    this.nextNote();
  }

  this.timerID = window.setTimeout(this.run.bind(this), this.lookahead);
}

/**
 * subscribe to and bind event listeners
 */
Scheduler.prototype._handleEvents = function() {
  var self = this;

  this.pubsub.on('tempo:set', function(data) {
    self.tempo = data.tempo;
  });
}

module.exports = Scheduler;

},{}],17:[function(require,module,exports){
var Pad = require('./Pad');

/**
 * @constructor
 */
function StepSequencer(id, context, pubsub, scheduler, socket, title) {

  /**
   * The step sequencer html element's id
   */
  this.id = id;

  /**
   * The AudioContext instance
   */
  this.context = context;

  /**
   * The app pubsub instance
   */
  this.pubsub = pubsub;

  /**
   * The app scheduler instance
   */
  this.scheduler = scheduler;

  /**
   * The app websocket instance
   */
  this.socket = socket;

  /**
   * The step sequencer html element dom reference
   */
  this.domEl = document.getElementById(this.id);

  /**
   * Array of sample instances
   */
  this.samples = null;

  /**
   * Refers to row length, but also represents grid size (8 x 8)
   */
  this.sequenceLength = 8;

  /**
   * Stores array of object references to each row's dom element and
   * containing pad instances as an array
   */
  this.rows = [];

  /**
   * Stores references to each cell of the sequencer grid.
   * Each cell holds an instance of the Pad class.
   */
  this.grid = [];

  /**
   * Sequencer grid column count
   */
  this.gridCols = this.sequenceLength;

  /**
   * Sequencer grid row count
   */
  this.gridRows = this.sequenceLength;

  /**
   * A map of pad instances. The pad instance's dom element
   * id is key, pad instance is the value. This map of pads
   * exists as arrays within the grid array property.
   */
  this.pads = {};

  /**
   * The grid's active row css class
   */
  this.rowActiveClass = 'active';

  /**
   * The displayed tabbed title
   */
  this.title = title;

  /**
   * Is this the active step sequencer?
   */
  this.isActiveSequencer = true;
}

/**
 * Setup the StepSequencer instance
 * @return this
 */
StepSequencer.prototype.init = function(samples) {
  this.samples = samples;
  this._addTitle();
  this._setupGrid();
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Create title html element and append it to parent
 * @return this
 */
StepSequencer.prototype._addTitle = function() {
  var title = document.createElement('h2');
  title.classList.add('title', 'step-sequencer-title', 'active');
  title.textContent = this.title;
  this.domEl.appendChild(title);
  return this;
}

/**
 * Create the step sequencer grid of pads,
 * instantiate Pad for each cell, and append the
 * generated dom to the step-sequencer dom element.
 * @return this
 */
StepSequencer.prototype._setupGrid = function() {
  var docFrag = document.createDocumentFragment();
  var row, obj, pads, pad;

  for (var i = 0; i < this.gridCols; i++) {

    //create the row dom element
    row = document.createElement('div');
    row.classList.add('step-row');
    row.id = 'step-row' + (i + 1);

    //store reference to the row dom element
    obj = {};
    obj['id'] = row.id;
    obj['domEl'] = row;
    this.grid[i] = obj;

    //initialize the local pads var before each for loop
    pads = [];

    //create the pads for each row
    for (var j = 0; j < this.gridRows; j++) {
      pad = document.createElement('div');
      pad.classList.add('pad', 'col', 'col' + (j + 1));
      pad.id = row.id + '_col' + (j + 1);
      pads[j] = new Pad(pad.id, this.samples[j], null, pad);
      //Store each pad instance in this.pads
      this.pads[pad.id] = pads[j];
      row.appendChild(pad);
    }
    this.grid[i].pads = pads;

    docFrag.appendChild(row);
  }
  this.domEl.appendChild(docFrag);

  return this;
}

/**
 * Update the grid row css class
 */
StepSequencer.prototype.draw = function(rowIndex) {
  var previousIndex = (rowIndex + 7) % this.sequenceLength;

  this.grid[rowIndex].domEl.classList.add(this.rowActiveClass);
  this.grid[previousIndex].domEl.classList.remove(this.rowActiveClass);
}

/**
 * Manage websockets event communication
 */
StepSequencer.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('stepsequencer:loaded');

  this.socket.on('j5:ready', function() {
    console.log('j5:ready');
  });

  this.socket.on('j5:button:down', function(data) {
    self.pads['step-row' + data.row + '_col' + data.col].toggleEnabled();
  });
}

/**
 * Subscribe and bind listeners to events
 * @private
 */
StepSequencer.prototype._handleEvents = function() {
  var self = this;

  this.pubsub.on('transport:play', function() {
    self.play();
  });

  this.pubsub.on('transport:pause', function() {
    self.pause();
  });

  //click
  this.domEl.addEventListener('click', function(e) {
    if (e.target.id in self.pads) {
      self.pads[e.target.id].toggleEnabled();
    }
  }, false);
}

/**
 * Kick off the scheduler loop
 */
StepSequencer.prototype.play = function (time) {
  this.scheduler.currentNote = this.scheduler.currentNote || 0;
  this.scheduler.startTime = this.context.currentTime + 0.005; // what's this 0.005 about?
  this.scheduler.nextNoteTime = 0.0;
  this.scheduler.run();
}

/**
 * Stop the scheduler loop
 */
StepSequencer.prototype.pause = function() {
  window.clearTimeout(this.scheduler.timerID);
}

/**
 * Which pads are currently disabled/enabled?
 * @return object
 */
StepSequencer.prototype.getSequence = function() {
  var seq = {};
  for (var pad in this.pads) {
    seq[pad] = this.pads[pad].enabled;
  }
  return seq;
}

/**
 * Fired when the init method is called
 *
 * @event
 * @name stepsequencer:loaded
 * @memberOf StepSequencer
 */

module.exports = StepSequencer;

},{"./Pad":12}],18:[function(require,module,exports){
/**
 * @constructor
 */
function Tempo(id, pubsub) {
  this.id = id;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.tempo = 120.0;
  this.tempoMin = 0;
  this.tempoMax = 240.0;
  this.decreaseId = 'tempo-decrease';
  this.increaseId = 'tempo-increase';
  this.bpmId = 'bpm';
}

/**
 * Setup the tempo instance
 */
Tempo.prototype.init = function() {
  this._handleEvents();
}

/**
 * Returns the tempo
 * @return {number}
 */
Tempo.prototype.getTempo = function() {
  return this.tempo;
}

/**
 * Set the tempo property with the provided value
 * and publish the event
 * @param tempo {number}
 * @return this
 */
Tempo.prototype.setTempo = function(tempo) {
  if (tempo < this.tempoMin) {
    tempo = this.tempoMin;
  }
  if (tempo > this.tempoMax) {
    tempo = this.tempoMax;
  }
  this.tempo = tempo;

  this.pubsub.emit('tempo:set', {tempo: this.tempo});

  return this;
}

/**
 * Update ui with current tempo value
 */
Tempo.prototype.updateBpm = function() {
  document.getElementById(this.bpmId).textContent = this.tempo;
}

/**
 * Decrement the tempo by 1
 */
Tempo.prototype.decrease = function() {
  this.setTempo(--this.tempo);
  this.updateBpm();
}

/**
 * Increment the tempo by 1
 */
Tempo.prototype.increase = function() {
  this.setTempo(++this.tempo);
  this.updateBpm();
}

/**
 * Subscribe to and bind event listeners
 */
Tempo.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {

    // decrease tempo
    if (e.target.id === self.decreaseId) {
      self.decrease();
    }

    //increase tempo
    if (e.target.id === self.increaseId) {
      self.increase();
    }
  }, false);

  //keydown
  document.addEventListener('keydown', function(e) {

    // down arrow
    if (e.keyCode === 40) {
      self.decrease();
    }

    // up arrow
    if (e.keyCode === 38) {
      self.increase();
    }
  });
}

/**
 * Fired when the tempo is set
 *
 * @event
 * @name tempo:set
 * @memberOf Tempo
 */

module.exports = Tempo;

},{}],19:[function(require,module,exports){
/**
 * @constructor
 */
function Transport(id, playId, pauseId, context, pubsub) {
  this.id = id;
  this.playId = playId;
  this.pauseId = pauseId;
  this.context = context;
  this.pubsub = pubsub;
  this.domEl = document.getElementById(this.id);
  this.playEl = document.getElementById(this.playId);
  this.pauseEl = document.getElementById(this.pauseId);
  this.isPlaying = false;
}

/**
 * Setup the transport instance
 */
Transport.prototype.init = function() {
  this._handleEvents();
}

/**
 * Toggle the isPlaying property value and publish
 * a corresponding event
 */
Transport.prototype.togglePlay = function() {
  this.isPlaying = !this.isPlaying;
  if (this.isPlaying) {
    this.pubsub.emit('transport:play');
  } else {
    this.pubsub.emit('transport:pause');
  }
}

/**
 * Bind listeners to events
 * @private
 */
Transport.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {

    // play
    if (e.target.id === self.playId) {
      console.log('play clicked');
      self.togglePlay();
    }

    // pause
    if (e.target.id === self.pauseId) {
      console.log('pause clicked');
      self.togglePlay();
    }
  }, false);

  //key
  document.addEventListener('keydown', function(e) {
    // space bar
    if (e.keyCode === 32) {
      self.togglePlay();
    }
  });
}

/**
 * Fired when transport is playing
 *
 * @event
 * @name transport:play
 * @memberOf Transport
 */

/**
 * Fired when transport is paused`
 *
 * @event
 * @name transport:paused
 * @memberOf Transport
 */

module.exports = Transport;

},{}],20:[function(require,module,exports){
exports.getOffset = function getOffset(elem) {
  var props = {},
    rect = elem.getBoundingClientRect();

  props.left = rect.left;
  props.top = rect.top;

  return props;
}

exports.getHeight = function getHeight(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.height;
}

exports.getWidth = function getWidth(elem) {
  var rect = elem.getBoundingClientRect();
  return rect.width;
}

},{}],21:[function(require,module,exports){
var App = require('./App');

window.app = new App();

// Bootstrap it.
window.addEventListener('load', function () {
  'use strict';

  app.init();

}, false);

},{"./App":6}],22:[function(require,module,exports){
/**
 * @var sampleUrls {array} Store urls of audio samples.
 */
var sampleUrls = [
  //1 - 8
  'audio/808/808_Clap.wav',
  'audio/808/808_Cymbal_low.wav',
  'audio/808/808_Hat_closed.wav',
  'audio/808/808_Snare_hi1.wav',
  'audio/808/808_Kick_short.wav',
  'audio/808/808_Kick_long.wav',
  'audio/808/808_Lo_Tom.wav',
  'audio/808/808_Md_Conga.wav',
  //9 - 16
  'audio/808/808_Hi_Tom.wav',
  'audio/808/808_Maracas.wav',
  'audio/808/808_Rimshot.wav',
  'audio/808/808_Clave.wav',
  'audio/808/808_Hi_Conga.wav',
  'audio/808/808_Cowbell.wav',
  'audio/808/808_Md_Tom.wav',
  'audio/808/808_Snare_lo1.wav'
];

module.exports = sampleUrls;

},{}],23:[function(require,module,exports){
/**
 * Normalize a given value from a larger range of numbers to a smaller
 * range of numbers.
 *
 * @param scaleMax {number} The largest number in the range being scaled to
 * @param rangeMax {number} The largest number in the range the value appeared in
 * @param value {number} The number to be scaled
 * @return {number}
 */
exports.normalize = function(scaleMax, rangeMax, value) {
  return scaleMax * (value / rangeMax);
}

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
exports.uuid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
}

},{}]},{},[21])
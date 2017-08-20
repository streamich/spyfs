'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Spy = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.spy = spy;

var _lists = require('fs-monkey/lib/util/lists');

var _events = require('events');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var noop = function noop() {};

function createAction(method, isAsync, args, callback) {
    var promise = new Promise(callback);
    promise.method = method;
    promise.isAsync = isAsync;
    promise.args = args;
    return promise;
}

var Spy = exports.Spy = function (_EventEmitter) {
    _inherits(Spy, _EventEmitter);

    function Spy(fs, listener) {
        _classCallCheck(this, Spy);

        var _this = _possibleConstructorReturn(this, (Spy.__proto__ || Object.getPrototypeOf(Spy)).call(this));

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {

            for (var _iterator = _lists.fsSyncMethods[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _method = _step.value;

                var func = fs[_method];
                if (typeof func !== 'function') continue;
                _this[_method] = _this._createSyncMethod(fs, _method, func);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _lists.fsAsyncMethods[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _method2 = _step2.value;

                var _func = fs[_method2];
                if (typeof _func !== 'function') continue;

                if (_method2 === 'exists') {
                    _this[_method2] = fs[_method2].bind(fs);
                    continue;
                }

                _this[_method2] = _this._createAsyncMethod(fs, _method2, _func);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        if (listener) _this.subscribe(listener);
        return _this;
    }

    _createClass(Spy, [{
        key: '_createSyncMethod',
        value: function _createSyncMethod(fs, method, func) {
            var _this2 = this;

            return function () {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var result = void 0,
                    error = void 0;

                function exec() {
                    try {
                        result = func.apply(fs, args);
                        error = undefined;
                    } catch (reason) {
                        result = undefined;
                        error = reason;
                    }
                }

                function returnOrThrow() {
                    if (typeof result !== 'undefined') {
                        return result;
                    } else {
                        throw error;
                    }
                }

                var action = createAction(method, false, args, function (resolve, reject) {
                    process.nextTick(function () {
                        if (typeof result !== 'undefined') resolve(result);else reject(error);
                    });
                });

                action.result = action;

                action.resolve = function (value) {
                    result = value;
                    error = undefined;
                };

                action.reject = function (reason) {
                    result = undefined;
                    error = reason;
                };

                action.exec = function () {
                    exec();
                    return returnOrThrow();
                };

                action.catch(noop);

                _this2.emit(action);

                if (typeof result !== 'undefined') {
                    return result;
                } else if (typeof error !== 'undefined') {
                    throw error;
                } else {
                    exec();
                    return returnOrThrow();
                }
            };
        }
    }, {
        key: '_createAsyncMethod',
        value: function _createAsyncMethod(fs, method, func) {
            var _this3 = this;

            return function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                var callback = args[args.length - 1];
                if (typeof callback !== 'function') return func.apply(fs, args);

                var paused = false,
                    proceeding = false,
                    finished = false;

                var _resolve = void 0,
                    _reject = void 0;

                function resolve(value) {
                    if (!finished) {
                        finished = true;
                        value = value instanceof Array ? value : [value];
                        _resolve(value);
                        if (value instanceof Array) callback.apply(undefined, [null].concat(_toConsumableArray(value)));else callback(null, value);
                    }
                }

                function reject(reason) {
                    if (!finished) {
                        finished = true;
                        _reject(reason);
                        callback(reason);
                    }
                }

                var _exec = void 0;

                function exec() {
                    if (_exec) return _exec;

                    _exec = new Promise(function (resolve, reject) {
                        args[args.length - 1] = function (reason) {
                            for (var _len3 = arguments.length, results = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                                results[_key3 - 1] = arguments[_key3];
                            }

                            if (reason) reject(reason);else resolve(results);
                        };
                        func.apply(fs, args);
                    });

                    _exec.catch(noop);

                    return _exec;
                }

                function proceed() {
                    proceeding = true;
                    exec().then(function (result) {
                        return resolve(result);
                    }, function (err) {
                        return reject(err);
                    });
                }

                var action = createAction(method, true, args.slice(0, args.length - 1), function (resolve, reject) {
                    _resolve = resolve;
                    _reject = reject;

                    process.nextTick(function () {
                        _this3.emit(action);
                        setImmediate(function () {
                            if (!paused && !proceeding) proceed();
                        });
                    });
                });

                action.result = action;
                action.exec = exec;
                action.resolve = resolve;
                action.reject = reject;

                action.pause = function (cb) {
                    if (proceeding) throw Error('Cannot pause anymore, already executing the real filesystem call.');
                    if (paused) throw Error('Already paused once.');
                    paused = true;
                    if (cb) cb(proceed);
                };
                action.unpause = proceed;
                action.proceed = proceed;

                action.catch(noop);
            };
        }
    }, {
        key: 'emit',
        value: function emit(action) {
            _get(Spy.prototype.__proto__ || Object.getPrototypeOf(Spy.prototype), 'emit', this).call(this, 'action', action);
            _get(Spy.prototype.__proto__ || Object.getPrototypeOf(Spy.prototype), 'emit', this).call(this, action.method, action);
        }
    }, {
        key: 'subscribe',
        value: function subscribe(listener) {
            this.addListener('action', listener);
        }
    }, {
        key: 'unsubscribe',
        value: function unsubscribe(listener) {
            this.removeListener('action', listener);
        }
    }, {
        key: 'on',
        value: function on(event, listener) {
            this.addListener(event, listener);
        }
    }, {
        key: 'off',
        value: function off(event, listener) {
            this.removeListener(event, listener);
        }
    }]);

    return Spy;
}(_events.EventEmitter);

function spy(fs, listener) {
    var sfs = new Spy(fs);
    if (typeof listener === 'function') sfs.subscribe(listener);
    return sfs;
}
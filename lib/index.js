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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function createAction(method, isAsync, args, callback) {
    var promise = new Promise(callback);
    promise.method = method;
    promise.isAsync = isAsync;
    promise.args = args;
    return promise;
}

var Spy = exports.Spy = function (_EventEmitter) {
    _inherits(Spy, _EventEmitter);

    function Spy(fs) {
        _classCallCheck(this, Spy);

        var _this = _possibleConstructorReturn(this, (Spy.__proto__ || Object.getPrototypeOf(Spy)).call(this));

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            var _loop = function _loop() {
                var method = _step.value;

                var func = fs[method];
                if (typeof func !== 'function') return 'continue';

                _this[method] = function () {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    try {
                        var result = func.apply(fs, args);
                        var action = createAction(method, false, args, function (resolve) {
                            return resolve(result);
                        });
                        _this.emit(action);
                        return result;
                    } catch (err) {
                        var _action = createAction(method, false, args, function (resolve, reject) {
                            return reject(err);
                        });
                        _this.emit(_action);
                        throw err;
                    }
                };
            };

            for (var _iterator = _lists.fsSyncMethods[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ret = _loop();

                if (_ret === 'continue') continue;
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
            var _loop2 = function _loop2() {
                var method = _step2.value;

                var func = fs[method];
                if (typeof func !== 'function') return 'continue';

                if (method === 'exists') {
                    _this[method] = function (filename, callback) {
                        if (typeof callback !== 'function') return func.call(fs, filename, callback);
                        var action = createAction(method, true, [filename, callback], function (resolve) {
                            try {
                                func.call(fs, filename, function (exists) {
                                    resolve(exists);
                                    callback(exists);
                                });
                            } catch (err) {
                                reject(err);
                                throw err;
                            }
                        });
                        _this.emit(action);
                    };
                    return 'continue';
                }

                _this[method] = function () {
                    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        args[_key2] = arguments[_key2];
                    }

                    var callback = args[args.length - 1];
                    if (typeof callback !== 'function') return func.apply(fs, args);

                    var action = createAction(method, true, args.slice(0, args.length - 1), function (resolve, reject) {
                        args[args.length - 1] = function (err) {
                            for (var _len3 = arguments.length, results = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                                results[_key3 - 1] = arguments[_key3];
                            }

                            if (err) reject(err);else resolve(results.length > 1 ? results : results[0]);
                            callback.apply(null, [err].concat(results));
                        };

                        try {
                            func.apply(fs, args);
                        } catch (err) {
                            reject(err);
                            throw err;
                        }
                    });
                    _this.emit(action);
                };
            };

            for (var _iterator2 = _lists.fsAsyncMethods[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _ret2 = _loop2();

                if (_ret2 === 'continue') continue;
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

        return _this;
    }

    _createClass(Spy, [{
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
    }]);

    return Spy;
}(_events.EventEmitter);

function spy(fs, listener) {
    var sfs = new Spy(fs);
    if (typeof listener === 'function') sfs.subscribe(listener);
    return sfs;
}
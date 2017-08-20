'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _chai = require('chai');

var _memfs = require('memfs');

var _index = require('./index');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function create(listener) {
    var vol = _memfs.Volume.fromJSON({
        '/foo': 'bar'
    });
    var sfs = new _index.Spy(vol, listener);
    return [sfs, vol];
}

describe('SpyFS', function () {
    it('Loads without crashing', function () {
        create();
    });
    it('Creates new fs with, does not overwrite the old one', function () {
        var vol = new _memfs.Volume();
        var readFile = vol.readFile;
        var sfs = new _index.Spy(vol);
        (0, _chai.expect)(_typeof(sfs.readFile)).to.equal('function');
        (0, _chai.expect)(readFile === vol.readFile).to.equal(true);
    });
    describe('Sync methods', function () {
        it('Returns action promises', function () {
            var _create = create(function (action) {
                (0, _chai.expect)(action).to.be.an.instanceof(Promise);
            }),
                _create2 = _slicedToArray(_create, 2),
                sfs = _create2[0],
                vol = _create2[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('`result` is just a circular reference to `action`', function () {
            var _create3 = create(function (action) {
                var result = action.result;

                (0, _chai.expect)(result).to.equal(action);
            }),
                _create4 = _slicedToArray(_create3, 2),
                sfs = _create4[0],
                vol = _create4[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('Action promise has expected API', function () {
            var _create5 = create(function (action) {
                var method = action.method,
                    isAsync = action.isAsync,
                    args = action.args,
                    result = action.result,
                    resolve = action.resolve,
                    reject = action.reject,
                    exec = action.exec;


                (0, _chai.expect)(typeof method === 'undefined' ? 'undefined' : _typeof(method)).to.equal('string');
                (0, _chai.expect)(typeof isAsync === 'undefined' ? 'undefined' : _typeof(isAsync)).to.equal('boolean');
                (0, _chai.expect)(args instanceof Array).to.equal(true);
                (0, _chai.expect)(result instanceof Promise).to.equal(true);
                (0, _chai.expect)(result).to.equal(action);
                (0, _chai.expect)(typeof resolve === 'undefined' ? 'undefined' : _typeof(resolve)).to.equal('function');
                (0, _chai.expect)(typeof reject === 'undefined' ? 'undefined' : _typeof(reject)).to.equal('function');
                (0, _chai.expect)(typeof exec === 'undefined' ? 'undefined' : _typeof(exec)).to.equal('function');
            }),
                _create6 = _slicedToArray(_create5, 2),
                sfs = _create6[0],
                vol = _create6[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct method name', function () {
            var _create7 = create(function (_ref) {
                var method = _ref.method;

                (0, _chai.expect)(method).to.equal('readFileSync');
            }),
                _create8 = _slicedToArray(_create7, 2),
                sfs = _create8[0],
                vol = _create8[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct synchronicity type', function () {
            var _create9 = create(function (_ref2) {
                var isAsync = _ref2.isAsync;

                (0, _chai.expect)(isAsync).to.equal(false);
            }),
                _create10 = _slicedToArray(_create9, 2),
                sfs = _create10[0],
                vol = _create10[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct arguments', function () {
            var _create11 = create(function (_ref3) {
                var args = _ref3.args;

                (0, _chai.expect)(args instanceof Array).to.equal(true);
                (0, _chai.expect)(args.length).to.equal(2);
                (0, _chai.expect)(args).to.eql(['/foo', 'utf8']);
            }),
                _create12 = _slicedToArray(_create11, 2),
                sfs = _create12[0],
                vol = _create12[1];

            sfs.readFileSync('/foo', 'utf8');
        });
        it('Without mocking, returns the original fs result', function () {
            var _create13 = create(),
                _create14 = _slicedToArray(_create13, 2),
                sfs = _create14[0],
                vol = _create14[1];

            var res = sfs.readFileSync('/foo', 'utf8');
            (0, _chai.expect)(res).to.equal('bar');
        });
        it('Mocking result works', function () {
            var _create15 = create(function (_ref4) {
                var resolve = _ref4.resolve;

                resolve('lol');
            }),
                _create16 = _slicedToArray(_create15, 2),
                sfs = _create16[0],
                vol = _create16[1];

            var res = sfs.readFileSync('/foo', 'utf8');
            (0, _chai.expect)(res).to.equal('lol');
        });
        it('Mocking error works', function () {
            var _create17 = create(function (action) {
                var reject = action.reject;

                reject(Error('1234'));
            }),
                _create18 = _slicedToArray(_create17, 2),
                sfs = _create18[0],
                vol = _create18[1];

            try {
                sfs.readFileSync('/foo', 'utf8');
                throw Error('This should not throw');
            } catch (err) {
                (0, _chai.expect)(err.message).to.equal('1234');
            }
        });
        it('`exec` executes the real filesystem call', function () {
            var _create19 = create(function (_ref5) {
                var exec = _ref5.exec;

                (0, _chai.expect)(exec()).to.equal('bar');
            }),
                _create20 = _slicedToArray(_create19, 2),
                sfs = _create20[0],
                vol = _create20[1];

            sfs.readFileSync('/foo', 'utf8');
        });
    });
    describe('Async methods', function () {
        it('Returns action promises', function (done) {
            var _create21 = create(function (action) {
                (0, _chai.expect)(action).to.be.an.instanceof(Promise);
                done();
            }),
                _create22 = _slicedToArray(_create21, 2),
                sfs = _create22[0],
                vol = _create22[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('`result` is just a circular reference to `action`', function (done) {
            var _create23 = create(function (action) {
                var result = action.result;

                (0, _chai.expect)(result).to.equal(action);
                done();
            }),
                _create24 = _slicedToArray(_create23, 2),
                sfs = _create24[0],
                vol = _create24[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('Action promise has expected API', function (done) {
            var _create25 = create(function (action) {
                var method = action.method,
                    isAsync = action.isAsync,
                    args = action.args,
                    result = action.result,
                    resolve = action.resolve,
                    reject = action.reject,
                    exec = action.exec,
                    pause = action.pause,
                    unpause = action.unpause,
                    proceed = action.proceed;


                (0, _chai.expect)(typeof method === 'undefined' ? 'undefined' : _typeof(method)).to.equal('string');
                (0, _chai.expect)(typeof isAsync === 'undefined' ? 'undefined' : _typeof(isAsync)).to.equal('boolean');
                (0, _chai.expect)(args instanceof Array).to.equal(true);
                (0, _chai.expect)(result instanceof Promise).to.equal(true);
                (0, _chai.expect)(result).to.equal(action);
                (0, _chai.expect)(typeof resolve === 'undefined' ? 'undefined' : _typeof(resolve)).to.equal('function');
                (0, _chai.expect)(typeof reject === 'undefined' ? 'undefined' : _typeof(reject)).to.equal('function');
                (0, _chai.expect)(typeof exec === 'undefined' ? 'undefined' : _typeof(exec)).to.equal('function');
                (0, _chai.expect)(exec()).to.be.an.instanceof(Promise);
                (0, _chai.expect)(typeof pause === 'undefined' ? 'undefined' : _typeof(pause)).to.equal('function');
                (0, _chai.expect)(typeof unpause === 'undefined' ? 'undefined' : _typeof(unpause)).to.equal('function');
                (0, _chai.expect)(typeof proceed === 'undefined' ? 'undefined' : _typeof(proceed)).to.equal('function');

                done();
            }),
                _create26 = _slicedToArray(_create25, 2),
                sfs = _create26[0],
                vol = _create26[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('Returns the correct method name', function (done) {
            var _create27 = create(function (_ref6) {
                var method = _ref6.method;

                (0, _chai.expect)(method).to.equal('readFile');
                done();
            }),
                _create28 = _slicedToArray(_create27, 2),
                sfs = _create28[0],
                vol = _create28[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('Returns the correct synchronicity type', function (done) {
            var _create29 = create(function (_ref7) {
                var isAsync = _ref7.isAsync;

                (0, _chai.expect)(isAsync).to.equal(true);
                done();
            }),
                _create30 = _slicedToArray(_create29, 2),
                sfs = _create30[0],
                vol = _create30[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('Returns the correct arguments', function (done) {
            var _create31 = create(function (_ref8) {
                var args = _ref8.args;

                (0, _chai.expect)(args instanceof Array).to.equal(true);
                (0, _chai.expect)(args.length).to.equal(2);
                (0, _chai.expect)(args).to.eql(['/foo', 'utf8']);
                done();
            }),
                _create32 = _slicedToArray(_create31, 2),
                sfs = _create32[0],
                vol = _create32[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('Without mocking, returns the original fs result', function (done) {
            var _create33 = create(),
                _create34 = _slicedToArray(_create33, 2),
                sfs = _create34[0],
                vol = _create34[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(res).to.equal('bar');
                done();
            });
        });
        it('Mocking result works', function (done) {
            var _create35 = create(function (_ref9) {
                var resolve = _ref9.resolve;

                resolve('lala');
            }),
                _create36 = _slicedToArray(_create35, 2),
                sfs = _create36[0],
                vol = _create36[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(res).to.equal('lala');
                done();
            });
        });
        it('Mocking error works', function (done) {
            var _create37 = create(function (_ref10) {
                var reject = _ref10.reject;

                reject(Error('1234'));
            }),
                _create38 = _slicedToArray(_create37, 2),
                sfs = _create38[0],
                vol = _create38[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(err).to.be.an.instanceof(Error);
                (0, _chai.expect)(err.message).to.equal('1234');
                done();
            });
        });
        it('`exec` executes the real filesystem call', function (done) {
            var _create39 = create(function (_ref11) {
                var exec = _ref11.exec;

                exec().then(function (res) {
                    (0, _chai.expect)(res[0]).to.equal('bar');
                    done();
                });
            }),
                _create40 = _slicedToArray(_create39, 2),
                sfs = _create40[0],
                vol = _create40[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('await `exec` executes the real filesystem call', function (done) {
            var _create41 = create(function () {
                var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(_ref13) {
                    var exec = _ref13.exec;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    _context.t0 = _chai.expect;
                                    _context.next = 3;
                                    return exec();

                                case 3:
                                    _context.t1 = _context.sent;
                                    _context.t2 = ['bar'];
                                    (0, _context.t0)(_context.t1).to.eql(_context.t2);

                                    done();

                                case 7:
                                case 'end':
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));

                return function (_x) {
                    return _ref12.apply(this, arguments);
                };
            }()),
                _create42 = _slicedToArray(_create41, 2),
                sfs = _create42[0],
                vol = _create42[1];

            sfs.readFile('/foo', 'utf8', function () {});
        });
        it('`pause` pauses the execution of the async action', function (done) {
            var executed = false;

            var _create43 = create(function () {
                var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref15) {
                    var pause = _ref15.pause;
                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                        while (1) {
                            switch (_context2.prev = _context2.next) {
                                case 0:
                                    pause();
                                    setTimeout(function () {
                                        (0, _chai.expect)(executed).to.equal(false);
                                        done();
                                    }, 1);

                                case 2:
                                case 'end':
                                    return _context2.stop();
                            }
                        }
                    }, _callee2, this);
                }));

                return function (_x2) {
                    return _ref14.apply(this, arguments);
                };
            }()),
                _create44 = _slicedToArray(_create43, 2),
                sfs = _create44[0],
                vol = _create44[1];

            sfs.readFile('/foo', 'utf8', function () {
                executed = true;
            });
        });
        it('`unpause` un-pauses the execution of the async action', function (done) {
            var executed = false;

            var _create45 = create(function () {
                var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref17) {
                    var pause = _ref17.pause,
                        unpause = _ref17.unpause;
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                            switch (_context3.prev = _context3.next) {
                                case 0:
                                    pause();
                                    unpause();
                                    setTimeout(function () {
                                        (0, _chai.expect)(executed).to.equal(true);
                                        done();
                                    }, 1);

                                case 3:
                                case 'end':
                                    return _context3.stop();
                            }
                        }
                    }, _callee3, this);
                }));

                return function (_x3) {
                    return _ref16.apply(this, arguments);
                };
            }()),
                _create46 = _slicedToArray(_create45, 2),
                sfs = _create46[0],
                vol = _create46[1];

            sfs.readFile('/foo', 'utf8', function () {
                executed = true;
            });
        });
        it('`resolve` after `pause` resolves the action', function (done) {
            var _create47 = create(function () {
                var _ref18 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(_ref19) {
                    var pause = _ref19.pause,
                        resolve = _ref19.resolve;
                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                        while (1) {
                            switch (_context4.prev = _context4.next) {
                                case 0:
                                    pause();
                                    resolve(['lol']);

                                case 2:
                                case 'end':
                                    return _context4.stop();
                            }
                        }
                    }, _callee4, this);
                }));

                return function (_x4) {
                    return _ref18.apply(this, arguments);
                };
            }()),
                _create48 = _slicedToArray(_create47, 2),
                sfs = _create48[0],
                vol = _create48[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(res).to.equal('lol');
                done();
            });
        });
        it('`reject` after `pause` rejects the action', function (done) {
            var _create49 = create(function () {
                var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(_ref21) {
                    var pause = _ref21.pause,
                        reject = _ref21.reject;
                    return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                            switch (_context5.prev = _context5.next) {
                                case 0:
                                    pause();
                                    reject(Error('1234'));

                                case 2:
                                case 'end':
                                    return _context5.stop();
                            }
                        }
                    }, _callee5, this);
                }));

                return function (_x5) {
                    return _ref20.apply(this, arguments);
                };
            }()),
                _create50 = _slicedToArray(_create49, 2),
                sfs = _create50[0],
                vol = _create50[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(err.message).to.equal('1234');
                done();
            });
        });
        it('Action resolves with the first provided `resolve` value', function (done) {
            var _create51 = create(function () {
                var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(_ref23) {
                    var resolve = _ref23.resolve;
                    return regeneratorRuntime.wrap(function _callee6$(_context6) {
                        while (1) {
                            switch (_context6.prev = _context6.next) {
                                case 0:
                                    resolve(['1']);
                                    resolve(['2']);
                                    resolve(['3']);

                                case 3:
                                case 'end':
                                    return _context6.stop();
                            }
                        }
                    }, _callee6, this);
                }));

                return function (_x6) {
                    return _ref22.apply(this, arguments);
                };
            }()),
                _create52 = _slicedToArray(_create51, 2),
                sfs = _create52[0],
                vol = _create52[1];

            sfs.readFile('/foo', 'utf8', function (err, res) {
                (0, _chai.expect)(res).to.equal('1');
                done();
            });
        });
    });
});
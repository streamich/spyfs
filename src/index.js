import {fsSyncMethods, fsAsyncMethods} from 'fs-monkey/lib/util/lists';
import {EventEmitter} from 'events';


function createAction(method, isAsync, args, callback) {
    const promise = new Promise(callback);
    promise.method = method;
    promise.isAsync = isAsync;
    promise.args = args;
    return promise;
}


export class Spy extends EventEmitter {

    constructor(fs) {
        super();

        for(let method of fsSyncMethods) {
            const func = fs[method];
            if(typeof func !== 'function') continue;
            this[method] = this._createSyncMethod(fs, method, func);
        }

        for(let method of fsAsyncMethods) {
            const func = fs[method];
            if(typeof func !== 'function') continue;

            // Special case.
            if(method === 'exists') {
                this[method]= (filename, callback) => {
                    if(typeof callback !== 'function')
                        return func.call(fs, filename, callback);
                    const action = createAction(method, true, [filename, callback], resolve => {
                        try {
                            func.call(fs, filename, exists => {
                                resolve(exists);
                                callback(exists);
                            });
                        } catch (err) {
                            reject(err);
                            throw err;
                        }
                    });
                    this.emit(action);
                };
                continue;
            }

            this[method] = this._createAsyncMethod(fs, method, func);
        }
    }

    _createSyncMethod(fs, method, func) {
        return (...args) => {
            let result, error;

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
                if(typeof result !== 'undefined') {
                    return result;
                } else {
                    throw error;
                }
            }

            const action = createAction(method, false, args, (resolve, reject) => {
                process.nextTick(() => {
                    if(typeof result !== 'undefined') resolve(result);
                    else reject(error);
                });
            });

            action.resolve = value => {
                result = value;
                error = undefined;
            };

            action.reject = reason => {
                result = undefined;
                error = reason;
            };

            action.exec = () => {
                exec();
                return returnOrThrow();
            };

            this.emit(action);

            if(typeof result !== 'undefined') {
                return result;
            } else if(typeof error !== 'undefined') {
                throw error;
            } else {
                exec();
                return returnOrThrow();
            }
        };
    }

    _createAsyncMethod(fs, method, func) {
        return (...args) => {
            const callback = args[args.length - 1];
            if(typeof callback !== 'function') return func.apply(fs, args);

            let result, error, isPaused = false;

            function exec(done) {
                args[args.length - 1] = (reason, ...results) => {
                    if(reason) {
                        result = undefined;
                        error = reason;
                    } else {
                        result = results.length > 1 ? results : results[0];
                        error = undefined;
                    }
                    done(reason, ...results);
                };

                try {
                    func.apply(fs, args);
                } catch (reason) {
                    result = undefined;
                    error = reason;
                    done(err);
                }
            }

            function proceed() {
                isPaused = false;
            }

            const action = createAction(method, false, args.slice(0, args.length - 1), (resolve, reject) => {

                function finish() {
                    if(typeof result !== 'undefined') {
                        resolve(result);
                    } else {
                        callback(error);
                    }
                }

                process.nextTick(() => {
                    if(isPaused) {

                    } else {
                        exec(finish);
                    }
                });
            });

            action.resolve = value => {
                result = value;
                error = undefined;
                proceed();
            };

            action.reject = reason => {
                result = undefined;
                error = reason;
                proceed();
            };

            action.pause = (callback) => {
                isPaused = true;
                callback(proceed);
            };

            action.exec = (done) => {
                exec(done);
            };

            this.emit(action);
        };
    }

    emit(action) {
        super.emit('action', action);
        super.emit(action.method, action);
    }

    subscribe(listener) {
        this.addListener('action', listener);
    }
}


export function spy(fs, listener) {
    const sfs = new Spy(fs);
    if(typeof listener === 'function') sfs.subscribe(listener);
    return sfs;
}

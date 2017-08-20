import {fsSyncMethods, fsAsyncMethods} from 'fs-monkey/lib/util/lists';
import {EventEmitter} from 'events';


interface ActionBase extends Promise {
    method: string,
    isAsync: boolean,
    args: any[],
}

interface ActionSync extends ActionBase {
    result: ActionSync;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    exec: (...args) => any;
}

interface ActionAsync extends ActionBase {
    result: ActionAsync;
    resolve: (results: any[]) => void;
    reject: (error: Error) => void;
    exec: () => Promise<any>;
    pause: () => void;
    unpause: () => void;
    proceed: () => void;
}

type TListener = (action: ActionAsync | ActionAsync) => void;


const noop = () => {};


function createAction(method, isAsync, args, callback): ActionBase {
    const promise = new Promise(callback);
    promise.method = method;
    promise.isAsync = isAsync;
    promise.args = args;
    return promise;
}


export class Spy extends EventEmitter {

    constructor(fs, listener: ?TListener) {
        super();

        for(let method of fsSyncMethods) {
            const func = fs[method];
            if(typeof func !== 'function') continue;
            this[method] = this._createSyncMethod(fs, method, func);
        }

        for(let method of fsAsyncMethods) {
            const func = fs[method];
            if(typeof func !== 'function') continue;

            // Special case, `exists` is not supported.
            if(method === 'exists') {
                this[method] = fs[method].bind(fs);
                continue;
            }

            this[method] = this._createAsyncMethod(fs, method, func);
        }

        if(listener) this.subscribe(listener);
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

            action.result = action;

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

            // To disable Node's:
            // DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
            // that are not handled will terminate the Node.js process with a non-zero exit code.
            action.catch(noop);

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

    /**
     * Ways async methods can be executed:
     *
     *     1. User does not intervene, call is simply executed
     *     2. User immediately (same event loop cycle) `.reject`s or `.resolve`s the action.
     *     3. Use rpauses the action and then:
     *         3.1 Unpauses, or
     *         3.2 Rejects or resolves
     *
     * User should be able to pause, reject, and resolve only once.
     *
     * @param fs
     * @param method
     * @param func
     * @returns {function(...[*]=)}
     * @private
     */
    _createAsyncMethod(fs, method, func) {
        return (...args) => {
            const callback = args[args.length - 1];
            if(typeof callback !== 'function') return func.apply(fs, args);

            let paused = false, proceeding = false, finished = false;


            // The actual resolve and reject methods from the action Promise.
            let _resolve, _reject;

            function resolve(value) {
                if(!finished) {
                    finished = true;
                    value = value instanceof Array ? value : [value];
                    _resolve(value);
                    if(value instanceof Array) callback(null, ...value);
                    else callback(null, value);
                }
            }

            function reject(reason) {
                if(!finished) {
                    finished = true;
                    _reject(reason);
                    callback(reason);
                }
            }


            // Cache for `exec`
            let _exec;

            // Executes the real filesystem call.
            function exec() {
                if(_exec) return _exec;

                _exec = new Promise((resolve, reject) => {
                    args[args.length - 1] = (reason, ...results) => {
                        if(reason) reject(reason);
                        else resolve(results);
                    };
                    func.apply(fs, args);
                });

                // To disable Node's:
                // DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
                // that are not handled will terminate the Node.js process with a non-zero exit code.
                _exec.catch(noop);

                return _exec;
            }


            // Proceed with executing the real fs call.
            function proceed() {
                proceeding = true;
                exec().then(result => resolve(result), err => reject(err));
            }


            const action = createAction(method, true, args.slice(0, args.length - 1), (resolve, reject) => {
                _resolve = resolve;
                _reject = reject;

                process.nextTick(() => {
                    this.emit(action);
                    setImmediate(() => {
                        if(!paused && !proceeding) proceed();
                    });
                });
            });

            action.result = action;
            action.exec = exec;
            action.resolve = resolve;
            action.reject = reject;

            action.pause = (cb) => {
                if(proceeding)
                    throw Error('Cannot pause anymore, already executing the real filesystem call.');
                if(paused)
                    throw Error('Already paused once.');
                paused = true;
                if(cb) cb(proceed);
            };
            action.unpause = proceed;
            action.proceed = proceed;

            // To disable Node's:
            // DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
            // that are not handled will terminate the Node.js process with a non-zero exit code.
            action.catch(noop);
        };
    }

    emit(action) {
        super.emit('action', action);
        super.emit(action.method, action);
    }

    subscribe(listener: (action: ActionSync | ActionAsync) => void) {
        this.addListener('action', listener);
    }

    unsubscribe(listener: ?(action: ActionSync | ActionAsync) => void) {
        this.removeListener('action', listener);
    }

    on(event, listener) {
        this.addListener(event, listener);
    }

    off(event, listener) {
        this.removeListener(event, listener);
    }
}


export function spy(fs, listener) {
    const sfs = new Spy(fs);
    if(typeof listener === 'function') sfs.subscribe(listener);
    return sfs;
}

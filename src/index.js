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

            this[method] = (...args) => {
                try {
                    const result = func.apply(fs, args);
                    const action = createAction(method, false, args, resolve => resolve(result));
                    this.emit(action);
                    return result;
                } catch (err) {
                    const action = createAction(method, false, args, (resolve, reject) => reject(err));
                    this.emit(action);
                    throw err;
                }
            };
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

            this[method] = (...args) => {
                const callback = args[args.length - 1];
                if(typeof callback !== 'function')
                    return func.apply(fs, args);

                const action = createAction(method, true, args.slice(0, args.length - 1), (resolve, reject) => {
                    // Rewrite callback.
                    args[args.length - 1] = (err, ...results) => {
                        if(err) reject(err);
                        else resolve(results.length > 1 ? results : results[0]);
                        callback.apply(null, [err, ...results]);
                    };

                    try {
                        func.apply(fs, args);
                    } catch (err) {
                        reject(err);
                        throw err;
                    }
                });
                this.emit(action);
            };
        }
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

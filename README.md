# spyfs [![npm-img]][npm-url]

Spy on filesystem calls. Create file system mocks. Use for testing.

Install:

    npm install --save spyfs

Create a new file system that spies:

```js
import * as fs from 'fs';
import {spy} from 'spyfs';

const sfs = spy(fs);
```

Now you can use `sfs` for all your filesystem operations. Subscribe to
all actions happening on that filesystem:

```js
sfs.subscribe(action => {
    // ...
});
```

Every time somebody uses `sfs`, the subscription callback will be called.
You will receive a single argument: an `action` which is a `Promise` object
containing all the information about the performed filesystem operation and its result.

You can also subscribe by providing a listener at creation:

```js
const sfs = spy(fs, action => {
    // ...
});
```


### Want to spy on real filesystem?

Overwrite the real `fs` module using [`fs-monkey`]([fs-monkey]) to spy on all filesystem
calls:

```js
import {patchFs} from 'fs-monkey';

patchFs(sfs);
```


### Use `async/await`

`spyfs` returns *actions* which are instances of the `Promise` constructor,
so you can use *asynchronous* functions for convenience:

```js
const sfs = spy(fs, async function(action) {
    console.log(await action); // prints directory files...
});

sfs.readdir('/', () => {});
```


### Use with [`memfs`][memfs]

You can use `spyfs` with any *fs-like* object, including [`memfs`][memfs]:

```js
import {fs} from 'memfs';
import {spy} from 'spyfs';

const sfs = spy(fs, async function(action) {
    console.log(await action); // bar
});

sfs.writeFile('/foo', 'bar', () => {});
sfs.readFile('/foo', 'utf8', () => {});
```


### Action properties

`spyfs` actions have extra properties that tell you more about the action
being executed:

  - `action.method` *(string)* - name of filesystem method called.
  - `action.isAsync` *(boolean)* - whether the filesystem method called was asynchronous.
  - `action.args` *(Array)* - list of arguments with which the method was called (sans callback).

```js
const sfs = spy(fs, action => {
    console.log(action.method); // readdir, readdirSync
    console.log(action.isAsync); // true, false
    console.log(action.args); // [ '/' ], [ '/' ]
});

sfs.readdir('/', () => {});
sfs.readdirSync('/');
```


### Subscribe to events

The returned filesystem object is also an event emitter, you can subscribe
to specific filesystem actions using the `.on()` method, in that case you
will receive only actions for that method:

```js
sfs.on('readdirSync', async function(action) {
    console.log(action.args, await action);
});

sfs.readdirSync('/');
```

Listening for `action` event is equivalent to subscribing using `.subscribe()`.

```js
sfs.on('action', listener);
sfs.subscribe(listener);
```


## Mock responses

You can overwrite what is returned by the filesystem call at runtime or even
throw your custom errors, this way you can mock any filesystem call:

For example, prohibit `readFileSync` for `/usr/foo/.bashrc` file:

```js
sfs.on('readFileSync', ({args, reject}) => {
    if(args[0] === '/usr/foo/.bashrc')
        reject(new Error("Cant't touch this!"));
});
```


### Sync mocking

#### `action.resolve(result)`

Returns to the user `result` as successfully executed action, below
all operations `readFileSync` will return `'123'`:

```js
sfs.on('readFileSync', action => {
    action.resolve('123');
});
```

#### `action.reject(error)`

Throws `error`:

```js
sfs.on('statSync', action => {
    action.reject(new Error('This filesystem does not support stat'));
});
```

#### `action.exec()`

Executes an action user was intended to perform and returns back result
only to you. This method can throw.

```js
sfs.on('readFileSync', action => {
    const result = action.exec();
    if(result.length > 100) action.reject(new Error('File too long'));
});
```

#### `action.result`

`result` is a reference to the `action` for your convenience:

### Async mocking

Just like sync mocking actions support `resolve`, `reject` and `exec` methods,
but, in addition, async mocking also has `pause` and `unpause` methods.

#### `action.resolve(results)`

Successfully executes user's filesystem call. `results` is an array, because
some Node's async filesystem calls return more than one result.

```js
sfs.on('readFile', ({resolve}) => {
    resolve(['123']);
});
```

#### `action.reject(error)`

Fails filesystem call and returns your specified error.

```js
sfs.on('readFile', ({reject}) => {
    reject(new Error('You cannot touch this file!'));
});
```

#### `action.pause()`

Pauses the async filesystem call until you un-pause it.

```js
sfs.on('readFile', ({pause}) => {
    pause();
    // The readFile operation will never end,
    // if you don't unpause it.
});
```

Pausing is useful if you want to perform some other async IO before yielding
back to the original filesystem operation.

#### `action.unpause()`

Un-pauses previously pauses filesystem operation:

```js
sfs.on('readFile', ({pause, unpause}) => {
    // This effectively does nothing:
    pause();
    unpause();
});
```

#### `action.exec()`

Executes user's intended filesystem call and returns the result only to you.
Unlike the sync version `exec`, async `exec` returns a promise.

You should use it together with `pause()` and `unpause()`.

```js
sfs.on('readFile', ({exec, pause, unpause, reject}) => {
    pause();
    exec().then(result => {
        if(result.length < 100) {
            reject(new Error('File too small'));
        } else {
            unpause();
        }
    });
});
```

Use `async/await` with `exec()`:

```js
sfs.on('readFile', async function({exec, pause, unpause, reject}) {
    pause();
    let result = await exec();
    if(result.length < 100) {
        reject(new Error('File too small'));
    } else {
        unpause();
    }
});
```

#### `action.result`

`result` is a reference to the `action` for your convenience:


## `Spy` constructor

Create spying filesystems manually:

```js
import {Spy} from 'spyfs';
```

#### `new Spy(fs[, listener])`

`fs` is the file system to spy on. Note that `Spy` will not overwrite or
in any way modify your original filesystem, but rather it will create a
new object for you.

`listener` is an optional callback that will be set using the `.subscribe()`
method, see below.

#### `sfs.subscribe(listener)`

Subscribe to all filesystem actions:

```js
const sfs = new Spy(fs);
sfs.subscribe(action => {

});
```

It is equivalent to calling `sfs.on('action', listener)`.

#### `sfs.unsubscribe(listener)`

Unsubscribes your listener. It is equivalent to calling `sfs.off('action', listener)`.

#### `sfs.on(method, listener)`

Subscribes to a specific filesystem call.

```js
sfs.on('readFile', listener);
```

#### `sfs.off(method, listener)`

Unsubscribes from a specific filesystem call.



[npm-url]: https://www.npmjs.com/package/spyfs
[npm-img]: https://img.shields.io/npm/v/spyfs.svg
[memfs]: https://github.com/streamich/memfs
[unionfs]: https://github.com/streamich/unionfs
[linkfs]: https://github.com/streamich/linkfs
[spyfs]: https://github.com/streamich/spyfs
[fs-monkey]: https://github.com/streamich/fs-monkey





# License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>

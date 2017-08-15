# spyfs [![][npm-img]][npm-url]

Spies on filesystem calls.

Install:

    npm install --save spyfs

    or

    yarn add spyfs

Create a new file system that spies:

```js
import * as fs from 'fs';
import {spy} from 'spyfs';

const sfs = spy(fs);
```

Subscribe to all actions happening on that filesystem:

```js
sfs.subscribe(action => {
    // ...
});
```

Now, every time somebody uses `sfs`, the subscription callback will be called.
You will receive a single argument: an `action` which is a `Promise` object
containing all the information about the performed filesystem action and its result.

You can also subscribe by providing a listener at creation:

```js
const sfs = spy(fs, action => {
    // ...
});
```

### Use `async/await`

`spyfs` returns *actions* which are instances of the `Promise` constructor,
so you can use *asynchronous* functions for convenience:

```js
const sfs = spy(fs, async function(action) {
    console.log(await action); // prints directory files...
});

sfs.readdir(__dirname, () => {});
```

### Use with [`memfs`][memfs]

You can use `spyfs` with any *fs-like* object, including [`memfs`][memfs]:

```js
import {fs} from 'memfs';
import {spy} from "../src/index";

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
to specific filesystem actions using the `.on()` method:

```js
sfs.on('readdirSync', async function(action) {
    console.log(action.args, await action);
});

sfs.readdirSync('/');
```


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

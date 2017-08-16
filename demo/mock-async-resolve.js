import * as fs from 'fs';
import {spy} from '../src';


const sfs = spy(fs, function(action) {
    action.resolve(['lol-async']);
});

console.log(sfs.readdir('/', () => {}));

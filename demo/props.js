import * as fs from 'fs';
import {spy} from "../src/index";


const sfs = spy(fs, action => {
    console.log(action.method); // readdir, readdirSync
    console.log(action.isAsync); // true, false
    console.log(action.args); // [ '/' ], [ '/' ]
});

sfs.readdir('/', () => {});
sfs.readdirSync('/');

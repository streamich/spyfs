import * as fs from 'fs';
import {spy} from "../src/index";


const sfs = spy(fs, action => {
    action.catch(err => {
        console.log(err.message); // ENOENT: no such file or directory, access '/foo'
    })
});

try {
    sfs.accessSync('/foo');
} catch (err) {}

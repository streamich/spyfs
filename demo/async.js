import * as fs from 'fs';
import {spy} from "../src/index";


const sfs = spy(fs, async function({pause, unpause, exec, resolve}) {
    pause();
    try {
        await exec();
    } catch(err) {
        resolve([['lol']]);
    }
    unpause();
});

sfs.readdir('/', (err, res) => {
    console.log(err, res);
});

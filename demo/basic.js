import * as fs from 'fs';
import {spy} from '../src';


const sfs = spy(fs);
sfs.subscribe(async function(action) {
    const result = await action;
    console.log(result);
});

sfs.on('readFile', async function(action) {
    const result = await action;
    console.log(result);
});

sfs.readFile('./index.js', 'utf8', () => {});


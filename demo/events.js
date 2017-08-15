import * as fs from 'fs';
import {spy} from "../src/index";


const sfs = spy(fs);

sfs.on('readdirSync', async function(action) {
    console.log(action.args, await action);
});

sfs.readdirSync('/');

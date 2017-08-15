import * as fs from 'fs';
import {spy} from "../src/index";


const sfs = spy(fs, async function(action) {
    console.log(await action); // prints directory files...
});

sfs.readdir(__dirname, () => {});

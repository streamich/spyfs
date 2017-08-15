import {fs} from 'memfs';
import {spy} from "../src/index";


const sfs = spy(fs, async function(action) {
    console.log(await action);
});

sfs.writeFile('/foo', 'bar', () => {});
sfs.readFile('/foo', 'utf8', () => {});

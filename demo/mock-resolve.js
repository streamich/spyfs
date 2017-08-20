import * as fs from 'fs';
import {spy} from '../src';


const sfs = spy(fs, function(action) {
    action.resolve(['lol']);
});

console.log(sfs.readdirSync('/'));

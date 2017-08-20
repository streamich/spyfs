import {expect} from 'chai';
import {Volume} from 'memfs';
import {Spy} from './index';


function create(listener) {
    const vol = Volume.fromJSON({
        '/foo': 'bar',
    });
    const sfs = new Spy(vol, listener);
    return [sfs, vol];
}


describe('SpyFS', () => {
    it('Loads without crashing', () => {
        create();
    });
    it('Creates new fs with, does not overwrite the old one', () => {
        const vol = new Volume;
        const readFile = vol.readFile;
        const sfs = new Spy(vol);
        expect(typeof sfs.readFile).to.equal('function');
        expect(readFile === vol.readFile).to.equal(true);
    });
    describe('Sync methods', () => {
        it('Returns action promises', () => {
            const [sfs, vol] = create(action => {
                expect(action).to.be.an.instanceof(Promise);
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('`result` is just a circular reference to `action`', () => {
            const [sfs, vol] = create(action => {
                const {result} = action;
                expect(result).to.equal(action);
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('Action promise has expected API', () => {
            const [sfs, vol] = create(action => {
                const {method, isAsync, args, result, resolve, reject, exec} = action;

                expect(typeof method).to.equal('string');
                expect(typeof isAsync).to.equal('boolean');
                expect(args instanceof Array).to.equal(true);
                expect(result instanceof Promise).to.equal(true);
                expect(result).to.equal(action);
                expect(typeof resolve).to.equal('function');
                expect(typeof reject).to.equal('function');
                expect(typeof exec).to.equal('function');
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct method name', () => {
            const [sfs, vol] = create(({method}) => {
                expect(method).to.equal('readFileSync');
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct synchronicity type', () => {
            const [sfs, vol] = create(({isAsync}) => {
                expect(isAsync).to.equal(false);
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('Returns the correct arguments', () => {
            const [sfs, vol] = create(({args}) => {
                expect(args instanceof Array).to.equal(true);
                expect(args.length).to.equal(2);
                expect(args).to.eql(['/foo', 'utf8']);
            });
            sfs.readFileSync('/foo', 'utf8');
        });
        it('Without mocking, returns the original fs result', () => {
            const [sfs, vol] = create();
            const res = sfs.readFileSync('/foo', 'utf8');
            expect(res).to.equal('bar');
        });
        it('Mocking result works', () => {
            const [sfs, vol] = create(({resolve}) => {
                resolve('lol');
            });
            const res = sfs.readFileSync('/foo', 'utf8');
            expect(res).to.equal('lol');
        });
        it('Mocking error works', () => {
            const [sfs, vol] = create(action => {
                const {reject} = action;
                reject(Error('1234'));
            });
            try {
                sfs.readFileSync('/foo', 'utf8');
                throw Error('This should not throw');
            } catch (err) {
                expect(err.message).to.equal('1234');
            }
        });
        it('`exec` executes the real filesystem call', () => {
            const [sfs, vol] = create(({exec}) => {
                expect(exec()).to.equal('bar');
            });
            sfs.readFileSync('/foo', 'utf8');
        });
    });
    describe('Async methods', () => {
        it('Returns action promises', done => {
            const [sfs, vol] = create(action => {
                expect(action).to.be.an.instanceof(Promise);
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('`result` is just a circular reference to `action`', done => {
            const [sfs, vol] = create(action => {
                const {result} = action;
                expect(result).to.equal(action);
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('Action promise has expected API', done => {
            const [sfs, vol] = create(action => {
                const {method, isAsync, args, result, resolve, reject, exec, pause, unpause, proceed} = action;

                expect(typeof method).to.equal('string');
                expect(typeof isAsync).to.equal('boolean');
                expect(args instanceof Array).to.equal(true);
                expect(result instanceof Promise).to.equal(true);
                expect(result).to.equal(action);
                expect(typeof resolve).to.equal('function');
                expect(typeof reject).to.equal('function');
                expect(typeof exec).to.equal('function');
                expect(exec()).to.be.an.instanceof(Promise);
                expect(typeof pause).to.equal('function');
                expect(typeof unpause).to.equal('function');
                expect(typeof proceed).to.equal('function');

                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('Returns the correct method name', done => {
            const [sfs, vol] = create(({method}) => {
                expect(method).to.equal('readFile');
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('Returns the correct synchronicity type', done => {
            const [sfs, vol] = create(({isAsync}) => {
                expect(isAsync).to.equal(true);
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('Returns the correct arguments', done => {
            const [sfs, vol] = create(({args}) => {
                expect(args instanceof Array).to.equal(true);
                expect(args.length).to.equal(2);
                expect(args).to.eql(['/foo', 'utf8']);
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('Without mocking, returns the original fs result', done => {
            const [sfs, vol] = create();
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(res).to.equal('bar');
                done();
            });
        });
        it('Mocking result works', done => {
            const [sfs, vol] = create(({resolve}) => {
                resolve('lala');
            });
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(res).to.equal('lala');
                done();
            });
        });
        it('Mocking error works', done => {
            const [sfs, vol] = create(({reject}) => {
                reject(Error('1234'));
            });
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(err).to.be.an.instanceof(Error);
                expect(err.message).to.equal('1234');
                done();
            });
        });
        it('`exec` executes the real filesystem call', done => {
            const [sfs, vol] = create(({exec}) => {
                exec().then(res => {
                    expect(res[0]).to.equal('bar');
                    done();
                });
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('await `exec` executes the real filesystem call', done => {
            const [sfs, vol] = create(async function({exec}) {
                expect(await exec()).to.eql(['bar']);
                done();
            });
            sfs.readFile('/foo', 'utf8', () => {});
        });
        it('`pause` pauses the execution of the async action', done => {
            let executed = false;
            const [sfs, vol] = create(async function({pause}) {
                pause();
                setTimeout(() => {
                    expect(executed).to.equal(false);
                    done();
                }, 1);
            });
            sfs.readFile('/foo', 'utf8', () => {
                executed = true;
            });
        });
        it('`unpause` un-pauses the execution of the async action', done => {
            let executed = false;
            const [sfs, vol] = create(async function({pause, unpause}) {
                pause();
                unpause();
                setTimeout(() => {
                    expect(executed).to.equal(true);
                    done();
                }, 1);
            });
            sfs.readFile('/foo', 'utf8', () => {
                executed = true;
            });
        });
        it('`resolve` after `pause` resolves the action', done => {
            const [sfs, vol] = create(async function({pause, resolve}) {
                pause();
                resolve(['lol']);
            });
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(res).to.equal('lol');
                done();
            });
        });
        it('`reject` after `pause` rejects the action', done => {
            const [sfs, vol] = create(async function({pause, reject}) {
                pause();
                reject(Error('1234'));
            });
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(err.message).to.equal('1234');
                done();
            });
        });
        it('Action resolves with the first provided `resolve` value', done => {
            const [sfs, vol] = create(async function({resolve}) {
                resolve(['1']);
                resolve(['2']);
                resolve(['3']);
            });
            sfs.readFile('/foo', 'utf8', (err, res) => {
                expect(res).to.equal('1');
                done();
            });
        });
    });
});

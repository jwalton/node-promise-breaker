'use strict';

const chai = require('chai');

chai.use(require('chai-as-promised'));
const {expect} = chai;

const promiseBreaker = require('../index');

const makeTestCases = function(testFn, fns) {
    it('should work when called with a callback', done => {
        const fn = promiseBreaker[testFn](fns.add);

        expect(fn.length).to.equal(2);
        return fn(7, (err, result) => {
            if (err) { return done(err); }
            try {
                expect(result).to.equal(8);
                return done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should return a promise with no callback', () => {
        const fn = promiseBreaker[testFn](fns.add);

        return fn(7)
        .then(result => expect(result).to.equal(8));
    });

    it('should work for functions which return an error (cb)', done => {
        const fn = promiseBreaker[testFn](fns.err);

        expect(fn.length).to.equal(2);
        return fn(7, err => {
            try {
                expect(err).to.exist;
                done();
            } catch (err2) {
                done(err2);
            }
        });
    });

    it('should work for functions which return an error (p)', () => {
        const fn = promiseBreaker[testFn](fns.err);

        expect(fn(7)).to.be.rejected;
    });

    it('should work for a function with no parameters (cb)', done => {
        const fn = promiseBreaker[testFn](fns.noParams);

        expect(fn.length).to.equal(1);
        return fn((err, result) => {
            if (err) {return done(err);}
            try {
                expect(result).to.equal("Hello World");
                done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should work for a function with no parameters (p)', () => {
        const fn = promiseBreaker[testFn](fns.noParams);

        return fn()
        .then(result => expect(result).to.equal("Hello World"));
    });

    it('should set "this" correctly (cb)', done => {
        const fn = promiseBreaker[testFn](fns.withThis);

        return fn.call({x: 7}, (err, result) => {
            if (err) { return done(err); }
            try {
                expect(result).to.equal(7);
                done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should set "this" correctly (p)', () => {
        const fn = promiseBreaker[testFn](fns.withThis);

        return fn.call({x: 7})
        .then(result => expect(result).to.equal(7));
    });

    it('should fail with an intelligible error if no function is provided', () =>
        expect(
            () => promiseBreaker[testFn](null)
        ).to.throw('Function required')
    );
};

describe('making promises (make)', () => {
    const fns = {
        add(x, done) {
            return done(null, x + 1);
        },

        err(x, done) {
            return done(new Error("Error"));
        },

        noParams(done) {
            return done(null, "Hello World");
        },

        withThis(done) {
            return done(null, this.x);
        }
    };

    makeTestCases('make', fns);

    it('should return undefined if the fn returns undefined', () => {
        const fn = promiseBreaker.make(done => done(null, undefined));

        return expect(fn()).to.eventually.equal(undefined);
    });

    it('should return undefined if the fn returns nothing', () => {
        let fn = promiseBreaker.make(done => done(null));

        return expect(fn()).to.eventually.equal(undefined)
        .then(() => {
            fn = promiseBreaker.make(done => done());
            return expect(fn()).to.eventually.equal(undefined);
        });
    });

    it('should fail if global.Promise is undefined', () => {
        const p = global.Promise;
        try {
            global.Promise = null;
            return expect(
                () => promiseBreaker.make(() => {})
            ).to.throw('Promise is undefined');
        } finally {
            global.Promise = p;
        }
    });

    it('should fail if global.Promise is not a constructor', () => {
        const p = global.Promise;
        try {
            global.Promise = {};
            return expect(
                () => promiseBreaker.make(() => {})
            ).to.throw('Expect Promise to be a constructor');
        } finally {
            global.Promise = p;
        }
    });

    it('should return multiple arguments passed to the callback as an array', () => {
        return Promise.resolve()
        .then(() => {
            const fn = promiseBreaker.make(done => done(null, "a", "b"));
            return expect(fn()).to.eventually.eql(["a", "b"])
        }).then(() => {
            const fn = promiseBreaker.make(done => done(null, "a", null));
            return expect(fn()).to.eventually.eql(["a", null]);
        }).then(() => {
            const fn = promiseBreaker.make(done => done(null, "a", undefined));
            return expect(fn()).to.eventually.eql(["a", undefined]);
        }).then(() => {
            const fn = promiseBreaker.make(done => done(null, "a"));
            return expect(fn()).to.eventually.eql("a");
        });
    });

    it('should work for ES6 default parameters if you specify the argument count', () => {
        const fn = promiseBreaker.make({args: 3}, (x, y=1, done=null) => done(null, x + y));
        return fn(2)
        .then(result => {
            expect(result).to.equal(3);
        });
    });
});

describe("making callbacks (break)", () => {
    const fns = {
        add(x) {
            return Promise.resolve(x + 1);
        },

        err(x) {
            x;
            return Promise.reject(new Error("Error"));
        },

        noParams() {
            return Promise.resolve("Hello World");
        },

        withThis() {
            return Promise.resolve(this.x);
        }
    };

    return makeTestCases('break', fns);
});

describe("Use custom promise", () => {
    class CustomPromise {
        constructor(fn) {
            this.promise = new Promise(fn);
            this.foo = 7;
        }

        then(a, b) {
            return this.promise.then(a,b);
        }

        catch(a) {
            return this.promise.catch(a);
        }
    }

    it('should work', () => {
        const customPb = promiseBreaker.withPromise(CustomPromise);
        let fn = done => done(null, 7);

        fn = customPb.make(fn);
        const result = fn();

        return expect(result.foo).to.exist;
    });

    it('should fail if custom promise is not a constructor', () =>
        expect(
            () => promiseBreaker.withPromise({})
        ).to.throw('Expect Promise to be a constructor')
    );

    it('should work for ES6 default parameters if you specify the argument count', () => {
        const fn = promiseBreaker.break({args: 2}, (x, y=1) => Promise.resolve(x + y));

        return promiseBreaker.call(done => fn(2, 1, done))
        .then(result => {
            expect(result).to.equal(3);
        });
    });
});

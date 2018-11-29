'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

const promiseBreaker = require('..');

describe('applyFn', () => {
    it('should work for a function that expects a callback', () => {
        const thisObj = {};
        const fn = function(x, y, done) {
            expect(this).to.equal(thisObj);
            done(null, x + y);
        };

        return promiseBreaker
            .applyFn(fn, 2, thisObj, [2, 4])
            .then(result => expect(result).to.equal(6));
    });

    it('should work for a function that expects a callback, and returns an error', () => {
        const fn = (x, y, done) => {
            done(new Error('foo'));
        };

        return expect(promiseBreaker.applyFn(fn, 2, null, [2, 4])).to.be.rejectedWith('foo');
    });

    it("should work for a function that expects a callback when we don't pass enough arugments", () => {
        const fn = (x, y, done) => {
            done(null, 'hello');
        };

        return promiseBreaker.applyFn(fn, 2).then(result => expect(result).to.equal('hello'));
    });

    it('should work for a function that returns a promise', () => {
        const fn = () => Promise.resolve('hello');

        return promiseBreaker.applyFn(fn, 0).then(result => expect(result).to.equal('hello'));
    });

    it("should work for a function that returns a value that isn't a promise", () => {
        const fn = (x, y, done) => {
            done(null, 'hello');
            return {};
        };

        return promiseBreaker
            .applyFn(fn, 2, null, [1, 2])
            .then(result => expect(result).to.equal('hello'));
    });

    it('should work if we do not specify argumentCount', () => {
        const fn = done => {
            done(null, 7);
        };

        return promiseBreaker.applyFn(fn).then(result => expect(result).to.equal(7));
    });

    it('should work for a function that returns a scalar', () => {
        const fn = () => 7;

        return promiseBreaker.applyFn(fn).then(result => expect(result).to.equal(7));
    });

    it('should error if function has incorrect number of parameters', () => {
        const fn = (a, b, c, d, e) => a + e;

        return expect(
            promiseBreaker.applyFn(fn, 3, null, ['hello', 'world', 6])
        ).to.be.rejectedWith(
            'Expected function with 3 or fewer arguments which returns Promise, ' +
                'or function with 4 arguments which takes callback - got function with 5 arguments.'
        );
    });

    it('should add "undefined"s if we do not pass enough parameters', () => {
        const thisObj = {};
        const fn = function(x, y, z) {
            return Promise.resolve(`${x}${y}${z}`);
        };

        return promiseBreaker
            .applyFn(fn, 3, thisObj, [2, 4])
            .then(result => expect(result).to.equal('24undefined'));
    });
});

describe('apply', () => {
    it('should work for a function that expects a callback', () => {
        const thisObj = {};
        const fn = function(x, y, done) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err);
            }
        };

        return promiseBreaker.apply(fn, thisObj, [2, 4]).then(result => expect(result).to.equal(6));
    });

    it('should work for a function that expects a callback, and returns an error', () => {
        const fn = (x, y, done) => {
            done(new Error('foo'));
        };

        return expect(promiseBreaker.apply(fn, null, [2, 4])).to.be.rejectedWith('foo');
    });

    it('should work for a function that returns a promise', () => {
        const fn = () => Promise.resolve('hello');

        return promiseBreaker.apply(fn, null, []).then(result => expect(result).to.equal('hello'));
    });

    it("should work for a function that returns a value that isn't a promise", () => {
        const fn = (x, y, done) => {
            done(null, 'hello');
            return {};
        };

        return promiseBreaker
            .apply(fn, null, [1, 2])
            .then(result => expect(result).to.equal('hello'));
    });

    it('should work if we do not specify argumentCount', () => {
        const fn = done => {
            done(null, 7);
        };

        return expect(promiseBreaker.apply(fn)).to.eventually.equal(7);
    });

    it('should work for a function that returns a scalar', () => {
        const fn = () => 7;
        return expect(promiseBreaker.apply(fn)).to.eventually.equal(7);
    });

    it('should error if function has incorrect number of parameters', () => {
        const fn = (a, b, c, d, e) => a + e;

        return expect(promiseBreaker.apply(fn, null, ['hello', 'world', 6])).to.be.rejectedWith(
            'Expected function with 3 or fewer arguments which returns Promise, ' +
                'or function with 4 arguments which takes callback - got function with 5 arguments.'
        );
    });
});

describe('callFn', () => {
    it('should work for a function that expects a callback', () => {
        const thisObj = {};
        const fn = function(x, y, done) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err);
            }
        };

        return promiseBreaker
            .callFn(fn, 2, thisObj, 2, 4)
            .then(result => expect(result).to.equal(6));
    });

    it("should work if we don't supply enough arguments", () => {
        const fn = (x, y, done) => {
            done(null, 'hello');
        };

        return promiseBreaker.callFn(fn, 2).then(result => expect(result).to.equal('hello'));
    });

    it('should work if we do not specify argumentCount', () => {
        const fn = done => {
            done(null, 7);
        };

        return expect(promiseBreaker.callFn(fn)).to.eventually.equal(7);
    });

    it('should work with a callback', done => {
        const fn = (x, y, done) => done(null, x + y);

        promiseBreaker.callFn(fn, 2, null, 2, 4, (err, result) => {
            try {
                expect(err).to.not.exist;
                expect(result).to.equal(6);
                done();
            } catch (err2) {
                done(err2);
            }
        });
    });

    it('should work for a function that returns a scalar', () => {
        const fn = () => 7;

        return expect(promiseBreaker.callFn(fn)).to.eventually.equal(7);
    });

    it('should error if function has incorrect number of parameters', () => {
        const fn = (a, b, c, d, e) => a + e;

        expect(promiseBreaker.callFn(fn, 3, null, 'hello', 'world', 6)).to.be.rejectedWith(
            'Expected function with 3 or fewer arguments which returns Promise, ' +
                'or function with 4 arguments which takes callback - got function with 5 arguments.'
        );
    });
});

describe('call', () => {
    it('should work for a function that expects a callback', () => {
        const thisObj = {};
        const fn = function(x, y, done) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err);
            }
        };

        return promiseBreaker.call(fn, thisObj, 2, 4).then(result => expect(result).to.equal(6));
    });

    it('should work for a function that returns a Promise', () => {
        const thisObj = {};
        const fn = function(x, y) {
            return Promise.resolve().then(() => {
                expect(this).to.equal(thisObj);
                return x + y;
            });
        };

        return promiseBreaker.call(fn, thisObj, 2, 4).then(result => expect(result).to.equal(6));
    });

    it('should work for a function that returns a scalar', () => {
        const fn = () => 7;

        return expect(promiseBreaker.call(fn)).to.eventually.equal(7);
    });

    it('should error if function has incorrect number of parameters', () => {
        const fn = (a, b, c, d, e) => a + e;

        return expect(promiseBreaker.call(fn, null, 'hello', 'world', 6)).to.be.rejectedWith(
            'Expected function with 3 or fewer arguments which returns Promise, ' +
                'or function with 4 arguments which takes callback - got function with 5 arguments.'
        );
    });

    it('should pass if function has too few parameters', () => {
        // Possibly the function you're calling isn't going to use all of your parameters, so we have to support
        // this case.
        const fn = (a, b) => Promise.resolve(a + b);

        return expect(promiseBreaker.call(fn, null, 1, 2, 3)).to.eventually.equal(3);
    });

    it('should pass if function has too few parameters, scalar result', () => {
        const fn = (a, b) => a + b;

        return expect(promiseBreaker.call(fn, null, 1, 2, 3)).to.eventually.equal(3);
    });
});

describe('callWithCb', () => {
    it('should work for a function that expects a callback', done => {
        const thisObj = {};
        const fn = function(x, y, done) {
            try {
                expect(this).to.equal(thisObj);
                done(null, x + y);
            } catch (err) {
                done(err);
            }
        };

        promiseBreaker.callWithCb(fn, thisObj, 2, 4, (err, result) => {
            if (err) {
                return done(err);
            }
            try {
                expect(result).to.equal(6);
                done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should work for a function that returns a Promise', done => {
        const fn = (x, y) => Promise.resolve(x + y);

        promiseBreaker.callWithCb(fn, null, 2, 4, (err, result) => {
            if (err) {
                return done(err);
            }
            try {
                expect(result).to.equal(6);
                done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should work for a function that returns a scalar', done => {
        const fn = () => 6;

        promiseBreaker.callWithCb(fn, null, (err, result) => {
            if (err) {
                return done(err);
            }
            try {
                expect(result).to.equal(6);
                done();
            } catch (err2) {
                done(err2);
            }
            return null;
        });
    });

    it('should error if function has incorrect number of parameters', done => {
        const fn = (a, b, c, d, e) => a + e;

        promiseBreaker.callWithCb(fn, null, 'hello', 'world', 6, err => {
            try {
                expect(err).to.exist;
                expect(err.message).to.equal(
                    'Expected function with 3 or fewer arguments which returns Promise, ' +
                        'or function with 4 arguments which takes callback - got function with 5 arguments.'
                );
                done();
            } catch (err2) {
                done(err2);
            }
        });
    });

    it('should error if done is not provided', () => {
        const fn = (a, b) => a + b;

        expect(() => promiseBreaker.callWithCb(fn, null, 'hello', 'world', 6)).to.throw(
            'callWithCb requires function as last parameter.'
        );
    });
});

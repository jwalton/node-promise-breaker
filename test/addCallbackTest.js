'use strict';

const chai = require('chai');

chai.use(require('chai-as-promised'));
const { expect } = chai;

const { expectUncaughtException } = require('./testUtils');
const pb = require('..');

describe('addCallback', () => {
    [
        { fn: Promise.resolve(7), comment: 'promise' },
        { fn: () => Promise.resolve(7), comment: 'fn' },
        { fn: () => 7, comment: 'scalar' },
    ].forEach(({ fn, comment }) => {
        it(`should convert a Promise based function into a callback based function (${comment})`, () => {
            function test(done = null) {
                return pb.addCallback(done, fn);
            }

            return pb
                .call(done => test(done))
                .then(result => {
                    expect(result, 'callback based').to.equal(7);
                    return test();
                })
                .then(result => {
                    expect(result, 'promise based').to.equal(7);
                });
        });
    });

    const rejected = Promise.reject(new Error('boom'));
    // This is here to stop Node from raising a "Potentially Unhandled Rejection Error".
    rejected.catch(() => null);

    [
        { fn: rejected, comment: 'promise' },
        { fn: () => Promise.reject(new Error('boom')), comment: 'fn' },
        {
            fn: () => {
                throw new Error('boom');
            },
            comment: 'throw',
        },
    ].forEach(({ fn, comment }) => {
        it(`should pass through errors (${comment})`, () => {
            function test(done = null) {
                return pb.addCallback(done, fn);
            }

            return expect(pb.call(done => test(done)), 'callback based')
                .to.be.rejectedWith('boom')
                .then(() => expect(test(), 'promise based').to.be.rejectedWith('boom'));
        });
    });

    it('should complain if no promise is passed', () => {
        expect(() => pb.addCallback()).to.throw(
            'addCallback() expected promise or function as second paramater'
        );

        expect(() => pb.addCallback(null, {})).to.throw(
            "addCallback() don't know what to do with object"
        );
    });

    it('should deal correctly with exception from `done`', () => {
        const fn = (done = null) => pb.addCallback(done, Promise.resolve('hello'));
        const done = () => {
            throw new Error('boom');
        };

        // We're calling into `fn`, but `done` is throwing an exception after `fn` is complete.  In
        // an all-callback based world, this would cause an uncaught exception.  There's no better way to
        // handle this, so make sure we get an uncaught exception here.
        return expectUncaughtException(() => fn(done));
    });

    it('should deal correctly with exception from `done` (error case)', () => {
        const fn = (done = null) => pb.addCallback(done, Promise.reject(new Error('boom1')));
        const done = () => {
            throw new Error('boom');
        };

        // We're calling into `fn`, but `done` is throwing an exception after `fn` is complete.  In
        // an all-callback based world, this would cause an uncaught exception.  There's no better way to
        // handle this, so make sure we get an uncaught exception here.
        return expectUncaughtException(() => fn(done));
    });
});

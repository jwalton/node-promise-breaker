'use strict';

const chai = require('chai');
const pb = require('..');

chai.use(require('chai-as-promised'));
const {expect} = chai;

describe('addPromise', () => {
    it('should convert a callback based function into a Promise based function', () => {
        function test(done = null) {
            return pb.addPromise(done, done => done(null, 7));
        }

        return pb.call(done => test(done))
        .then(result => {
            expect(result, 'callback based').to.equal(7);
            return test();
        }).then(result => {
            expect(result, 'promise based').to.equal(7);
        });
    });

    it('should return undefined if a callback is provided', done => {
        function test(done = null) {
            return pb.addPromise(done, done => done(null, 7));
        }

        let answer;

        answer = test((err, result) => {
            process.nextTick(() => {
                expect(result).to.equal(7);
                expect(answer).to.equal(undefined);
                done();
            })
        });
        console.log("ANSWER", answer, answer === undefined);
    });

    it('should return multiple values as an array', () => {
        function test(done = null) {
            return pb.addPromise(done, done => done(null, 7, 14));
        }

        pb.call(done =>
            test((err, a, b) => {
                if(err) {return done(err);}

                try {
                    expect(a, 'first param callback based').to.equal(7);
                    expect(b, 'second param callback based').to.equal(14);
                    done();
                } catch (err2) {
                    done(err);
                }
                return null;
            })
        )
        .then(() => test())
        .then(result => expect(result, 'promise based').to.eql([7, 14]) );
    });

    it('should pass through errors', () => {
        function test(done = null) {
            return pb.addPromise(done, done => done(new Error('boom')));
        }

        return expect(
            pb.call(done => test(done)), 'callback based'
        ).to.be.rejectedWith('boom')
        .then(() =>
            expect(
                test(), 'promise based'
            ).to.be.rejectedWith('boom')
        );
    });
});

chai           = require 'chai'
chai.use require('chai-as-promised')
{expect}       = chai
if !global.Promise? then global.Promise = require('es6-promise').Promise

promiseBreaker = require '../index'

describe "applyFn", ->
    it 'should work for a function that expects a callback', ->
        thisObj = {}
        fn = (x, y, done) ->
            expect(this).to.equal thisObj
            done null, x + y

        promiseBreaker.applyFn(fn, 2, thisObj, [2, 4])
        .then (result) ->
            expect(result).to.equal 6

    it 'should work for a function that expects a callback, and returns an error', ->
        fn = (x, y, done) ->
            done new Error("foo")

        caught = false
        promiseBreaker.applyFn(fn, 2, null, [2, 4])
        .catch (err) ->
            expect(err.message).to.equal "foo"
            caught = true
        .then (result) ->
            expect(caught).to.be.true

    it 'should work for a function that expects a callback when we don\'t pass enough arugments', ->
        fn = (x, y, done) ->
            done null, "hello"

        promiseBreaker.applyFn(fn, 2)
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work for a function that returns a promise', ->
        fn = -> Promise.resolve("hello")

        promiseBreaker.applyFn(fn, 0)
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work for a function that returns a value that isn\'t a promise', ->
        fn = (x, y, done) ->
            done null, 'hello'
            return {}

        promiseBreaker.applyFn(fn, 2, null, [1, 2])
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work if we do not specify argumentCount', ->
        fn = (done) -> done null, 7

        expect(
            promiseBreaker.applyFn fn
        ).to.eventually.equal 7

    it 'should work for a function that returns a scalar', ->
        fn = -> 7

        expect(
            promiseBreaker.applyFn(fn)
        ).to.eventually.equal 7

    it 'should error if function has incorrect number of parameters', ->
        fn = (a, b) -> 7

        expect(
            promiseBreaker.applyFn(fn, 3, null, ["hello", "world", 6])
        ).to.be.rejectedWith("Expected function with 3 arguments which returns Promise, " +
            "or function with 4 arguments which takes callback.")


describe "apply", ->
    it 'should work for a function that expects a callback', ->
        thisObj = {}
        fn = (x, y, done) ->
            expect(this).to.equal thisObj
            done null, x + y

        promiseBreaker.apply(fn, thisObj, [2, 4])
        .then (result) ->
            expect(result).to.equal 6

    it 'should work for a function that expects a callback, and returns an error', ->
        fn = (x, y, done) ->
            done new Error("foo")

        expect(
            promiseBreaker.apply(fn, null, [2, 4])
        ).to.be.rejectedWith("foo")

    it 'should work for a function that returns a promise', ->
        fn = -> Promise.resolve("hello")

        promiseBreaker.apply(fn, null, [])
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work for a function that returns a value that isn\'t a promise', ->
        fn = (x, y, done) ->
            done null, 'hello'
            return {}

        promiseBreaker.apply(fn, null, [1, 2])
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work if we do not specify argumentCount', ->
        fn = (done) -> done null, 7

        expect(
            promiseBreaker.apply fn
        ).to.eventually.equal 7

    it 'should work for a function that returns a scalar', ->
        fn = -> 7

        expect(
            promiseBreaker.apply(fn)
        ).to.eventually.equal 7

    it 'should error if function has incorrect number of parameters', ->
        fn = (a, b) -> 7

        expect(
            promiseBreaker.apply(fn, null, ["hello", "world", 6])
        ).to.be.rejectedWith("Expected function with 3 arguments which returns Promise, " +
            "or function with 4 arguments which takes callback.")


describe "callFn", ->
    it 'should work for a function that expects a callback', ->
        thisObj = {}
        fn = (x, y, done) ->
            expect(this).to.equal thisObj
            done null, x + y

        promiseBreaker.callFn(fn, 2, thisObj, 2, 4)
        .then (result) ->
            expect(result).to.equal 6

    it 'should work if we don\'t supply enough arguments', ->
        fn = (x, y, done) ->
            done null, "hello"

        promiseBreaker.callFn(fn, 2)
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work if we do not specify argumentCount', ->
        fn = (done) -> done null, 7

        expect(
            promiseBreaker.callFn fn
        ).to.eventually.equal 7

    it 'should work with a callback', (done) ->
        fn = (x, y, done) ->
            done null, x + y

        promiseBreaker.callFn fn, 2, null, 2, 4, (err, result) ->
            expect(err).to.not.exist
            expect(result).to.equal 6
            done()

    it 'should work for a function that returns a scalar', ->
        fn = -> 7

        expect(
            promiseBreaker.callFn(fn)
        ).to.eventually.equal(7)

    it 'should error if function has incorrect number of parameters', ->
        fn = (a, b) -> 7

        expect(
            promiseBreaker.callFn(fn, 3, null, "hello", "world", 6)
        ).to.be.rejectedWith("Expected function with 3 arguments which returns Promise, " +
            "or function with 4 arguments which takes callback.")

describe "call", ->
    it 'should work for a function that expects a callback', ->
        thisObj = {}
        fn = (x, y, done) ->
            expect(this).to.equal thisObj
            done null, x + y

        promiseBreaker.call(fn, thisObj, 2, 4)
        .then (result) ->
            expect(result).to.equal 6

    it 'should work with a callback', (done) ->
        fn = (x, y, done) ->
            done null, x + y

        promiseBreaker.call fn, null, 2, 4, (err, result) ->
            expect(err).to.not.exist
            expect(result).to.equal 6
            done()

        return null

    it 'should work for a function that returns a scalar', ->
        fn = -> 7

        expect(
            promiseBreaker.call(fn)
        ).to.eventually.equal(7)

    it 'should error if function has incorrect number of parameters', ->
        fn = (a, b) -> 7

        expect(
            promiseBreaker.call(fn, null, "hello", "world", 6)
        ).to.be.rejectedWith("Expected function with 3 arguments which returns Promise, " +
            "or function with 4 arguments which takes callback.")

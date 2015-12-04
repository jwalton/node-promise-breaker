chai           = require 'chai'
chai.use require('chai-as-promised')
{expect}       = chai
if !global.Promise? then global.Promise = require('es6-promise').Promise

# Don't `require` promiseBreaker here - do it below in a test, so we benefit from Mocha's
# global leak detection.
promiseBreaker = null

makeTestCases = (testFn, fns) ->
    it 'should work when called with a callback', (done) ->
        fn = promiseBreaker[testFn] fns.add
        expect(fn.length).to.equal 2
        fn 7, (err, result) ->
            return done err if err?
            expect(result).to.equal 8
            done()

    it 'should return a promise with no callback', ->
        fn = promiseBreaker[testFn] fns.add
        fn(7)
        .then (result) ->
            expect(result).to.equal 8

    it 'should work for functions which return an error (cb)', (done) ->
        fn = promiseBreaker[testFn] fns.err
        expect(fn.length).to.equal 2
        fn 7, (err, result) ->
            expect(err).to.exist
            done()

    it 'should work for functions which return an error (p)', ->
        caught = false
        fn = promiseBreaker[testFn] fns.err
        fn(7)
        .catch (err) ->
            caught = true
        .then ->
            expect(caught).to.be.true

    it 'should work for a function with no parameters (cb)', (done) ->
        fn = promiseBreaker[testFn] fns.noParams
        expect(fn.length).to.equal 1
        fn (err, result) ->
            return done err if err?
            expect(result).to.equal "Hello World"
            done()

    it 'should work for a function with no parameters (p)', ->
        fn = promiseBreaker[testFn] fns.noParams
        fn()
        .then (result) ->
            expect(result).to.equal "Hello World"

    it 'should set "this" correctly (cb)', (done) ->
        fn = promiseBreaker[testFn] fns.withThis
        fn.call {x: 7}, (err, result) ->
            return done err if err?
            expect(result).to.equal 7
            done()

    it 'should set "this" correctly (p)', ->
        fn = promiseBreaker[testFn] fns.withThis
        fn.call({x: 7})
        .then (result) ->
            expect(result).to.equal 7

    it 'should fail with an intelligible error if no function is provided', ->
        expect(
            -> promiseBreaker[testFn] null
        ).to.throw 'Function required'

describe 'require', ->
    it 'should work', ->
        promiseBreaker = require '../index'

describe 'making promises (make)', ->
    fns = {
        add: (x, done) ->
            done null, x + 1

        err: (x, done) ->
            done new Error "Error"

        noParams: (done) ->
            done null, "Hello World"

        withThis: (done) ->
            done null, @x
    }

    makeTestCases 'make', fns

    it 'should fail if global.Promise is undefined', ->
        p = global.Promise
        try
            global.Promise = null
            expect(
                -> promiseBreaker.make ->
            ).to.throw 'Promise is undefined'
        finally
            global.Promise = p

    it 'should fail if global.Promise is not a constructor', ->
        p = global.Promise
        try
            global.Promise = {}
            expect(
                -> promiseBreaker.make ->
            ).to.throw 'Expect Promise to be a constructor'
        finally
            global.Promise = p

describe "making callbacks (break)", ->
    fns = {
        add: (x) ->
            Promise.resolve(x + 1)

        err: (x) ->
            Promise.reject(new Error("Error"))

        noParams: ->
            Promise.resolve("Hello World")

        withThis: ->
            Promise.resolve @x
    }

    makeTestCases 'break', fns

describe "Use custom promise", ->
    class CustomPromise
        constructor: (fn) ->
            @promise = new Promise(fn)

        then: (a, b) ->
            @promise.then(a,b)

        catch: (a) ->
            @promise.catch(a)

        foo: 7

    it 'should work', ->
        customPb = promiseBreaker.withPromise CustomPromise
        fn = (done) ->
            done null, 7

        fn = customPb.make fn
        result = fn()

        expect(result.foo).to.exist

    it 'should fail if custom promise is not a constructor', ->
        expect(
            -> promiseBreaker.withPromise {}
        ).to.throw 'Expect Promise to be a constructor'

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

        promiseBreaker.applyFn(fn, 2, [1, 2])
        .then (result) ->
            expect(result).to.equal "hello"

    it 'should work if we do not specify argumentCount', ->
        fn = (done) -> done null, 7

        expect(
            promiseBreaker.applyFn fn
        ).to.eventually.equal 7


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

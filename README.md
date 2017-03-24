[![Build Status](https://travis-ci.org/jwalton/node-promise-breaker.svg)](https://travis-ci.org/jwalton/node-promise-breaker)
[![Coverage Status](https://coveralls.io/repos/jwalton/node-promise-breaker/badge.svg)](https://coveralls.io/r/jwalton/node-promise-breaker)

## What is it?

`promise-breaker` makes it easy to write functions that will accept an optional callback, or return
a Promise if a callback is not provided.  You can use callbacks or Promises in your implementation,
and callers can call with either a callback or expect a Promise.  It's a library that makes it easy
to write libraries for others.

## Installation

    npm install --save promise-breaker

## Requirements

This library assumes that `Promise` is a defined global variable.  If this is not the case
on your platform, you can use a polyfill:

    npm install --save es6-promise

Then somewhere in your node.js application:

    if(!global.Promise) {
        global.Promise = require('es6-promise').Promise;
    }

Or in your client-side app:

    if(!window.Promise) {
        window.Promise = require('es6-promise').Promise;
    }

If you don't want to set the global, you can pass an optional Promise implementation to
`promise-breaker`:

    var MyPromise = require('es6-promise').Promise;
    promiseBreaker = require('promise-breaker').withPromise(MyPromise);

## Summary

With the growing popularity of Promises these days, if you're a library author, it's nice to
be able to provide your clients with a library that will take an optional callback, and if the
callback isn't provided, return a Promise.  If you've ever tried to do this, you know that there's
a lot of finicky boilerplate involved in every function you write.  Providing callback support is
also pretty important if you prefer to write your library using Promises internally.

'promise-breaker' makes this really easy.  If you prefer writing in callback style:

```
// We're going to make some promises from callbacks
var pb = require('promise-breaker');

exports.myFunc = pb.make(function(done) {
    done(null, "Hello World");
});
```

or if you prefer Promise style:


```
// We're going to break some promises down into callbacks
var pb = require('promise-breaker')

exports.myFunc = pb.break(function() {
    return Promise.resolve("Hello World");
});
```

No matter which approach you take, users of your library can now call `myFunc(done)`, or they
can call `myFunc().then(...)`.

## Notes for using with Babel/ES6 Default Parameters

In ES6, if a function has default parameters:

    function test(a, b, c=7) {return Promise.resolve();}
    
The resulting function will have length 2 instead of 3.  This causes problems for promise-breaker:

    const fn = pb.break(test);
    fn(a, b, c).then(() => console.log('done!')); // Boom!
    
The problem here is, promise-breaker sees that three arguments are being passed, and the underlying function has length 2,
so promise-breaker assumes the extra argument is a callback and tries to run it.  This is unfortunately not a trivial problem to solve.  There will be a fix for this in a future release, but for now the simple solution is to not use default parameters.

## API

### pb.make(fn)

`make(fn)` takes a function which accepts a `callback(err, result)` as its last parameter, and
returns a new function which accepts an optional callback as its last parameter.  If a callback is
provided, this new function will behave exactly like the original function.  If the callback
is not provided, then the new function will return a Promise.

Since Promises only allow a single value to be returned, if `fn` passes more than two arguments to `callback(...)`,
then (as of v3.0.0) any arguments after the error will be transformed into an array and returned via the Promise as a
single combined argument.  This does not affect the case where the transformed function is called with a callback.
For example:

    var myFunc = pb.make(function(callback) {
        // We're returning multiple values via callback
        callback(null, "a", "b");
    })

    // Callback style
    myFunc(function(err, a, b) {...});

    // Promise style
    myFunc()
    .then(function(results) {
        // Promises only let us return a single value, so we return an array.
        var a = results[0];
        var b = results[1];
        ...
    })
    .catch(function(err) {...});

Note that `pb.make()` uses `fn.length` to determine how many arguments the function expects normally,
so `pb.make()` will not work with functions that do not explicitly define their arguments in
their function declaration.

### pb.break(fn)

`break(fn)` is the opposite of `make(fn)`.  `fn` here is a function which returns a Promise.
`break(fn)` will generate a new function with an extra parameter, an optional
`callback(err, result)`.  If no callback is provided, the generated function will behave exactly
like the original function.  If a callback is provided, then the generated function will return
`null`, and will pass any results that would have been returned via the Promise via the callback
instead.

Note that `pb.break()` uses `fn.length` to determine how many arguments the function expects normally,
so `pb.break()` will not work with functions that do not explicitly define their arguments in
their function declaration.

### pb.applyFn(fn, argumentCount, thisArg, args[, cb])

Much like [`Function.prototype.apply()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call),
this calls a function, but this lets you call into a function when you don't know whether the
function is expecting a callback or is going to return a Promise.  `fn` is the function you wish
to call, `argumentCount` is the number of arguments you expect the function to take (not including
the callback).  Under the hood, if `fn.length` is equal to `argumentCount`, this will call `fn`
with the parameters provided, and then return the Promise (or wrap a returned value in a Promise).
If `fn.length` is `argumentCount + 1`, then a callback will be added.  In either case, if the
number of arguments provided in `args` is less than `argumentCount`, `args` will be filled in
with nulls.

If `cb` is provided, `applyFn` will call into `cb` with a result, otherwise `applyFn` will itself
return a Promise.

Note `applyFn` will reject if `fn.length` is not `argumentCount` or `argumentCount + 1`.

### pb.apply(fn, thisArg, args[, cb])

Same as `applyFn`, but `argumentCount` is implicitly set to `args.length`.

### pb.callFn(fn, argumentCount, thisArg[, arg1[, arg2[, ...[, cb]]]])

This is the [`Function.prototype.call()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
equivalent of `applyFn()`.

Note that if you do not specify an `argumentCount` it will default to 0.  You can use this handy shortcut:

    pb.callFn(function(done) {doSomething(x, y, z, done);})
    .then(...)

to call into a callback based function from inside promise-based code.

### pb.call(fn, thisArg[, arg1[, arg2[, ...]]))

Similar to `callFn`, but since we don't know the `argumentCount`, we base it on the number of arguments passed.  This
always returns a Promise - if you want to use a callback, you need to use `callFn` instead.

### pb.withPromise(promiseImpl)

Returns a new `{make, break, applyFn, callFn}` object which uses the specified promiseImpl
constructor to create new Promises.

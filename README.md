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

## API

### pb.make(fn)

`make(fn)` takes a function which accepts a `callback(err, result)` as its last parameter, and
returns a new function which accepts an optional callback as its last parameter.  If a callback is
provided, this new function will behave exactly like the original function.  If the callback
is not provided, then the new function will return a Promise.

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
the callback).  Under the hood, this will call `fn` and pass in a callback as the
`argumentCount + 1`th parameter.  If a Promise is returned, `applyFn` will assume `fn` is Promise
based, otherwise `applyFn` will wait for the callback to be called.

If `cb` is provided, `applyFn` will call into `cb` with a result, otherwise `applyFn` will itself
return a Promise.

### pb.callFn(fn, argumentCount, thisArg[, arg1[, arg2[, ...[, cb]]]])

This is the [`Function.prototype.call()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
equivalent of `applyFn()`.

Note that if you do not specify an `argumentCount` it will default to 0.  You can use this handy shortcut:

    pb.callFn(function(done) {doSomething(x, y, z, done);})
    .then(...)

to call into a callback based function from inside promise-based code.

### pb.withPromise(promiseImpl)

Returns a new `{make, break, applyFn, callFn}` object which uses the specified promiseImpl
constructor to create new Promises.

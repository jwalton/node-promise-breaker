[![Build Status](https://travis-ci.org/jwalton/node-promise-breaker.svg)](https://travis-ci.org/jwalton/node-promise-breaker)
[![Coverage Status](https://coveralls.io/repos/jwalton/node-promise-breaker/badge.svg)](https://coveralls.io/r/jwalton/node-promise-breaker)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

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

```js
export function myFunc(done=null) {
    return pb.addPromise(done, done => // Add this wrapper around your async function
        doThing((err, thing) => {
            if(err) {return done(err);}
            doOtherThing(thing, (err, otherThing) => {
                if(err) {return done(err);}
                done(null, otherThing);
            });
        });
    );
}
```

or if you prefer Promise style:

```js
export function myFunc(done=null) {
    return pb.addCallback(done, // Add this wrapper around your returned Promise.
        doThing()
        .then(result => doOtherThing(result))
    );
}
```

If you're using arrow functions or using commonjs exports, it's even easier to use
promise-breaker to create functions that generate a Promise or accept a callback:

```js
// Both of these will take an optional `done`, and if not provided return a Promise.
exports.myPromiseFunc = pb.break({args: 0}, () => {
    return Promise.resolve("Hello World");
});

exports.myCbFunc = pb.make({args: 1}, done => {
    done(null, "Hello World");
});
```

The names `make()` and `break()` here come from the idea that you are making a callback into a promise, or breaking
a promise down into a callback.  Note that `make()` and `break()` rely on the `.length` of the function you pass
in.  In ES6, default parameters do not count towards the length of the function, so you need to explicitly tell
promise-breaker how many parameters are expected in the `args` parameter.  If you're not using default arguments, you
can omit the options parameter altogether, but this is a bad habit, as promise-breaker unfortunately has no way to
detect if you get it wrong.

The other thing you often want to do when writing a library is call into a function without knowing whether
it returns a promise or expects a callback.  Again, promise-breaker makes this easy:

```js
export function doStuff(fn) {
    // This works just like `fn.call` except it will add a `done` if `fn.length` is bigger than the parameter count.
    // So here, this will either call `fn("hello world")` and get back a Promise or `fn("hello world", done)` and
    // convert the callback into a Promise for you.
    pb.call(fn, null, "hello world")
    .catch(err => console.log(err));
}
```

Or, in callback style:

```js
export function doStuff(fn) {
    pb.callWithCb(fn, null, "hello world", err => {
        if(err) return console.log(err);
    });
}
```

## API

### pb.make([options,] fn)

* `options.args` - In ES6, default parameters do not count towards a functions `.length`.  If your `fn`
  uses default parameters, you must specify the total parameter count in `args`.  E.g.:
  `const myFn = pb.make({args: 2}, (x, y=null) => ...);`  If you do not specify `args`, then promise-breaker
  will use `fn.length` instead.

`make()` takes a function which accepts a `callback(err, result)` as its last parameter, and
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


### pb.break([options,] fn)

* `options.args` - In ES6, default parameters do not count towards a functions `.length`.  If your `fn`
  uses default parameters, you must specify the total parameter count in `args`.  E.g.:
  `const myFn = pb.break({args: 3}, (x, y=null, done=null) => ...);`  If you do not specify `args`,
  then promise-breaker will use `fn.length` instead.

`break(fn)` is the opposite of `make(fn)`.  `fn` here is a function which returns a Promise.
`break(fn)` will generate a new function with an extra parameter, an optional
`callback(err, result)`.  If no callback is provided, the generated function will behave exactly
like the original function.  If a callback is provided, then the generated function will return
`null`, and will pass any results that would have been returned via the Promise via the callback
instead.

### addPromise(done, fn)

Used to add Promise support to a callback-based function.

Calls `fn(cb)`.  If `done` is provided, it is passed directly as `cb` and `addPromise` returns undefined.  If `done`
is not provided, `addPromise` will generate an appropriate callback and return a Promise.  If `fn` is called with
more than two arguments (with multiple results, in other words) then the Promise will resolve to an array of results.


Use it like this:

```js
export function addAsync(x, y, done=null) {
    return pb.addPromise(done, done => done(null, x + y));
}
```

### addCallback(done, promise)

Used to add callback support to a promise-based function.

If `done` is not provided, returns the `promise` passed in.  If `done` is
provided, this will wait for `promise` to resolve or reject and then call
`done(err, result)` appropriately.  Note that `promise` can also be a
function that takes no arguments and returns a Promise.

Use it like this:

```js
export function addAsync(x, y, done=null) {
    return pb.addCallback(done, Promise.resolve(x + y));
}
```

### pb.apply(fn, thisArg, args[, cb])

Much like [`Function.prototype.apply()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call),
this calls a function, but this lets you call into a function when you don't know whether the
function is expecting a callback or is going to return a Promise.  `fn` is the function you wish
to call.  Under the hood, if `fn.length` is equal to `args.length`, this will call `fn`
with the parameters provided, and then return the Promise (or wrap a returned value in a Promise).
If `fn.length` is `args.length + 1`, then a callback will be added.

If `cb` is provided, `apply` will call into `cb` with a result, otherwise `apply` will itself
return a Promise.

### pb.call(fn, thisArg[, arg1[, arg2[, ...]]))

This is the [`Function.prototype.call()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
equivalent of `apply()`.  Note that this always returns a Promise.  If you need a callback, use `callWithCb()`
instead.

Note that this is handy shortcut for promisifying a callback-based API:

```js
pb.call(done => fs.readFile(filename, {encoding: 'utf8'}, done))
.then(fileContents => ...);
```

### pb.callWithCb(fn, argumentCount, thisArg[, arg1[, arg2[, ...[, cb]]]])

Similar to `pb.call()`, but instead of returning a Promise this will call the provided callback.

### pb.withPromise(promiseImpl)

Returns a new `{make, break, addPromise, addCallback, apply, call, callWithCb}` object which uses the specified
promiseImpl constructor to create new Promises.

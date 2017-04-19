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

If you're using arrow functions or using commonjs exports, (and not using default parameters) it's even easier to use
promise-breaker to create functions that generate a Promise or accept a callback:

```js
// Both of these will take an optional `done`, and if not provided return a Promise.
exports.myPromiseFunc = pb.break(() => {
    return Promise.resolve("Hello World");
});

exports.myCbFunc = pb.make(done => {
    done(null, "Hello World");
});
```

The names `make()` and `break()` here come from the idea that you are making a callback into a promise, or breaking
a promise down into a callback.  As mentioned, the above does not work if you're using default parameters, as this
relies on the `length` of the passed in function, and default parameters do not count towards the `length`:

```js
export const myFunc = pb.break((x, y=10) => {
    return Promise.resolve("Hello World");
});

myFunc('a', 10); // This blows up!
```

Note this *does* work in coffee-script though, as coffee-script default parameters do count towards the `length`.

Here, this blows up because `pb.break` expects `myFunc` to take only one parameter, so it thinks 10 should be the
callback (which of course it can't be).


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

### pb.make(fn)

`make(fn)` takes a function which accepts a `callback(err, result)` as its last parameter, and
returns a new function which accepts an optional callback as its last parameter.  If a callback is
provided, this new function will behave exactly like the original function.  If the callback
is not provided, then the new function will return a Promise.

Since Promises only allow a single value to be returned, if `fn` passes more than two arguments to `callback(...)`,
then (as of v3.0.0) any arguments after the error will be transformed into an array and returned via the Promise as a
single combined argument.  This does not affect the case where the transformed function is called with a callback.
For example:

```js
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
```

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

```js
pb.callFn(function(done) {doSomething(x, y, z, done);})
.then(...)
```

to call into a callback based function from inside promise-based code.

### pb.call(fn, thisArg[, arg1[, arg2[, ...]]))

Similar to `callFn`, but since we don't know the `argumentCount`, we base it on the number of arguments passed.  This
always returns a Promise - if you want to use a callback, you need to use `callFn` instead.

### pb.withPromise(promiseImpl)

Returns a new `{make, break, applyFn, callFn}` object which uses the specified promiseImpl
constructor to create new Promises.

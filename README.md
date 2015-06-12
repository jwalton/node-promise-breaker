Helps you write libraries that accept both promises and callbacks, using which ever you prefer.

[![Build Status](https://travis-ci.org/jwalton/node-promise-breaker.svg)](https://travis-ci.org/jwalton/node-promise-breaker)

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

Or, if you don't want to set the global:

    promiseBreaker = require('promise-breaker');
    promiseBreaker.setPromise(require('es6-promise').Promise);

## Summary

Let's say you're writing a JavaScript library.  You know that some people are going to want
to use callbacks, and some people are going to want to use Promises.  You could write a lot
of code that looks like this:

```
exports.myFunc = function(done) {
    var p = new Promise( function(resolve, reject) {
        doStuff(function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result);
            }
            if(done) {
                done(err, result);
            }
        });
    });

    if(done) {
        return null;
    } else {
        return p;
    }
}
```

This is a pretty simple case, and that's already an awful lot of boilerplate.  'promise-breaker'
makes this really easy.  If you prefer writing in callback style:

```
// We're going to make some promises from callbacks
var pb = require('promise-breaker').make;

exports.myFunc = pb function(done) {
    done(null, "Hello World");
}
```

or if you prefer Promise style:


```
// We're going to break some promises down into callbacks
var pb = require('promise-breaker').break;

exports.myFunc = pb function() {
    Promise.resolve("Hello World");
}
```

No matter which approach you take, users of your library can now call `myFunc(done)`, or they
can call `myFunc().then(...)`.

## API

### pb.make(fn)

`make(fn)` takes a function which accepts a `callback(err, result)` as its last parameter, and
returns a new function which accepts an optional callback as its last paramater.  If a callback is
provided, this new function will behave exactly like the original function.  If the callback
is not provieded, then the new function will return a Promise.

### pb.break(fn)

`break(fn)` is the opposite of `make(fn)`.  `fn` here is a function which returns a Promise.
`break(fn)` will generate a new function with an extra parameter, an optional
`callback(err, result)`.  If no callback is provided, the generated function will behave exactly
like the original function.  If a callback is provided, then the generated function will return
`null`, and will pass any results that would have been returned via the Promise via the callback
instead.

# [5.0.0](https://github.com/jwalton/node-promise-breaker/compare/v4.1.13...v5.0.0) (2019-06-25)


* feat(Drop support for node v6 and node v8.): ([187b75d](https://github.com/jwalton/node-promise-breaker/commit/187b75d))


### BREAKING CHANGES

* Drop support for node v6 and node v8.

## [4.1.13](https://github.com/jwalton/node-promise-breaker/compare/v4.1.12...v4.1.13) (2018-11-29)


### Bug Fixes

* Fix typescript def for addPromise. ([fa4fb38](https://github.com/jwalton/node-promise-breaker/commit/fa4fb38))

## [4.1.12](https://github.com/jwalton/node-promise-breaker/compare/v4.1.11...v4.1.12) (2018-11-29)


### Bug Fixes

* Better typescript definitions. ([604b106](https://github.com/jwalton/node-promise-breaker/commit/604b106))

<a name="4.1.11"></a>
## [4.1.11](https://github.com/jwalton/node-promise-breaker/compare/v4.1.10...v4.1.11) (2018-05-07)


### Bug Fixes

* **typescript:** Add generic to `addPromise()`. ([de41bf2](https://github.com/jwalton/node-promise-breaker/commit/de41bf2))

v4.1.10
-------

* Add typescript support.

v4.1.4
------
* Remove accidental ES6.  :)

v4.1.3
------
* Support async/await functions.

v4.1.2
------
* Relaxed rules for `apply()`, `call()`, and friends.  These used to require a
  function that took exactly `n` arguments or `n+1` arguments (the Promise and
  the callback cases, respectively).  These functions now also accept
  functions with fewer parameters that return a Promise (possibly the function
  you're calling into doesn't care about some of the parameters you are
  passing).

v4.1.1
------
* Correctly handle exceptions from callbacks - convert into uncaught exceptions
  instead of unhandled rejections.

v4.1.0
------
* Added `callWithCb()`, `addPromise()`, and `addCallback()`.
* Added `args` parameter to `make()` and `break()`.
* Remove node v4 and v5 from the travis tests, so we can write tests in ES6 syntax.
* Convert tests to javascript, remove dev dependency on coffee-script.

v4.0.3
------
Roll back v4.0.2.  If someone passes in a strange function that relies on
`arguments`, then we'd throw an error fail in v4.0.0, but we do completely the
wrong thing in v4.0.2.

v4.0.2
------
Relax error conditions for `callFn()` and `applyFn()`.  If a function is passed
that takes too few parameters, we assume it is Promise based.

v4.0.0
------

* Add `call()` and `apply()`.
* Breaking Change - Previously, when using `pb.callFn()` or `pb.applyFn()`, if
  the called function returned a thenable, we would assume the function was
  Promise based, and would otherwise assume it was callback based.  This leads
  to a dangerous problem if you call a function that returns a scalar, though:

        let fn = (str) => "hello " + str;
        pb.callFn(fn, 1, null, "world")
        .then(result => expect(result).to.equal("hello world"));

  Here, `fn.length` is 1, and we're telling `callFn` we want to call an async
  function that takes 1 parameter, not including the callback.  If `fn`
  doesn't return a Promise here, the expected behavior would be to wrap the
  return value in a Promise and return it.  In v3.0.0, we would have assumed
  that since `fn` did not return a Promise, it must be callback based, so we
  would wait for the callback forever.  This is dangerous behavior.

  In v4.0.0, we now decide whether to treat `fn` as a Promise function or a
  callback function based on `fn.length`.  If you call `callFn` or `applyFn`,
  and tell it you are expecting a function that takes 1 parameter,
  promise-breaker will now throw an error if `fn` does not take 1 or 2
  parameters.

v3.0.0
------

* Breaking Change - When using `pb.make(fn)`,  if `fn` passes more than two
  arguments to its callback, then these arguments will be transformed into an
  array and passed to the Promise.  Previous versions would only ever return
  the first value passed to the callback.

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

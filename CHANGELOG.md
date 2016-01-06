v3.0.0
------

* Breaking Change - When using `pb.make(fn)`,  if `fn` passes more than two
  arguments to its callback, then these arguments will be transformed into an
  array and passed to the Promise.  Previous versions would only ever return
  the first value passed to the callback.

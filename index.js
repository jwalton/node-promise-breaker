(function (root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } /* istanbul ignore else */ else if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.promiseBreaker = {}));
    }
})(this, function (exports) {
    /* istanbul ignore next */
    var globals = global || window;

    /* Returns an array of `count` unique identifiers. */
    function makeParams(count) {
        var answer = [];
        for (var i = 0; i < count; i++) {
            answer.push('p' + i);
        }
        return answer;
    }

    /* Converts an array of parameter names into a comma delimited list. */
    function toList(params, extraParam, appendComma) {
        if (extraParam) {
            params = params.concat([extraParam]);
        }
        return params.join(', ') + (appendComma && params.length ? ',' : '');
    }

    /* Returns true if `fn` is a function/ */
    function isFunction(fn) {
        var str = Object.prototype.toString.call(fn);
        return (
            !!fn &&
            (typeof fn === 'object' || typeof fn === 'function') &&
            (str === '[object Function]' || str === '[object AsyncFunction]')
        );
    }

    function validatePromise(p) {
        if (!p) {
            throw new Error(
                'Promise is undefined. Define Promise as global variable or call withPromise()'
            );
        }
        if (!isFunction(p)) {
            throw new Error('Expect Promise to be a constructor');
        }
    }

    /* Note if `promiseImpl` is `null`, this will use globals.Promise. */
    exports.withPromise = function (promiseImpl) {
        // If a promise implementation is provided, we can validate it right away, and fail
        // earlier.  If not, we can't validate globals.Promise, since globals.Promise might
        // get polyfilled after promise-breaker is initialized.
        if (promiseImpl) {
            validatePromise(promiseImpl);
        }

        var pb = {};

        pb.make = function (options, asyncFn) {
            if (!asyncFn) {
                asyncFn = options;
                options = {};
            }

            if (!isFunction(asyncFn)) {
                throw new Error('Function required');
            }
            if (!promiseImpl) {
                validatePromise(globals.Promise);
            }

            var argumentCount = options.args || asyncFn.length;
            var args = makeParams(argumentCount - 1);

            var fn = new Function(
                ['asyncFn', 'Promise'],
                'return function(' +
                    toList(args, 'done') +
                    ') {\n' +
                    '    if(done) {\n' +
                    '        return asyncFn.call(this, ' +
                    toList(args, 'done') +
                    ');\n' +
                    '    } else {\n' +
                    '        var _this = this;\n' +
                    '        return new Promise(function(resolve, reject) {\n' +
                    '            asyncFn.call(_this, ' +
                    toList(args, null, true) +
                    ' function(err, result) {\n' +
                    '                if(err) {\n' +
                    '                    reject(err);\n' +
                    '                } else {\n' +
                    // If multiple arguments were passed to the callback, then turn them into an array.
                    '                    if(arguments.length > 2) {' +
                    '                        resolve([].slice.call(arguments, 1));' +
                    '                    } else {' +
                    '                        resolve(result);\n' +
                    '                    }' +
                    '                }\n' +
                    '            });\n' +
                    '        });\n' +
                    '    }\n' +
                    '};'
            );
            return fn(asyncFn, promiseImpl || globals.Promise);
        };

        pb['break'] = function (options, promiseFn) {
            if (!promiseFn) {
                promiseFn = options;
                options = {};
            }

            if (!isFunction(promiseFn)) {
                throw new Error('Function required');
            }

            var argumentCount = options.args || promiseFn.length;
            var args = makeParams(argumentCount);
            var params = ['this'].concat(args);

            var fn = new Function(
                ['promiseFn'],
                'return function(' +
                    toList(args, 'done') +
                    ') {\n' +
                    '    if(done) {\n' +
                    // Call `done()` inside `setTimeout()`, so that if `done` throws an error, it will
                    // be turned into an uncaught exception, instead of being swallowed by the Promise.
                    '        promiseFn.call(' +
                    toList(params) +
                    ').then(\n' +
                    '            function(result) {setTimeout(function() {done(null, result);}, 0);},\n' +
                    '            function(err) {setTimeout(function() {done(err);}, 0);}\n' +
                    '        );\n' +
                    '        return null;\n' +
                    '    } else {\n' +
                    '        return promiseFn.call(' +
                    toList(params) +
                    ');\n' +
                    '    }\n' +
                    '};'
            );
            return fn(promiseFn);
        };

        pb.addPromise = function (done, fn) {
            var answer = null;
            if (done) {
                fn(done);
            } else {
                answer = new Promise(function (resolve, reject) {
                    fn(function (err, result) {
                        if (err) {
                            reject(err);
                        } else if (arguments.length > 2) {
                            // If multiple arguments were passed to the callback, then turn them into an array.
                            resolve([].slice.call(arguments, 1));
                        } else {
                            resolve(result);
                        }
                    });
                });
            }
            return answer;
        };

        pb.addCallback = function (done, promise) {
            var answer;
            if (!promise) {
                throw new Error('addCallback() expected promise or function as second paramater');
            } else if (isFunction(promise.then)) {
                answer = promise;
            } else if (isFunction(promise)) {
                answer = Promise.resolve().then(function () {
                    return promise();
                });
            } else {
                throw new Error("addCallback() don't know what to do with " + typeof promise);
            }

            if (done) {
                // Call `done()` inside `setTimeout()`, so that if `done` throws an error, it will
                // be turned into an uncaught exception, instead of being swallowed by the Promise.
                answer.then(
                    function (result) {
                        setTimeout(function () {
                            done(null, result);
                        }, 0);
                    },
                    function (err) {
                        setTimeout(function () {
                            done(err);
                        }, 0);
                    }
                );
                answer = null;
            }

            return answer;
        };

        pb.applyFn = function (fn, argumentCount, thisArg, args, done) {
            argumentCount = argumentCount || 0;
            args = args || [];

            if (fn.length > argumentCount + 1) {
                return pb.addCallback(
                    done,
                    Promise.reject(
                        new Error(
                            'Expected function with ' +
                                argumentCount +
                                ' or fewer arguments which returns Promise, ' +
                                'or function with ' +
                                (argumentCount + 1) +
                                ' arguments which takes callback - got function with ' +
                                fn.length +
                                ' arguments.'
                        )
                    )
                );
            }

            return pb.addCallback(
                done,
                Promise.resolve().then(function () {
                    var isCallbackFn = argumentCount < fn.length;
                    var donePromise;

                    if (args.length < argumentCount || isCallbackFn) {
                        // Clone args
                        args = args.slice(0);

                        // Fill with undefineds.
                        while (args.length < argumentCount) {
                            args.push(undefined);
                        }

                        // Add a callback to `args` if required.
                        if (isCallbackFn) {
                            donePromise = new (promiseImpl || globals.Promise)(function (
                                resolve,
                                reject
                            ) {
                                // Pass in a callback.
                                args[argumentCount] = function (err, result) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve(result);
                                    }
                                };
                            });
                        }
                    }

                    var returnedPromise = fn.apply(thisArg, args);
                    return donePromise || returnedPromise;
                })
            );
        };

        pb.apply = function (fn, thisArg, args, done) {
            args = args || [];
            return pb.applyFn(fn, args.length, thisArg, args, done);
        };

        pb.callFn = function (fn, argumentCount, thisArg) {
            argumentCount = argumentCount || 0;

            var maxArgumentsToFetch = Math.min(arguments.length - 3, argumentCount);
            var args = [];
            if (maxArgumentsToFetch > 0) {
                args = [].slice.call(arguments, 3, 3 + maxArgumentsToFetch);
            }

            // Fetch `done` if it's there.
            var done = arguments[3 + argumentCount];

            return pb.applyFn(fn, argumentCount, thisArg, args, done);
        };

        pb.call = function (fn, thisArg) {
            var args = [].slice.call(arguments, 2);
            return pb.applyFn(fn, args.length, thisArg, args);
        };

        pb.callWithCb = function (fn, thisArg) {
            var args = [].slice.call(arguments, 2, arguments.length - 1);
            var done = arguments[arguments.length - 1];
            if (!isFunction(done)) {
                throw new Error('callWithCb requires function as last parameter.');
            }
            return pb.applyFn(fn, args.length, thisArg, args, done);
        };

        return pb;
    };

    exports.default = exports.withPromise();
    for (var k in exports.default) {
        /* istanbul ignore else */
        if ({}.hasOwnProperty.call(exports.default, k)) {
            exports[k] = exports.default[k];
        }
    }

    exports.usingDefaultPromise = exports.default;
});

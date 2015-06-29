(function (root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else /* istanbul ignore else */ if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.promiseBreaker = {}));
    }
}(this, function (exports) {
    /* istanbul ignore next */
    var globals = global || window;

    /* Note if `promiseImpl` is `null`, this will use globals.Promise. */
    exports.withPromise = function(promiseImpl) {
        answer = {}

        answer.make = function(asyncFn) {
            var args = makeParams(asyncFn.length - 1);

            var fn = new Function(['asyncFn', 'Promise'],
                'return function(' + toList(args, 'done') + ') {\n' +
                '    if(done) {\n' +
                '        return asyncFn.call(this, ' + toList(args, 'done') + ');\n' +
                '    } else {\n' +
                '        var _this = this;\n' +
                '        return new Promise(function(resolve, reject) {\n' +
                '            asyncFn.call(_this, ' + toList(args, '') + ' function(err, result) {\n' +
                '                if(err) {\n' +
                '                    reject(err);\n' +
                '                } else {\n' +
                '                    resolve(result);\n' +
                '                }\n' +
                '            });\n' +
                '        });\n' +
                '    }\n' +
                '};'
            );
            return fn(asyncFn, promiseImpl || globals.Promise);
        };

        answer['break'] = function(promiseFn) {
            var args = makeParams(promiseFn.length);
            var params = ['this'].concat(args);

            var fn = new Function(['promiseFn'],
                'return function(' + toList(args, 'done') + ') {\n' +
                '    if(done) {\n' +
                '        promiseFn.call(' + toList(params) + ').then(\n' +
                '            function(result) {done(null, result);},\n' +
                '            function(err) {done(err);}\n' +
                '        );\n' +
                '        return null;\n' +
                '    } else {\n' +
                '        return promiseFn.call(' + toList(params) + ');\n' +
                '    }\n' +
                '};'
            );
            return fn(promiseFn);
        };

        answer.applyFn = answer['break'](function(fn, argumentCount, thisArg, args) {
            var complete = false;

            // Clone args
            if(!args) {args = [];}
            args = args.slice(0);
            while(args.length < argumentCount) {
                args.push(null);
            }

            var donePromise = new (promiseImpl || globals.Promise)(function(resolve, reject) {
                // Pass in a callback.
                args[argumentCount] = function(err, result) {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
            });

            var returnedPromise = fn.apply(thisArg, args);
            if(returnedPromise && returnedPromise.then) {
                return returnedPromise;
            } else {
                return donePromise;
            }

        });

        answer.callFn = function() {
            var fn = arguments[0];
            var argumentCount = arguments[1];
            var thisArg = arguments[2];

            var maxArgumentsToFetch = Math.min(arguments.length - 3, argumentCount);
            var args = [];
            if(maxArgumentsToFetch > 0) {
                args = [].slice.call(arguments, 3, 3 + maxArgumentsToFetch)
            }

            // Fetch `done` if it's there.
            done = arguments[3 + argumentCount];

            return answer.applyFn(fn, argumentCount, thisArg, args, done);
        };

        return answer;
    }

    usingDefaultPromise = exports.withPromise();
    exports.make = usingDefaultPromise.make;
    exports['break'] = usingDefaultPromise['break'];
    exports.applyFn = usingDefaultPromise.applyFn;
    exports.callFn = usingDefaultPromise.callFn;

    function makeParams(count) {
        var answer = [];
        for(var i = 0; i < count; i++) {
            answer.push('p' + i);
        }
        return answer;
    }

    function toList(params, extraParam) {
        if(extraParam != null) {
            params = params.concat([extraParam]);
        }
        return params.join(", ");

    }

}));

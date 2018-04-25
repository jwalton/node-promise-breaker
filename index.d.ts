// Global variable exported in browsers.
export as namespace promiseBreaker;

interface MakeBreakOptions {
    args?: number;
}

interface PromiseBreakerInstance {
    make(options: MakeBreakOptions, asyncFn: Function): Function;
    make(asyncFn: Function): Function;
    break(options: MakeBreakOptions, promiseFn: Function): Function;
    break(promiseFn: Function): Function;

    addPromise(done: Function | undefined | null, asyncFn: Function): Promise<any> | null;

    addCallback<T>(
        done: Function | undefined | null,
        promise: (() => Promise<T>) | Promise<T>
    ): Promise<T> | null;

    apply(fn: Function, thisArg?: any, args?: any[] | undefined) : Promise<any>;
    apply(fn: Function, thisArg: any, args: any[] | undefined, done: Function) : void;
    call(fn: Function, thisArg?: any, ...parameters: any[]) : Promise<any>;
    callWithCb(fn: Function, thisArg: any, ...parametersAndCallback: any[]): void;
}

interface PromiseBreaker extends PromiseBreakerInstance {
    withPromise(promiseImpl: PromiseConstructor) : PromiseBreaker;
}

declare const usingDefaultPromise: PromiseBreaker;
export = usingDefaultPromise;

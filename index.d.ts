// Global variable exported in browsers.
export as namespace promiseBreaker;

declare namespace PromiseBreaker {
    interface MakeBreakOptions {
        args?: number;
    }

    type Callback<R = any> = (err: Error | null | undefined, result?: R) => void;

    interface BrokenFn0<R> {
        (): Promise<R>;
        (cb: Callback<R>): void;
    }

    interface BrokenFn1<T1, R> {
        (p1: T1): Promise<R>;
        (p1: T1, cb: Callback<R>): void;
    }

    interface BrokenFn2<T1, T2, R> {
        (p1: T1, p2: T2): Promise<R>;
        (p1: T1, p2: T2, cb: Callback<R>): void;
    }

    interface BrokenFn3<T1, T2, T3, R> {
        (p1: T1, p2: T2, p3: T3): Promise<R>;
        (p1: T1, p2: T2, p3: T3, cb: Callback<R>): void;
    }

    interface PromiseBreakerInstance {
        make<R>(options: MakeBreakOptions, asyncFn: (cb: Callback<R>) => void): BrokenFn0<R>;
        make<T1, R>(
            options: MakeBreakOptions,
            asyncFn: (p1: T1, cb: Callback<R>) => void
        ): BrokenFn1<T1, R>;
        make<T1, T2, R>(
            options: MakeBreakOptions,
            asyncFn: (p1: T1, p2: T2, cb: Callback<R>) => void
        ): BrokenFn2<T1, T2, R>;
        make<T1, T2, T3, R>(
            options: MakeBreakOptions,
            asyncFn: (p1: T1, p2: T2, p3: T3, cb: Callback<R>) => void
        ): BrokenFn3<T1, T2, T3, R>;
        make<R = any>(
            options: MakeBreakOptions,
            asyncFn: (...args: any[]) => any
        ): (...args: any[]) => Promise<R>;

        make<R>(asyncFn: (cb: Callback<R>) => void): BrokenFn0<R>;
        make<T1, R>(asyncFn: (p1: T1, cb: Callback<R>) => void): BrokenFn1<T1, R>;
        make<T1, T2, R>(asyncFn: (p1: T1, p2: T2, cb: Callback<R>) => void): BrokenFn2<T1, T2, R>;
        make<T1, T2, T3, R>(
            asyncFn: (p1: T1, p2: T2, p3: T3, cb: Callback<R>) => void
        ): BrokenFn3<T1, T2, T3, R>;
        make<R = any>(asyncFn: (...args: any[]) => any): (...args: any[]) => Promise<R>;

        break<R>(options: MakeBreakOptions, promiseFn: () => PromiseLike<R>): BrokenFn0<R>;
        break<T1, R>(
            options: MakeBreakOptions,
            promiseFn: (p1: T1) => PromiseLike<R>
        ): BrokenFn1<T1, R>;
        break<T1, T2, R>(
            options: MakeBreakOptions,
            promiseFn: (p1: T1, p2: T2) => PromiseLike<R>
        ): BrokenFn2<T1, T2, R>;
        break<T1, T2, T3, R>(
            options: MakeBreakOptions,
            promiseFn: (p1: T1, p2: T2, p3: T3) => PromiseLike<R>
        ): BrokenFn3<T1, T2, T3, R>;
        break<R = any>(
            options: MakeBreakOptions,
            promiseFn: (...args: any[]) => any
        ): (...args: any[]) => Promise<R>;

        break<R>(promiseFn: () => PromiseLike<R>): BrokenFn0<R>;
        break<T1, R>(promiseFn: (p1: T1) => PromiseLike<R>): BrokenFn1<T1, R>;
        break<T1, T2, R>(promiseFn: (p1: T1, p2: T2) => PromiseLike<R>): BrokenFn2<T1, T2, R>;
        break<T1, T2, T3, R>(
            promiseFn: (p1: T1, p2: T2, p3: T3) => PromiseLike<R>
        ): BrokenFn3<T1, T2, T3, R>;
        break<R = any>(promiseFn: (...args: any[]) => any): (...args: any[]) => Promise<R>;

        addPromise<R>(
            done: Callback<R> | undefined | null,
            asyncFn: (cb: Callback<R>) => void
        ): Promise<R>;

        addCallback<R>(
            done: Callback<R> | undefined | null,
            promise: (() => Promise<R>) | (() => R) | Promise<R>
        ): Promise<R>;

        apply(fn: Function, thisArg?: any, args?: any[] | undefined): Promise<any>;
        apply(fn: Function, thisArg: any, args: any[] | undefined, done: Function): void;
        call(fn: Function, thisArg?: any, ...parameters: any[]): Promise<any>;
        callWithCb(fn: Function, thisArg: any, ...parametersAndCallback: any[]): void;
    }

    interface PromiseBreaker extends PromiseBreakerInstance {
        withPromise(promiseImpl: PromiseConstructor): PromiseBreaker;
    }
}

declare const PromiseBreaker: PromiseBreaker.PromiseBreaker;
export = PromiseBreaker;

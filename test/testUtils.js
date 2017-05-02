exports.expectUncaughtException = function(fn) {
    // Remove mocha's uncaughtException handler.
    const originalListeners = process.listeners('uncaughtException');
    originalListeners.forEach(listener => process.removeListener('uncaughtException', listener));

    return new Promise(resolve => {
        process.once('uncaughtException', resolve);
        fn();
    })
    .then(() => {
        originalListeners.forEach(listener => process.on('uncaughtException', listener))
    });
}

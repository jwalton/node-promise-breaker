require('es6-promise').polyfill();

process.on('unhandledRejection', err =>
    console.error("Potentially Unhandled Rejection", err.stack)
);

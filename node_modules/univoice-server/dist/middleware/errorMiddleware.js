"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    console.error(`[Error] ${err.message || err}`);
    if (err.stack) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};
exports.errorHandler = errorHandler;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof Error) {
        return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
};
exports.errorHandler = errorHandler;

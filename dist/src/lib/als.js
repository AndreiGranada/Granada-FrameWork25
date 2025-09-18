"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithContext = runWithContext;
exports.getContext = getContext;
exports.getCorrelationId = getCorrelationId;
const async_hooks_1 = require("async_hooks");
const storage = new async_hooks_1.AsyncLocalStorage();
function runWithContext(ctx, fn) {
    storage.run(ctx, fn);
}
function getContext() {
    return storage.getStore();
}
function getCorrelationId() {
    var _a;
    return (_a = storage.getStore()) === null || _a === void 0 ? void 0 : _a.correlationId;
}

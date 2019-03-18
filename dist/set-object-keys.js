"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var recursive_iterator_1 = __importDefault(require("recursive-iterator"));
function setObjectKeys(obj, cachePath) {
    for (var _i = 0, _a = Array.from(new recursive_iterator_1.default(obj)); _i < _a.length; _i++) {
        var _b = _a[_i], path = _b.path, node = _b.node;
        if (typeof node === 'object') {
            node['__mapixCachePath'] = { cachePath: cachePath, path: path };
        }
    }
    obj['__mapixCachePath'] = { cachePath: cachePath, path: [] };
}
exports.setObjectKeys = setObjectKeys;
function setObjectValue(object, paths, value, pathIndex) {
    if (pathIndex === void 0) { pathIndex = 0; }
    var _a;
    if (pathIndex === paths.length) {
        return __assign({}, object, value);
    }
    var path = paths[pathIndex];
    return __assign({}, object, (_a = {}, _a[path] = setObjectValue(object[path], paths, value, pathIndex + 1), _a));
}
exports.setObjectValue = setObjectValue;

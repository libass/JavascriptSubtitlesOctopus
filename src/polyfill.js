if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
        if (pos === undefined) {
            pos = 0;
        }
        return this.substring(pos, search.length) === search;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, this_len) {
        if (this_len === undefined || this_len > this.length) {
            this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
    };
}

if (!String.prototype.includes) {
    String.prototype.includes = function (search, pos) {
        return this.indexOf(search, pos) !== -1;
    };
}

if (!ArrayBuffer.isView) {
    var typedArrays = [
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array
    ];

    ArrayBuffer.isView = function (obj) {
        return obj && obj.constructor && typedArrays.indexOf(obj.constructor) !== -1;
    };
}

if (!Int8Array.prototype.slice) {
    Object.defineProperty(Int8Array.prototype, 'slice', {
        value: function (begin, end)
            {
                return new Int8Array(this.subarray(begin, end));
            }
    });
}

if (!Uint8Array.prototype.slice) {
    Object.defineProperty(Uint8Array.prototype, 'slice', {
        value: function (begin, end)
            {
                return new Uint8Array(this.subarray(begin, end));
            }
    });
}

if (!Int16Array.from) {
    // Doesn't work for String
    Int16Array.from = function (source) {
        var arr = new Int16Array(source.length);
        arr.set(source, 0);
        return arr;
    };
}

if (!Int32Array.from) {
    // Doesn't work for String
    Int32Array.from = function (source) {
        var arr = new Int32Array(source.length);
        arr.set(source, 0);
        return arr;
    };
}

// performance.now() polyfill
if ("performance" in self === false) {
    self.performance = {};
}
Date.now = (Date.now || function () {
    return new Date().getTime();
});
if ("now" in self.performance === false) {
    var nowOffset = Date.now();
    if (performance.timing && performance.timing.navigationStart) {
        nowOffset = performance.timing.navigationStart
    }
    self.performance.now = function now() {
        return Date.now() - nowOffset;
    }
}

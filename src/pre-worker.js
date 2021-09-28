if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}

if (!Uint8Array.prototype.slice) {
    Object.defineProperty(Uint8Array.prototype, 'slice', {
        value: function (begin, end)
            {
                return new Uint8Array(this.subarray(begin, end));
            }
    });
}


var hasNativeConsole = typeof console !== "undefined";

// implement console methods if they're missing
function makeCustomConsole() {
    var console = (function () {
        function postConsoleMessage(prefix, args) {
            postMessage({
                target: "console-" + prefix,
                content: JSON.stringify(Array.prototype.slice.call(args)),
            })
        }

        return {
            log: function() {
                postConsoleMessage("log", arguments);
            },
            debug: function() {
                postConsoleMessage("debug", arguments);
            },
            info: function() {
                postConsoleMessage("info", arguments);
            },
            warn: function() {
                postConsoleMessage("warn", arguments);
            },
            error: function() {
                postConsoleMessage("error", arguments);
            }
        }
    })();

    return console;
}

Module = Module || {};

Module["preRun"] = Module["preRun"] || [];

Module["preRun"].push(function () {
    var i;

    Module["FS_createPath"]("/", "fonts", true, true);

    if (!self.subContent) {
        // We can use sync xhr cause we're inside Web Worker
        if (self.subUrl.endsWith(".br")) {
            self.subContent = Module["BrotliDecode"](readBinary(self.subUrl))
        } else {
            self.subContent = read_(self.subUrl);
        }
    }

    if (self.availableFonts && self.availableFonts.length !== 0) {
        var sections = parseAss(self.subContent);
            for (var i = 0; i < sections.length; i++) {
                for (var j = 0; j < sections[i].body.length; j++) {
                    if (sections[i].body[j].key === 'Style') {
                        self.writeFontToFS(sections[i].body[j].value['Fontname']);
                    }
                }
            }

            var regex = /\\fn([^\\}]*?)[\\}]/g;
            var matches;
            while (matches = regex.exec(self.subContent)) {
                self.writeFontToFS(matches[1]);
            }
        }

    if (self.subContent) {
        Module["FS"].writeFile("/sub.ass", self.subContent);
    }

    self.subContent = null;

    //Module["FS"].mount(Module["FS"].filesystems.IDBFS, {}, '/fonts');
    var fontFiles = self.fontFiles || [];
    for (i = 0; i < fontFiles.length; i++) {
        Module["FS_createPreloadedFile"]("/fonts", 'font' + i + '-' + fontFiles[i].split('/').pop(), fontFiles[i], true, true);
    }
});

Module['onRuntimeInitialized'] = function () {
    self.octObj = new Module.SubtitleOctopus();

    self.changed = Module._malloc(4);
    self.blendTime = Module._malloc(8);
    self.blendX = Module._malloc(4);
    self.blendY = Module._malloc(4);
    self.blendW = Module._malloc(4);
    self.blendH = Module._malloc(4);

    self.octObj.initLibrary(screen.width, screen.height);
    self.octObj.createTrack("/sub.ass");
    self.ass_track = self.octObj.track;
    self.ass_library = self.octObj.ass_library;
    self.ass_renderer = self.octObj.ass_renderer;

    if (self.libassMemoryLimit > 0 || self.libassGlyphLimit > 0) {
        self.octObj.setMemoryLimits(self.libassGlyphLimit, self.libassMemoryLimit);
    }
};

Module["print"] = function (text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.log(text);
};
Module["printErr"] = function (text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.error(text);
};

// Modified from https://github.com/kripken/emscripten/blob/6dc4ac5f9e4d8484e273e4dcc554f809738cedd6/src/proxyWorker.js
if (!hasNativeConsole) {
    // we can't call Module.printErr because that might be circular
    var console = {
        log: function (x) {
            if (typeof dump === 'function') dump('log: ' + x + '\n');
        },
        debug: function (x) {
            if (typeof dump === 'function') dump('debug: ' + x + '\n');
        },
        info: function (x) {
            if (typeof dump === 'function') dump('info: ' + x + '\n');
        },
        warn: function (x) {
            if (typeof dump === 'function') dump('warn: ' + x + '\n');
        },
        error: function (x) {
            if (typeof dump === 'function') dump('error: ' + x + '\n');
        },
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

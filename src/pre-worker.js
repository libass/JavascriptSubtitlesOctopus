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


const hasNativeConsole = typeof console !== "undefined";

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
            log: function () {
                postConsoleMessage("log", arguments);
            },
            debug: function () {
                postConsoleMessage("debug", arguments);
            },
            info: function () {
                postConsoleMessage("info", arguments);
            },
            warn: function () {
                postConsoleMessage("warn", arguments);
            },
            error: function () {
                postConsoleMessage("error", arguments);
            }
        }
    })();

    return console;
}

Module = Module || {};

Module["preRun"] = Module["preRun"] || [];

Module["preRun"].push(function () {
    let i;
    Module["FS_createFolder"]("/", "fonts", true, true);
    Module["FS_createFolder"]("/", ".fontconfig", true, true);

    if (!self.subContent) {
        // We can use sync xhr cause we're inside Web Worker
        self.subContent = read_(self.subUrl);
    }

    let result;
    {
        const regex = new RegExp('^fontname((v2:[ \t]*(?<fontName2>[^_]+)_(?<fontProperties2>[^,]*)\.(?<fontExtension2>[a-z0-9]{3,5}),[ \t]*(?<fontContent2>.+)$)|(:[ \t]*(?<fontName>[^_]+)_(?<fontProperties>[^$]*)\.(?<fontExtension>[a-z0-9]{3,5})(?<fontContent>(?:\r?\n[\x21-\x60]+)+)))', 'mg');
        while((result = regex.exec(self.subContent)) !== null){
            let font;
            if("fontName2" in result.groups && result.groups.fontName2 !== undefined){
                font = {
                    content: self.readDataUri(result.groups.fontContent2),
                    id: result.groups.fontName2,
                    name: result.groups.fontName2 + "." + result.groups.fontExtension2
                }
            }else{
                font = {
                    content: self.decodeASSFontEncoding(result.groups.fontContent),
                    id: result.groups.fontName2,
                    name: result.groups.fontName + "." + result.groups.fontExtension
                }
            }

            self.fontMap_[font.id] = true;
            Module["FS"].writeFile('/fonts/font' + (self.fontId++) + '-' + font.name, font.content, {
                encoding: 'binary'
            });
            console.log("libass: attaching embedded font " + font.name);
        }
    }

    if ((self.availableFonts && self.availableFonts.length !== 0)) {
        const sections = parseAss(self.subContent);
        for (i = 0; i < sections.length; i++) {
            for (let j = 0; j < sections[i].body.length; j++) {
                if (sections[i].body[j].key === 'Style') {
                    self.writeFontToFS(sections[i].body[j].value['Fontname']);
                }
            }
        }

        const regex = /\\fn([^\\}]*?)[\\}]/g;
        let matches;
        while (matches = regex.exec(self.subContent)) {
            self.writeFontToFS(matches[1]);
        }
    }

    if (self.subContent) {
        Module["FS"].writeFile("/sub.ass", self.subContent);
    }

    self.subContent = null;

    Module["FS_createLazyFile"]("/fonts", ".fallback-" + self.fallbackFont.split('/').pop(), self.fallbackFont, true, false);

    //Module["FS"].mount(Module["FS"].filesystems.IDBFS, {}, '/fonts');
    const fontFiles = self.fontFiles || [];
    for (i = 0; i < fontFiles.length; i++) {
        Module["FS_createLazyFile"]("/fonts", 'font' + i + '-' + fontFiles[i].split('/').pop(), fontFiles[i], true, false);
    }
});

Module['onRuntimeInitialized'] = function () {
    self.octObj = new Module.SubtitleOctopus();

    self.changed = Module._malloc(4);

    if(self.debug){
        self.octObj.setLogLevel(7);
    }
    self.octObj.initLibrary(screen.width, screen.height, "/fonts/.fallback-" + self.fallbackFont.split('/').pop());
    self.octObj.setDropAnimations(!!self.dropAllAnimations);
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
    let nowOffset = Date.now();
    if (performance.timing && performance.timing.navigationStart) {
        nowOffset = performance.timing.navigationStart
    }
    self.performance.now = function now() {
        return Date.now() - nowOffset;
    }
}

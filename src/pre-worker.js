var Module = Module || {};

self.window = self;
//var self = {};

Module["preRun"] = Module["preRun"] || [];

Module["preRun"].push(function () {
    var i;

    if (self.availableFonts) {
        if (!self.subContent) {
            // We can use sync xhr cause we're inside Web Worker
            self.subContent = Module["read"](self.subUrl);
        }
        // TODO: It's better to check "Format:" before parsing styles because "Fontname" can be at different place
        var regex1 = /\nStyle: [^,]*?,([^,]*?),/ig;
        var regex2 = /\\fn([^\\}]*?)[\\}]/g;
        var fontsInSub = {};
        var font;
        var matches;
        while ((matches = regex1.exec(self.subContent)) || (matches = regex2.exec(self.subContent))) {
            font = matches[1].trim().toLowerCase();
            if (!(font in fontsInSub)) {
                fontsInSub[font] = true;
                if (font in self.availableFonts) {
                    self.fonts.push(self.availableFonts[font]);
                }
            }
        }
    }

    if (self.subContent) {
        Module["FS"].writeFile("/sub.ass", self.subContent);
    }
    else {
        Module["FS_createPreloadedFile"]("/", "sub.ass", self.subUrl, true, false, null, Module["printErr"]);
    }
    self.subContent = null;

    Module["FS_createFolder"]("/", "fonts", true, true);
    //Module["FS"].mount(Module["FS"].filesystems.IDBFS, {}, '/fonts');
    fonts = self.fonts || [];
    for (i = 0; i < fonts.length; i++) {
        Module["FS_createPreloadedFile"]("/fonts", 'font' + i + '-' + fonts[i].split('/').pop(), fonts[i], true, true);
    }
});

Module['onRuntimeInitialized'] = function () {
    self.init = Module['cwrap']('libassjs_init', 'number', ['number', 'number']);
    self._resize = Module['cwrap']('libassjs_resize', null, ['number', 'number']);
    self._render = Module['cwrap']('libassjs_render', null, ['number', 'number']);
    self.quit = Module['cwrap']('libassjs_quit', null, []);
    self.changed = Module._malloc(4);

    self.init(screen.width, screen.height);
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
if (typeof console === 'undefined') {
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
if ("performance" in window === false) {
    window.performance = {};
}
Date.now = (Date.now || function () {
    return new Date().getTime();
});
if ("now" in window.performance === false) {
    var nowOffset = Date.now();
    if (performance.timing && performance.timing.navigationStart) {
        nowOffset = performance.timing.navigationStart
    }
    window.performance.now = function now() {
        return Date.now() - nowOffset;
    }
}
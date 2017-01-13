var Module = Module || {};

var self = {};

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
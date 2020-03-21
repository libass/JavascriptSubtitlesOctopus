Module['FS'] = FS;

self.delay = 0; // approximate delay (time of render + postMessage + drawImage), for example 1/60 or 0
self.lastCurrentTime = 0;
self.rate = 1;
self.rafId = null;
self.nextIsRaf = false;
self.lastCurrentTimeReceivedAt = Date.now();
self.targetFps = 30;

self.width = 0;
self.height = 0;

self.fontMap_ = {};
self.fontId = 0;

/**
 * Make the font accessible by libass by writing it to the virtual FS.
 * @param {!string} font the font name.
 */
self.writeFontToFS = function(font) {
    font = font.trim().toLowerCase();
    
    if (font.startsWith("@")) {
        font = font.substr(1);
    }
    
    if (self.fontMap_.hasOwnProperty(font)) return;

    self.fontMap_[font] = true;

    if (!self.availableFonts.hasOwnProperty(font)) return;
    var content = readBinary(self.availableFonts[font]);

    Module["FS"].writeFile('/fonts/font' + (self.fontId++) + '-' + self.availableFonts[font].split('/').pop(), content, { 
        encoding: 'binary'
    });
};

/**
 * Write all font's mentioned in the .ass file to the virtual FS.
 * @param {!string} content the file content.
 */
self.writeAvailableFontsToFS = function(content) {
    if (!self.availableFonts) return;

    var sections = parseAss(content);

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
};

/**
 * Set the subtitle track.
 * @param {!string} content the content of the subtitle file.
 */
self.setTrack = function (content) {
    // Make sure that the fonts are loaded
    self.writeAvailableFontsToFS(content);

    // Write the subtitle file to the virtual FS.
    Module["FS"].writeFile("/sub.ass", content);

    // Tell libass to render the new track
    self._create_track("/sub.ass");
    if (self.fastRenderMode) {
        self.fastRender();
    } else {
        self.render();
    }
};

/**
 * Remove subtitle track.
 */
self.freeTrack = function () {
    self._free_track();
    if (self.fastRenderMode) {
        self.fastRender();
    } else {
        self.render();
    }
};

/**
 * Set the subtitle track.
 * @param {!string} url the URL of the subtitle file.
 */
self.setTrackByUrl = function (url) {
    var content = "";
    if (url.endsWith(".br")) {
        content = Module["BrotliDecode"](readBinary(url))
    } else {
        content = read_(url);
    }
    self.setTrack(content);
};

self.resize = function (width, height) {
    self.width = width;
    self.height = height;
    self._resize(width, height);
};

self.getCurrentTime = function () {
    var diff = (Date.now() - self.lastCurrentTimeReceivedAt) / 1000;
    if (self._isPaused) {
        return self.lastCurrentTime;
    }
    else {
        if (diff > 5) {
            console.error('Didn\'t received currentTime > 5 seconds. Assuming video was paused.');
            self.setIsPaused(true);
        }
        return self.lastCurrentTime + (diff * self.rate);
    }
};
self.setCurrentTime = function (currentTime) {
    self.lastCurrentTime = currentTime;
    self.lastCurrentTimeReceivedAt = Date.now();
    if (!self.rafId) {
        if (self.nextIsRaf) {
            if (self.fastRenderMode) {
                self.rafId = self.requestAnimationFrame(self.fastRender);
            } else {
                self.rafId = self.requestAnimationFrame(self.render);
            }
        }
        else {
            if (self.fastRenderMode) {
                self.fastRender();
            } else {
                self.render();
            }
            
            // Give onmessage chance to receive all queued messages
            setTimeout(function () {
                self.nextIsRaf = false;
            }, 20);
        }
    }
};

self._isPaused = true;
self.getIsPaused = function () {
    return self._isPaused;
};
self.setIsPaused = function (isPaused) {
    if (isPaused != self._isPaused) {
        self._isPaused = isPaused;
        if (isPaused) {
            if (self.rafId) {
                clearTimeout(self.rafId);
                self.rafId = null;
            }
        }
        else {
            self.lastCurrentTimeReceivedAt = Date.now();
            if (self.fastRenderMode) {
                self.rafId = self.requestAnimationFrame(self.fastRender);
            } else {
                self.rafId = self.requestAnimationFrame(self.render);
            }
            
        }
    }
};

self.render = function (force) {
    self.rafId = 0;
    self.renderPending = false;
    var startTime = performance.now();
    var renderResult = self._render(self.getCurrentTime() + self.delay, self.changed);
    var changed = Module.getValue(self.changed, 'i32');
    if (changed != 0 || force) {
        var result = self.buildResult(renderResult);
        var spentTime = performance.now() - startTime;
        postMessage({
            target: 'canvas',
            op: 'renderCanvas',
            time: Date.now(),
            spentTime: spentTime,
            canvases: result[0]
        }, result[1]);
    }

    if (!self._isPaused) {
        self.rafId = self.requestAnimationFrame(self.render);
    }
};

self.fastRender = function (force) {
    self.rafId = 0;
    self.renderPending = false;
    var startTime = performance.now();
    var renderResult = self._render(self.getCurrentTime() + self.delay, self.changed);
    var changed = Module.getValue(self.changed, "i32");
    if (changed != 0 || force) {
        var result = self.buildResult(renderResult);
        var newTime = performance.now();
        var libassTime = newTime - startTime;
        var promises = [];
        for (var i = 0; i < result[0].length; i++) {
            var image = result[0][i];
            var imageBuffer = new Uint8ClampedArray(image.buffer);
            var imageData = new ImageData(imageBuffer, image.w, image.h);
            promises[i] = createImageBitmap(imageData, 0, 0, image.w, image.h);
        }
        Promise.all(promises).then(function (imgs) {
            var decodeTime = performance.now() - newTime;
            var bitmaps = [];
            for (var i = 0; i < imgs.length; i++) {
                var image = result[0][i];
                bitmaps[i] = { x: image.x, y: image.y, bitmap: imgs[i] };
            }
            postMessage({
                target: "canvas",
                op: "renderFastCanvas",
                time: Date.now(),
                libassTime: libassTime,
                decodeTime: decodeTime,
                bitmaps: bitmaps
            }, imgs);
        });
    }
    if (!self._isPaused) {
        self.rafId = self.requestAnimationFrame(self.fastRender);
    }
};

self.buildResult = function (ptr) {
    var items = [];
    var transferable = [];
    var item;

    while (ptr != 0) {
        item = self.buildResultItem(ptr);
        if (item !== null) {
            items.push(item);
            transferable.push(item.buffer);
        }
        ptr = Module.getValue(ptr + 28, '*');
    }

    return [items, transferable];
};

self.buildResultItem = function (ptr) {
    var bitmap = Module.getValue(ptr + 12, '*'),
        stride = Module.getValue(ptr + 8, 'i32'),
        w = Module.getValue(ptr + 0, 'i32'),
        h = Module.getValue(ptr + 4, 'i32'),
        color = Module.getValue(ptr + 16, 'i32');

    if (w == 0 || h == 0) {
        return null;
    }

    var r = (color >> 24) & 0xFF,
        g = (color >> 16) & 0xFF,
        b = (color >> 8) & 0xFF,
        a = 255 - (color & 0xFF);

    var result = new Uint8ClampedArray(4 * w * h);

    var bitmapPosition = 0;
    var resultPosition = 0;

    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var k = Module.HEAPU8[bitmap + bitmapPosition + x] * a / 255;
            result[resultPosition] = r;
            result[resultPosition + 1] = g;
            result[resultPosition + 2] = b;
            result[resultPosition + 3] = k;
            resultPosition += 4;
        }
        bitmapPosition += stride;
    }

    x = Module.getValue(ptr + 20, 'i32');
    y = Module.getValue(ptr + 24, 'i32');

    return {w: w, h: h, x: x, y: y, buffer: result.buffer};
};

if (typeof SDL !== 'undefined') {
    SDL.defaults.copyOnLock = false;
    SDL.defaults.discardOnLock = false;
    SDL.defaults.opaqueFrontBuffer = false;
}

function FPSTracker(text) {
    var last = 0;
    var mean = 0;
    var counter = 0;
    this.tick = function () {
        var now = Date.now();
        if (last > 0) {
            var diff = now - last;
            mean = 0.99 * mean + 0.01 * diff;
            if (counter++ === 60) {
                counter = 0;
                dump(text + ' fps: ' + (1000 / mean).toFixed(2) + '\n');
            }
        }
        last = now;
    }
}

/**
 * Parse the content of an .ass file.
 * @param {!string} content the content of the file
 */
function parseAss(content) {
    var m, format, lastPart, parts, key, value, tmp, i, j, body;
    var sections = [];
    var lines = content.split(/[\r\n]+/g);
    for (i = 0; i < lines.length; i++) {
        m = lines[i].match(/^\[(.*)\]$/);
        if (m) {
            format = null;
            sections.push({
                name: m[1],
                body: []
            });
        } else {
            if (/^\s*$/.test(lines[i])) continue;
            if (sections.length === 0) continue;
            body = sections[sections.length - 1].body;
            if (lines[i][0] === ';') {
                body.push({
                    type: 'comment',
                    value: lines[i].substring(1)
                });
            } else {
                parts = lines[i].split(":");
                key = parts[0];
                value = parts.slice(1).join(':').trim();
                if (format || key === 'Format') {
                    value = value.split(',');
                    if (format && value.length > format.length) {
                        lastPart = value.slice(format.length - 1).join(',');
                        value = value.slice(0, format.length - 1);
                        value.push(lastPart);
                    }
                    value = value.map(function(s) {
                        return s.trim();
                    });
                    if (format) {
                        tmp = {};
                        for (j = 0; j < value.length; j++) {
                            tmp[format[j]] = value[j];
                        }
                        value = tmp;
                    }
                }
                if (key === 'Format') {
                    format = value;
                }
                body.push({
                    key: key,
                    value: value
                });
            }
        }
    }

    return sections;
};

self.requestAnimationFrame = (function () {
    // similar to Browser.requestAnimationFrame
    var nextRAF = 0;
    return function (func) {
        // try to keep target fps (30fps) between calls to here
        var now = Date.now();
        if (nextRAF === 0) {
            nextRAF = now + 1000 / self.targetFps;
        } else {
            while (now + 2 >= nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
                nextRAF += 1000 / self.targetFps;
            }
        }
        var delay = Math.max(nextRAF - now, 0);
        return setTimeout(func, delay);
        //return setTimeout(func, 1);
    };
})();

var screen = {
    width: 0,
    height: 0
};

Module.print = function Module_print(x) {
    //dump('OUT: ' + x + '\n');
    postMessage({target: 'stdout', content: x});
};
Module.printErr = function Module_printErr(x) {
    //dump('ERR: ' + x + '\n');
    postMessage({target: 'stderr', content: x});
};

// Frame throttling

var frameId = 0;
var clientFrameId = 0;
var commandBuffer = [];

var postMainLoop = Module['postMainLoop'];
Module['postMainLoop'] = function () {
    if (postMainLoop) postMainLoop();
    // frame complete, send a frame id
    postMessage({target: 'tick', id: frameId++});
    commandBuffer = [];
};

// Wait to start running until we receive some info from the client
//addRunDependency('gl-prefetch');
addRunDependency('worker-init');

// buffer messages until the program starts to run

var messageBuffer = null;
var messageResenderTimeout = null;

function messageResender() {
    if (calledMain) {
        assert(messageBuffer && messageBuffer.length > 0);
        messageResenderTimeout = null;
        messageBuffer.forEach(function (message) {
            onmessage(message);
        });
        messageBuffer = null;
    } else {
        messageResenderTimeout = setTimeout(messageResender, 50);
    }
}

function onMessageFromMainEmscriptenThread(message) {
    if (!calledMain && !message.data.preMain) {
        if (!messageBuffer) {
            messageBuffer = [];
            messageResenderTimeout = setTimeout(messageResender, 50);
        }
        messageBuffer.push(message);
        return;
    }
    if (calledMain && messageResenderTimeout) {
        clearTimeout(messageResenderTimeout);
        messageResender();
    }
    //console.log('worker got ' + JSON.stringify(message.data).substr(0, 150) + '\n');
    switch (message.data.target) {
        case 'window': {
            self.fireEvent(message.data.event);
            break;
        }
        case 'canvas': {
            if (message.data.event) {
                Module.canvas.fireEvent(message.data.event);
            } else if (message.data.width) {
                if (Module.canvas && message.data.boundingClientRect) {
                    Module.canvas.boundingClientRect = message.data.boundingClientRect;
                }
                self.resize(message.data.width, message.data.height);
                if (self.fastRenderMode) {
                    self.fastRender();
                } else {
                    self.render();
                }
            } else throw 'ey?';
            break;
        }
        case 'video': {
            if (message.data.currentTime !== undefined) {
                self.setCurrentTime(message.data.currentTime);
            }
            if (message.data.isPaused !== undefined) {
                self.setIsPaused(message.data.isPaused);
            }
            if (message.data.rate) {
                self.rate = message.data.rate;
            }
            break;
        }
        case 'tock': {
            clientFrameId = message.data.id;
            break;
        }
        case 'worker-init': {
            //Module.canvas = document.createElement('canvas');
            screen.width = self.width = message.data.width;
            screen.height = self.height = message.data.height;
            self.subUrl = message.data.subUrl;
            self.subContent = message.data.subContent;
            self.fontFiles = message.data.fonts;
            self.fastRenderMode = message.data.fastRender;
            self.availableFonts = message.data.availableFonts;
            self.debug = message.data.debug;
            if (!hasNativeConsole && self.debug) {
                console = makeCustomConsole();
                console.log("overridden console");
            }
            if (Module.canvas) {
                Module.canvas.width_ = message.data.width;
                Module.canvas.height_ = message.data.height;
                if (message.data.boundingClientRect) {
                    Module.canvas.boundingClientRect = message.data.boundingClientRect;
                }
            }
            removeRunDependency('worker-init');
            break;
        }
        case 'destroy':
            self.quit();
            break;
        case 'free-track':
            self.freeTrack();
            break;
        case 'set-track':
            self.setTrack(message.data.content);
            break;
        case 'set-track-by-url':
            self.setTrackByUrl(message.data.url);
            break;
        case 'runBenchmark': {
            self.runBenchmark();
            break;
        }
        case 'custom': {
            if (Module['onCustomMessage']) {
                Module['onCustomMessage'](message);
            } else {
                throw 'Custom message received but worker Module.onCustomMessage not implemented.';
            }
            break;
        }
        case 'setimmediate': {
            if (Module['setImmediates']) Module['setImmediates'].shift()();
            break;
        }
        default:
            throw 'wha? ' + message.data.target;
    }
};

onmessage = onMessageFromMainEmscriptenThread;

function postCustomMessage(data) {
    postMessage({target: 'custom', userData: data});
}

self.runBenchmark = function (seconds, pos, async) {
    var totalTime = 0;
    var i = 0;
    pos = pos || 0;
    seconds = seconds || 60;
    var count = seconds * self.targetFps;
    var start = performance.now();
    var longestFrame = 0;
    var run = function () {
        var t0 = performance.now();

        pos += 1 / self.targetFps;
        self.setCurrentTime(pos);

        var t1 = performance.now();
        var diff = t1 - t0;
        totalTime += diff;
        if (diff > longestFrame) {
            longestFrame = diff;
        }

        if (i < count) {
            i++;

            if (async) {
                self.requestAnimationFrame(run);
                return false;
            }
            else {
                return true;
            }
        }
        else {
            console.log("Performance fps: " + Math.round(1000 / (totalTime / count)) + "");
            console.log("Real fps: " + Math.round(1000 / ((t1 - start) / count)) + "");
            console.log("Total time: " + totalTime);
            console.log("Longest frame: " + Math.ceil(longestFrame) + "ms (" + Math.floor(1000 / longestFrame) + " fps)");

            return false;
        }
    };

    while (true) {
        if (!run()) {
            break;
        }
    }
};

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
            self.rafId = window.requestAnimationFrame(self.render);
        }
        else {
            self.render();
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
            self.rafId = window.requestAnimationFrame(self.render);
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
            op: 'renderMultiple',
            time: Date.now(),
            spentTime: spentTime,
            canvases: result[0]
        }, result[1]);
    }

    if (!self._isPaused) {
        self.rafId = window.requestAnimationFrame(self.render);
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

function Element() {
    throw 'TODO: Element'
}
function HTMLCanvasElement() {
    throw 'TODO: HTMLCanvasElement'
}
function HTMLVideoElement() {
    throw 'TODO: HTMLVideoElement'
}

var KeyboardEvent = {
    'DOM_KEY_LOCATION_RIGHT': 2,
};

function PropertyBag() {
    this.addProperty = function () {
    };
    this.removeProperty = function () {
    };
    this.setProperty = function () {
    };
};

var IndexedObjects = {
    nextId: 1,
    cache: {},
    add: function (object) {
        object.id = this.nextId++;
        this.cache[object.id] = object;
    }
};

function EventListener() {
    this.listeners = {};

    this.addEventListener = function addEventListener(event, func) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(func);
    };

    this.removeEventListener = function (event, func) {
        var list = this.listeners[event];
        if (!list) return;
        var me = list.indexOf(func);
        if (me < 0) return;
        list.splice(me, 1);
    };

    this.fireEvent = function fireEvent(event) {
        event.preventDefault = function () {
        };

        if (event.type in this.listeners) {
            this.listeners[event.type].forEach(function (listener) {
                listener(event);
            });
        }
    };
}

function Image() {
    IndexedObjects.add(this);
    EventListener.call(this);
    var src = '';
    Object.defineProperty(this, 'src', {
        set: function (value) {
            src = value;
            assert(this.id);
            postMessage({target: 'Image', method: 'src', src: src, id: this.id});
        },
        get: function () {
            return src;
        }
    });
}
Image.prototype.onload = function () {
};
Image.prototype.onerror = function () {
};

var HTMLImageElement = Image;
var windowExtra = new EventListener();
for (var x in windowExtra) window[x] = windowExtra[x];

window.close = function window_close() {
    postMessage({target: 'window', method: 'close'});
};

window.alert = function (text) {
    Module.printErr('alert forever: ' + text);
    while (1) {
    }
    ;
};

window.scrollX = window.scrollY = 0; // TODO: proxy these

window.requestAnimationFrame = (function () {
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

var document = new EventListener();

document.createElement = function document_createElement(what) {
    switch (what) {
        case 'canvas': {
            var canvas = new EventListener();
            canvas.ensureData = function canvas_ensureData() {
                if (!canvas.data || canvas.data.width !== canvas.width || canvas.data.height !== canvas.height) {
                    canvas.data = {
                        width: canvas.width,
                        height: canvas.height,
                        data: new Uint8ClampedArray(canvas.width * canvas.height * 4)
                    };
                    if (canvas === Module['canvas']) {
                        postMessage({target: 'canvas', op: 'resize', width: canvas.width, height: canvas.height});
                    }
                }
                if (canvas.data.data.length == 0) {
                    canvas.data.data = new Uint8ClampedArray(canvas.width * canvas.height * 4);
                }
            };
            canvas.getContext = function canvas_getContext(type, attributes) {
                if (canvas === Module['canvas']) {
                    postMessage({target: 'canvas', op: 'getContext', type: type, attributes: attributes});
                }
                if (type === '2d') {
                    return {
                        getImageData: function (x, y, w, h) {
                            assert(x == 0 && y == 0 && w == canvas.width && h == canvas.height);
                            canvas.ensureData();
                            return canvas.data;
                            /*return {
                             width: canvas.data.width,
                             height: canvas.data.height,
                             data: new Uint8Array(canvas.data.data) // TODO: can we avoid this copy?
                             };*/
                        },
                        putImageData: function (image, x, y) {
                            canvas.ensureData();
                            assert(x == 0 && y == 0 && image.width == canvas.width && image.height == canvas.height);
                            //canvas.data.data.set(image.data); // TODO: can we avoid this copy?
                            canvas.data.data = image.data;
                            if (canvas === Module['canvas']) {
                                //postMessage({target: 'canvas', op: 'render', image: canvas.data});

                                postMessage({
                                    target: 'canvas',
                                    op: 'render',
                                    buffer: canvas.data.data.buffer
                                }, [canvas.data.data.buffer]);
                                canvas.data.data = new Uint8ClampedArray(canvas.width * canvas.height * 4);
                            }
                        },
                        drawImage: function (image, x, y, w, h, ox, oy, ow, oh) {
                            assert(!x && !y && !ox && !oy);
                            assert(w === ow && h === oh);
                            assert(canvas.width === w || w === undefined);
                            assert(canvas.height === h || h === undefined);
                            assert(image.width === canvas.width && image.height === canvas.height);
                            canvas.ensureData();
                            canvas.data.data.set(image.data.data); // TODO: can we avoid this copy?
                            if (canvas === Module['canvas']) {
                                postMessage({target: 'canvas', op: 'render', image: canvas.data});
                            }
                        }
                    };
                } else {
                    return null;
                }
            };
            canvas.boundingClientRect = {};
            canvas.getBoundingClientRect = function canvas_getBoundingClientRect() {
                return {
                    width: canvas.boundingClientRect.width,
                    height: canvas.boundingClientRect.height,
                    top: canvas.boundingClientRect.top,
                    left: canvas.boundingClientRect.left,
                    bottom: canvas.boundingClientRect.bottom,
                    right: canvas.boundingClientRect.right
                };
            };
            canvas.style = new PropertyBag();
            canvas.exitPointerLock = function () {
            };

            canvas.width_ = canvas.width_ || 0;
            canvas.height_ = canvas.height_ || 0;
            Object.defineProperty(canvas, 'width', {
                set: function (value) {
                    canvas.width_ = value;
                    if (canvas === Module['canvas']) {
                        postMessage({target: 'canvas', op: 'resize', width: canvas.width_, height: canvas.height_});
                    }
                },
                get: function () {
                    return canvas.width_;
                }
            });
            Object.defineProperty(canvas, 'height', {
                set: function (value) {
                    canvas.height_ = value;
                    if (canvas === Module['canvas']) {
                        postMessage({target: 'canvas', op: 'resize', width: canvas.width_, height: canvas.height_});
                    }
                },
                get: function () {
                    return canvas.height_;
                }
            });

            var style = {
                parentCanvas: canvas,
                removeProperty: function () {
                },
                setProperty: function () {
                },
            };

            Object.defineProperty(style, 'cursor', {
                set: function (value) {
                    if (!style.cursor_ || style.cursor_ !== value) {
                        style.cursor_ = value;
                        if (style.parentCanvas === Module['canvas']) {
                            postMessage({
                                target: 'canvas',
                                op: 'setObjectProperty',
                                object: 'style',
                                property: 'cursor',
                                value: style.cursor_
                            });
                        }
                    }
                },
                get: function () {
                    return style.cursor_;
                }
            });

            canvas.style = style;

            return canvas;
        }
        default:
            throw 'document.createElement ' + what;
    }
};

document.getElementById = function (id) {
    if (id === 'canvas' || id === 'application-canvas') {
        return Module.canvas;
    }
    throw 'document.getElementById failed on ' + id;
};

document.documentElement = {};

document.styleSheets = [{
    cssRules: [], // TODO: forward to client
    insertRule: function (rule, i) {
        this.cssRules.splice(i, 0, rule);
    }
}];

document.URL = 'http://worker.not.yet.ready.wait.for.window.onload?fake';

var screen = {
    width: 0,
    height: 0
};

//Module.canvas = document.createElement('canvas');

Module.setStatus = function () {
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
        case 'document': {
            document.fireEvent(message.data.event);
            break;
        }
        case 'window': {
            window.fireEvent(message.data.event);
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
                self.render(true);
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
        case 'Image': {
            var img = IndexedObjects.cache[message.data.id];
            switch (message.data.method) {
                case 'onload': {
                    img.width = message.data.width;
                    img.height = message.data.height;
                    img.data = {width: img.width, height: img.height, data: message.data.data};
                    img.complete = true;
                    img.onload();
                    break;
                }
                case 'onerror': {
                    img.onerror({srcElement: img});
                    break;
                }
            }
            break;
        }
        case 'IDBStore': {
            assert(message.data.method === 'response');
            assert(IDBStore.pending);
            IDBStore.pending(message.data);
            break;
        }
        case 'worker-init': {
            if (self.subUrl) {
                self.quit();
            }
            //Module.canvas = document.createElement('canvas');
            screen.width = self.width = message.data.width;
            screen.height = self.height = message.data.height;
            self.subUrl = message.data.subUrl;
            self.subContent = message.data.subContent;
            self.fonts = message.data.fonts;
            self.availableFonts = message.data.availableFonts;
            if (Module.canvas) {
                Module.canvas.width_ = message.data.width;
                Module.canvas.height_ = message.data.height;
                if (message.data.boundingClientRect) {
                    Module.canvas.boundingClientRect = message.data.boundingClientRect;
                }
            }
            document.URL = message.data.URL;
            window.fireEvent({type: 'load'});
            removeRunDependency('worker-init');
            break;
        }
        case 'runBenchmark': {
            window.runBenchmark();
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

window.runBenchmark = function (seconds, pos, async) {
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
                window.requestAnimationFrame(run);
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
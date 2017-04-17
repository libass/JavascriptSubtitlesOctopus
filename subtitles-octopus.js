var SubtitlesOctopus = function (options) {
    var self = this;
    self.canvas = options.canvas; // HTML canvas element (optional if video specified)
    self.isOurCanvas = false; // (internal) we created canvas and manage it
    self.video = options.video; // HTML video element (optional if canvas specified)
    self.canvasParent = null; // (internal) HTML canvas parent element
    self.fonts = options.fonts || []; // Array with links to fonts used in sub (optional)
    self.availableFonts = options.availableFonts || []; // Object with all available fonts (optional). Key is font name in lower case, value is link: {"arial": "/font1.ttf"}
    self.onReadyEvent = options.onReady; // Function called when SubtitlesOctopus is ready (optional)
    self.workerUrl = options.workerUrl || 'libassjs-worker.js'; // Link to worker
    self.subUrl = options.subUrl; // Link to sub file (optional if subContent specified)
    self.subContent = options.subContent || null; // Sub content (optional if subUrl specified)
    self.onErrorEvent = options.onError; // Function called in case of critical error meaning sub wouldn't be shown and you should use alternative method (for instance it occurs if browser doesn't support web workers).
    self.debug = options.debug || false; // When debug enabled, some performance info printed in console.
    self.lastRenderTime = 0; // (internal) Last time we got some frame from worker
    self.pixelRatio = window.devicePixelRatio || 1; // (internal) Device pixel ratio (for high dpi devices)

    self.timeOffset = options.timeOffset || 0; // Time offset would be applied to currentTime from video (option)

    self.workerError = function (error) {
        console.error('Worker error: ', error);
        if (self.onErrorEvent) {
            self.onErrorEvent();
        }
        if (!self.debug) {
            self.dispose();
            throw new Error('Worker error: ' + error);
        }
    };

    // Not tested for repeated usage yet
    self.init = function () {
        if (!window.Worker) {
            self.workerError('worker not supported');
            return;
        }
        // Worker
        if (!self.worker) {
            self.worker = new Worker(self.workerUrl);
            self.worker.onmessage = self.onWorkerMessage;
            self.worker.onerror = self.workerError;
        }
        self.workerActive = false;
        self.createCanvas();
        self.setVideo(options.video);
        self.setSubUrl(options.subUrl);
        self.worker.postMessage({
            target: 'worker-init',
            width: self.canvas.width,
            height: self.canvas.height,
            URL: document.URL,
            currentScriptUrl: self.workerUrl,
            preMain: true,
            subUrl: self.subUrl,
            subContent: self.subContent,
            fonts: self.fonts,
            availableFonts: self.availableFonts
        });
    };

    self.createCanvas = function () {
        if (!self.canvas) {
            if (self.video) {
                self.isOurCanvas = true;
                self.canvas = document.createElement('canvas');
                self.canvas.className = 'libassjs-canvas';
                self.canvas.style.display = 'none';

                self.canvasParent = document.createElement('div');
                self.canvasParent.className = 'libassjs-canvas-parent';
                self.canvasParent.appendChild(self.canvas);

                if (self.video.nextSibling) {
                    self.video.parentNode.insertBefore(self.canvasParent, self.video.nextSibling);
                }
                else {
                    self.video.parentNode.appendChild(self.canvasParent);
                }
            }
            else {
                if (!self.canvas) {
                    self.workerError('Don\'t know where to render: you should give video or canvas in options.');
                }
            }
        }
        self.ctx = self.canvas.getContext('2d');
        self.bufferCanvas = document.createElement('canvas');
        self.bufferCanvasCtx = self.bufferCanvas.getContext('2d');
    };

    self.setVideo = function (video) {
        self.video = video;
        if (self.video) {
            self.video.addEventListener("playing", function () {
                self.setIsPaused(false, video.currentTime + self.timeOffset);
            }, false);
            self.video.addEventListener("pause", function () {
                self.setIsPaused(true, video.currentTime + self.timeOffset);
            }, false);
            self.video.addEventListener("seeking", function () {
                self.setCurrentTime(video.currentTime + self.timeOffset);
            }, false);
            self.video.addEventListener("ratechange", function () {
                self.setRate(video.playbackRate);
            }, false);
            self.video.addEventListener("timeupdate", function () {
                self.setCurrentTime(video.currentTime + self.timeOffset);
            }, false);

            document.addEventListener("fullscreenchange", self.resizeWithTimeout, false);
            document.addEventListener("mozfullscreenchange", self.resizeWithTimeout, false);
            document.addEventListener("webkitfullscreenchange", self.resizeWithTimeout, false);
            document.addEventListener("msfullscreenchange", self.resizeWithTimeout, false);
            window.addEventListener("resize", self.resizeWithTimeout, false);

            if (self.video.videoWidth > 0) {
                self.resize();
            }
            else {
                self.video.addEventListener("loadedmetadata", function (e) {
                    e.target.removeEventListener(e.type, arguments.callee);
                    self.resize();
                }, false);
            }
        }
    };

    self.getVideoPosition = function () {
        var videoRatio = self.video.videoWidth / self.video.videoHeight;
        var width = self.video.offsetWidth, height = self.video.offsetHeight;
        var elementRatio = width / height;
        var realWidth = width, realHeight = height;
        if (elementRatio > videoRatio) realWidth = Math.floor(height * videoRatio);
        else realHeight = Math.floor(width / videoRatio);

        var x = (width - realWidth) / 2;
        var y = (height - realHeight) / 2;

        return {
            width: realWidth,
            height: realHeight,
            x: x,
            y: y
        };
    };

    self.setSubUrl = function (subUrl) {
        self.subUrl = subUrl;
    };

    self.cloneObject = function (event) {
        var ret = {};
        for (var x in event) {
            if (x == x.toUpperCase()) continue;
            var prop = event[x];
            if (typeof prop === 'number' || typeof prop === 'string') ret[x] = prop;
        }
        return ret;
    };

    self.renderFrameData = null;
    function renderFrame() {
        /*var dst = self.canvasData.data;
         if (dst.set) {
         dst.set(renderFrameData);
         } else {
         for (var i = 0; i < renderFrameData.length; i++) {
         dst[i] = renderFrameData[i];
         }
         }
         self.ctx.putImageData(self.canvasData, 0, 0);*/
        self.ctx.putImageData(new ImageData(self.renderFrameData, self.canvas.width, self.canvas.height), 0, 0);
        self.renderFrameData = null;
    }

    function renderFrames() {
        var data = self.renderFramesData;
        var beforeDrawTime = performance.now();
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        for (var i = 0; i < data.canvases.length; i++) {
            var image = data.canvases[i];
            self.bufferCanvas.width = image.w;
            self.bufferCanvas.height = image.h;
            self.bufferCanvasCtx.putImageData(new ImageData(new Uint8ClampedArray(image.buffer), image.w, image.h), 0, 0);
            self.ctx.drawImage(self.bufferCanvas, image.x, image.y);
        }
        if (self.debug) {
            var drawTime = Math.round(performance.now() - beforeDrawTime);
            console.log(Math.round(data.spentTime) + ' ms (+ ' + drawTime + ' ms draw)');
            self.renderStart = performance.now();
        }
    }

    self.workerActive = false;
    self.frameId = 0;
    self.onWorkerMessage = function (event) {
        //dump('\nclient got ' + JSON.stringify(event.data).substr(0, 150) + '\n');
        if (!self.workerActive) {
            self.workerActive = true;
            if (self.onReadyEvent) {
                self.onReadyEvent();
            }
        }
        var data = event.data;
        switch (data.target) {
            case 'stdout': {
                console.log(data.content);
                break;
            }
            case 'stderr': {
                console.error(data.content);
                break;
            }
            case 'window': {
                window[data.method]();
                break;
            }
            case 'canvas': {
                switch (data.op) {
                    case 'getContext': {
                        self.ctx = self.canvas.getContext(data.type, data.attributes);
                        break;
                    }
                    case 'resize': {
                        self.resize(data.width, data.height);
                        break;
                    }
                    case 'render': {
                        // previous image was rendered so request another frame
                        if (!self.renderFrameData) {
                            window.requestAnimationFrame(renderFrame);
                        }

                        if (data.buffer) {
                            self.renderFrameData = new Uint8ClampedArray(data.buffer);
                        }
                        else {
                            self.renderFrameData = data.image.data;
                        }
                        break;
                    }
                    case 'renderMultiple': {
                        if (self.lastRenderTime < data.time) {
                            self.lastRenderTime = data.time;
                            self.renderFramesData = data;
                            window.requestAnimationFrame(renderFrames);
                        }
                        break;
                    }
                    case 'setObjectProperty': {
                        self.canvas[data.object][data.property] = data.value;
                        break;
                    }
                    default:
                        throw 'eh?';
                }
                break;
            }
            case 'tick': {
                self.frameId = data.id;
                self.worker.postMessage({
                    target: 'tock',
                    id: self.frameId
                });
                break;
            }
            case 'Image': {
                assert(data.method === 'src');
                var img = new Image();
                img.onload = function () {
                    assert(img.complete);
                    var canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    var imageData = ctx.getImageData(0, 0, img.width, img.height);
                    self.worker.postMessage({
                        target: 'Image',
                        method: 'onload',
                        id: data.id,
                        width: img.width,
                        height: img.height,
                        data: imageData.data,
                        preMain: true
                    });
                };
                img.onerror = function () {
                    self.worker.postMessage({
                        target: 'Image',
                        method: 'onerror',
                        id: data.id,
                        preMain: true
                    });
                };
                img.src = data.src;
                break;
            }
            case 'custom': {
                if (self['onCustomMessage']) {
                    self['onCustomMessage'](event);
                } else {
                    throw 'Custom message received but client onCustomMessage not implemented.';
                }
                break;
            }
            case 'setimmediate': {
                self.worker.postMessage({
                    target: 'setimmediate'
                });
                break;
            }
            default:
                throw 'what? ' + data.target;
        }
    };

    self.resize = function (width, height) {
        var videoSize = null;
        if ((!width || !height) && self.video) {
            videoSize = self.getVideoPosition();
            width = videoSize.width * self.pixelRatio;
            height = videoSize.height * self.pixelRatio;
        }
        if (!width || !height) {
            if (!self.video) {
                console.error('width or height is 0. You should specify width & height for resize.');
            }
            return;
        }

        if (self.canvas.width != width || self.canvas.height != height) {
            self.canvas.width = width;
            self.canvas.height = height;

            if (videoSize != null) {
                self.canvasParent.style.position = 'relative';
                self.canvas.style.display = 'block';
                self.canvas.style.position = 'absolute';
                self.canvas.style.width = videoSize.width + 'px';
                self.canvas.style.height = videoSize.height + 'px';
                self.canvas.style.left = videoSize.x + 'px';
                var offset = self.canvasParent.getBoundingClientRect().top - self.video.getBoundingClientRect().top;
                self.canvas.style.top = (videoSize.y - offset) + 'px';
                self.canvas.style.pointerEvents = 'none';
            }

            self.worker.postMessage({
                target: 'canvas',
                width: self.canvas.width,
                height: self.canvas.height
            });
        }
    };

    self.resizeWithTimeout = function () {
        self.resize();
        setTimeout(self.resize, 100);
    };

    self.customMessage = function (data, options) {
        options = options || {};
        self.worker.postMessage({
            target: 'custom',
            userData: data,
            preMain: options.preMain
        });
    };

    self.setCurrentTime = function (currentTime) {
        self.worker.postMessage({
            target: 'video',
            currentTime: currentTime
        });
    };

    self.render = self.setCurrentTime;

    self.setIsPaused = function (isPaused, currentTime) {
        self.worker.postMessage({
            target: 'video',
            isPaused: isPaused,
            currentTime: currentTime
        });
    };

    self.setRate = function (rate) {
        self.worker.postMessage({
            target: 'video',
            rate: rate
        });
    };

    self.dispose = function () {
        self.worker.terminate();
    };

    self.init();
};

if (typeof SubtitlesOctopusOnLoad == 'function') {
    SubtitlesOctopusOnLoad();
}
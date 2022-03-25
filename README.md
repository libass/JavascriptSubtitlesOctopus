[![Actions Status](https://github.com/libass/JavascriptSubtitlesOctopus/actions/workflows/emscripten.yml/badge.svg)](https://github.com/libass/JavascriptSubtitlesOctopus/actions/workflows/emscripten.yml?query=branch%3Amaster+event%3Apush)


SubtitlesOctopus displays subtitles in .ass format and easily integrates with HTML5 videos.
Since it uses [libass](https://github.com/libass/libass), SubtitlesOctopus supports most
SSA/ASS features and enables you to get consistent results in authoring and web-playback,
provided libass is also used locally.

[ONLINE DEMO](https://libass.github.io/JavascriptSubtitlesOctopus/videojs.html)
/ [other examples with demo](https://libass.github.io/JavascriptSubtitlesOctopus/)

## Features

- Supports most SSA/ASS features (everything libass supports)
- Supports all OpenType- and TrueType-fonts (including woff2 fonts)
- Works fast (because uses WebAssembly with fallback to asm.js if it's not available)
- Uses Web Workers thus video and interface doesn't lag even on "heavy" subtitles (working in background)
- Doesn't use DOM manipulations and render subtitles on single canvas
- Fully compatible with [libass'](https://github.com/libass/libass) extensions
  (but beware of compatability to other ASS-renderers when using them)
- Easy to use - just connect it to video element

## Included Libraries

* libass
* expat
* fontconfig
* freetype
* fribidi
* harfbuzz
* brotli

## Usage

To start using SubtitlesOctopus you only need to instantiate a new instance of
`SubtitlesOctopus` and specify its [Options](#options).

```javascript
var options = {
    video: document.getElementById('video'), // HTML5 video element
    subUrl: '/test/test.ass', // Link to subtitles
    fonts: ['/test/font-1.ttf', '/test/font-2.ttf'], // Links to fonts (not required, default font already included in build)
    workerUrl: '/libassjs-worker.js', // Link to WebAssembly-based file "libassjs-worker.js"
    legacyWorkerUrl: '/libassjs-worker-legacy.js' // Link to non-WebAssembly worker
};
var instance = new SubtitlesOctopus(options);
```

After that SubtitlesOctopus automatically "connects" to your video and it starts
to display subtitles. You can use it with any HTML5 player.

[See other examples](https://github.com/libass/JavascriptSubtitlesOctopus/tree/gh-pages/).

### Using only with canvas
You're also able to use it without any video. However, that requires you to set
the time the subtitles should render at yourself:

```javascript
var options = {
    canvas: document.getElementById('canvas'), // canvas element
    subUrl: '/test/test.ass', // Link to subtitles
    fonts: ['/test/font-1.ttf', '/test/font-2.ttf'], // Links to fonts (not required, default font already included in build)
    workerUrl: '/libassjs-worker.js' // Link to file "libassjs-worker.js"
};
var instance = new SubtitlesOctopus(options);
// And then...
instance.setCurrentTime(15); // Render subtitles at 00:15 on your canvas
```

### Changing subtitles
You're not limited to only display the subtitle file you referenced in your
options. You're able to dynamically change subtitles on the fly. There's three
methods that you can use for this specifically:

- `setTrackByUrl(url)`: works the same as the `subUrl` option. It will set the
  subtitle to display by its URL.
- `setTrack(content)`: works the same as the `subContent` option. It will set
  the subtitle to dispaly by its content.
- `freeTrack()`: this simply removes the subtitles. You can use the two methods
  above to set a new subtitle file to be displayed.

```JavaScript
var instance = new SubtitlesOctopus(options);

// ... we want to change the subtitles to the Railgun OP
instance.setTrackByUrl('/test/railgun_op.ass');
```

### Cleaning up the object
After you're finished with rendering the subtitles. You need to call the
`instance.dispose()` method to correctly dispose of the object.

```JavaScript
var instance = new SubtitlesOctopus(options);

// After you've finished using it...

instance.dispose();
```


### Options
When creating an instance of SubtitleOctopus, you can set the following options:

- `video`: The video element to attach listeners to. (Optional)
- `canvas`: The canvas to render the subtitles to. If none is given it will
  create a new canvas and insert it as a sibling of the video element (only if
  the video element exists). (Optional)
- `subUrl`: The URL of the subtitle file to play. (Require either `subUrl` or
  `subContent` to be specified)
- `subContent`: The content of the subtitle file to play. (Require either
  `subContent` or `subUrl` to be specified)
- `workerUrl`: The URL of the worker. (Default: `libassjs-worker.js`)
- `fonts`: An array of links to the fonts used in the subtitle. (Optional)
- `availableFonts`: Object with all available fonts - Key is font name in lower
  case, value is link: `{"arial": "/font1.ttf"}` (Optional)
- `timeOffset`: The amount of time the subtitles should be offset from the
  video. (Default: `0`)
- `onReady`: Function that's called when SubtitlesOctopus is ready. (Optional)
- `onError`: Function called in case of critical error meaning the subtitles
  wouldn't be shown and you should use an alternative method (for instance it
  occurs if browser doesn't support web workers). (Optional)
- `debug`: Whether performance info is printed in the console. (Default:
  `false`)
- `renderMode`: Rendering mode.
  (If not set, the deprecated option `lossyRender` is evaluated)
  - `js-blend` - JS Blending
  - `wasm-blend` - WASM Blending, currently the default
  - `lossy` - Lossy Render Mode (EXPERIMENTAL)
- `targetFps`: Target FPS (Default: `24`)
- `libassMemoryLimit`: libass bitmap cache memory limit in MiB (approximate)
                       (Default: `0` - no limit)
- `libassGlyphLimit`: libass glyph cache memory limit in MiB (approximate)
                      (Default: `0` - no limit)
- `prescaleFactor`: Scale down (`< 1.0`) the subtitles canvas to improve
                    performance at the expense of quality, or scale it up (`> 1.0`).
                    (Default: `1.0` - no scaling; must be a number > 0)
- `prescaleHeightLimit`: The height beyond which the subtitles canvas won't be prescaled.
                         (Default: `1080`)
- `maxRenderHeight`: The maximum rendering height of the subtitles canvas.
                     Beyond this subtitles will be upscaled by the browser.
                     (Default: `0` - no limit)
- `dropAllAnimations`: If set to true, attempt to discard all animated tags.
                       Enabling this may severly mangle complex subtitles and
                       should only be considered as an last ditch effort of uncertain success
                       for hardware otherwise incapable of displaing anything.
                       Will not reliably work with manually edited or allocated events.
                       (Default: `false` - do nothing)

### Rendering Modes
#### JS Blending
To use this mode set `renderMode` to `js-blend` upon instance creation.
This will do all the processing of the bitmaps produced by libass outside of WebAssembly.

#### WASM Blending
To use this mode set `renderMode` to `wasm-blend` upon instance creation.
This will blend the bitmaps of the different events together in WebAssembly,
so the JavaScript-part only needs to process a single image.
If WebAssembly-support is available this will be faster than the default mode,
especially for many and/or complex simultaneous subtitles.
Without WebAssembly-support it will fallback to asm.js and
should at least not be slower than the default mode.

#### Lossy Render Mode (EXPERIMENTAL)
To use this mode set `renderMode` to `lossy` upon instance creation.
The Lossy Render mode has been created by @no1d as a suggestion for fix browser
freezing when rendering heavy subtitles (#46), it uses
[createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
to render the bitmap in the Worker, using Promises instead of direct render on
canvas in the Main Thread. When the browser start to hang, it will not lock main
thread, instead will run Async, so if the function createImageBitmap fail, it
will not stop the rendering process at all and may cause some bitmap loss or
simply will not draw anything in canvas, mostly on low end devices.

**WARNING: Experimental, not stable and not working in some browsers**


### Brotli Compressed Subtitles
The SubtitleOctopus allow the use of compressed subtitles in brotli format,
saving bandwidth and reducing library startup time

To use, just run: `brotli subFile.ass` and use the .br result file with the subUrl option

## How to build?

### Dependencies
* git
* emscripten (Configure the enviroment)
* make
* python3
* cmake
* pkgconfig
* patch
* libtool
* autotools (autoconf, automake, autopoint)
* gettext
* ragel - Required by Harfbuzz
* itstool - Required by Fontconfig
* python3-ply - Required by WebIDL
* gperf - Required by Fontconfig
* licensecheck

### Get the Source

Run `git clone --recursive https://github.com/libass/JavascriptSubtitlesOctopus.git`

### Build inside a Container
#### Docker
1) Install Docker
2) `./run-docker-build.sh`
3) Artifacts are in /dist/js
#### Buildah
1) Install Buildah and a suitable backend for `buildah run` like `crun` or `runc`
2) `./run-buildah-build.sh`
3) Artifacts are in /dist/js

### Build without Containers
1) Install the dependency packages listed above
2) `make`
    - If on macOS with libtool from brew, `LIBTOOLIZE=glibtoolize make`
3) Artifacts are in /dist/js

## Why "Octopus"?
How am I an Octopus? [Ba da ba da ba!](https://www.youtube.com/watch?v=tOzOD-82mW0)

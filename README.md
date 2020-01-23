[![Build Status](https://gitlab.com/TFSThiagoBR98/JavascriptSubtitlesOctopus/badges/master/build.svg)](https://gitlab.com/TFSThiagoBR98/JavascriptSubtitlesOctopus/pipelines)

SubtitlesOctopus displays subtitles in .ass format and easily integrates with HTML5 videos. It supports all SSA/ASS features and fully compatible with [libass](https://github.com/libass/libass).

[ONLINE DEMO](https://dador.github.io/JavascriptSubtitlesOctopus/videojs.html) / [other examples with demo](https://dador.github.io/JavascriptSubtitlesOctopus/)

## Features

- Supports all SSA/ASS features
- Supports any fonts (including woff2 fonts)
- Works fast (because uses WebAssembly with fallback to asm.js if it's not available)
- Uses Web Workers thus video and interface doesn't lag even on "heavy" subtitles (working in background)
- Doesn't use DOM manipulations and render subtitles on single canvas
- Fully compatible with [libass](https://github.com/libass/libass)
- Easy to use - just connect it to video element

## Included Libraries

* expat
* fontconfig
* freetype
* fribidi
* harfbuzz

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

[See other examples](https://github.com/Dador/JavascriptSubtitlesOctopus/tree/master/example).

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

### Fast Render Mode (Lossy) (EXPERIMENTAL)
The Fast Render mode has been created by @no1d as a suggestion for fix browser freezing when rendering heavy subtitles (#46), it use [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap) to render the bitmap in the Worker, using Promises instead of direct render on canvas in the Main Thread. When the browser start to hang, it will not lock main thread, instead will run Async, so if the function createImageBitmap fail, it will not stop the rendering process at all and may cause some bitmap loss or simply will not draw anything in canvas, mostly on low end devices.

**WARNING: Experimental, not stable and not working in Safari**

To enable this mode set the option `lossyRender` to `true` when creating an instance of SubtitleOctopus.

### Brotli Compressed Subtitles
The SubtitleOctopus allow the use of compressed subtitles in brotli format, saving bandwidth and reducing library startup time

To use, just run: `brotli subFile.ass` and use the .br result file with the subUrl option

## How to build?

### Dependencies
* git
* emscripten (Configure the enviroment)
* llvm
* clang
* ragel
* make
* autoconf
* python2
* pkgconfig
* patch
* libtool
* itstool
* automake
* python2-lxml
* python2-pip
* python2-html5lib
* python2-chardet
* gperf

### Get the Source

Run `git clone --recursive https://github.com/Dador/JavascriptSubtitlesOctopus.git`

### Build
1) Install Dependencies, see above
2) `cd JavascriptSubtitlesOctopus`
3) `make`
4) Artifacts are in /dist

### Build with Docker
1) Install Docker
2) `docker build -t dador/javascriptsubtitlesoctopus .`
3) `docker run --rm -v ${PWD}:/code dador/javascriptsubtitlesoctopus:latest`
4) Artifacts are in /dist

## Why "Octopus"?
How am I an Octopus? [Ba da ba da ba!](https://www.youtube.com/watch?v=tOzOD-82mW0)

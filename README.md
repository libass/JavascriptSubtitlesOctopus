[![Build Status](https://travis-ci.org/TFSThiagoBR98/JavascriptSubtitlesOctopus.svg?branch=master)](https://travis-ci.org/TFSThiagoBR98/JavascriptSubtitlesOctopus)

SubtitlesOctopus displays subtitles in .ass format and easily integrates with HTML5 videos. It supports all SSA/ASS features and fully compatible with [libass](https://github.com/libass/libass).

[ONLINE DEMO]() / [other examples with demo]()

## Features

- Supports all SSA/ASS features
- Supports any fonts
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

## How to use?

```javascript
var options = {
    video: document.getElementById('video'), // HTML5 video element
    subUrl: '/test/test.ass', // Link to subtitles
    fonts: ['/test/font-1.ttf', '/test/font-2.ttf'], // Links to fonts (not required, default font already included in build)
    workerUrl: '/libassjs-worker.js' // Link to file "libassjs-worker.js"
};
var instance = new SubtitlesOctopus(options);
```

After that SubtitlesOctopus automatically "connects" to your video and showing subtitles. You can use it with any HTML5 player.

You can also use it without any video, like that:
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

[See other examples]().

## How to build?

### Dependencies
* emscripten
* llvm
* clang
* ragel
* make
* nodejs
* npm
* npx
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

Run ´git clone --recursive https://github.com/TFSThiagoBR98/JavascriptSubtitlesOctopus.git´

### Using Grunt

1) Install Node and NPM
2) Run ´npm install´
3) Install Dependencies, see above
4) Run ´npx grunt´
5) Artifacts are in /dist

### Using Make
1) Install Dependencies, see above
2) Run make
3) Artifacts are in /dist

## Why "Octopus"?
How am I an Octopus? [Ba da ba da ba!](https://www.youtube.com/watch?v=tOzOD-82mW0)

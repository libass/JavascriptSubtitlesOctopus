SubtitlesOctopus displays subtitles in .ass format and easily integrates with HTML5 videos. It supports all SSA/ASS features and fully compatible with [libass](https://github.com/libass/libass).

[ONLINE DEMO](https://dador.github.io/JavascriptSubtitlesOctopus/videojs.html) / [other examples with demo](https://dador.github.io/JavascriptSubtitlesOctopus/)

## Features

- Supports all SSA/ASS features
- Supports any fonts
- Works fast (because uses WebAssembly with fallback to asm.js if it's not available)
- Uses Web Workers thus video and interface doesn't lag even on "heavy" subtitles (working in background)
- Doesn't use DOM manipulations and render subtitles on single canvas
- Fully compatible with [libass](https://github.com/libass/libass)
- Easy to use - just connect it to video element

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

[See other examples](https://github.com/Dador/JavascriptSubtitlesOctopus/tree/master/example).

## How to build?

1) Install [EMSDK](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) (it will take awhile). We recommend using Linux because building on Windows isn't tested.
2) Don't forget to activate emsdk environment:
```
source ./emsdk_env.sh
```
3) Clone repo with submodules:
```
git clone --recursive -j8 git@github.com:Dador/JavascriptSubtitlesOctopus.git
```
4) Run make:
```
cd JavascriptSubtitlesOctopus
make
```

## Why "Octopus"?
How am I an Octopus? [Ba da ba da ba!](https://www.youtube.com/watch?v=tOzOD-82mW0)
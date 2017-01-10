Display subtitles in .ass format for HTML5 videos, support all SSA/ASS features and fully compatible with libass.

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

## How to build?
That's quite easy!

1) Clone repo with submodules:
```
git clone --recursive -j8 git@github.com:Dador/JavascriptSubtitlesOctopus.git
```
2) Run make:
```
cd JavascriptSubtitlesOctopus
make
```

/* Commonly used functions
 *
 * Expects a JSO instance named player.
 */

// Resize event handlers
var changeResolution = function (width, height) {
    player.width(width / window.devicePixelRatio)
    player.height(height / window.devicePixelRatio);
    window.octopusInstance.resize();
};

var changeResolutionRO = function (width, height) {
    player.width(width / window.devicePixelRatio)
    player.height(height / window.devicePixelRatio);
};

// Benchmark
var isFirstRun = true;
var runBenchmark = function () {
    player.play();
    window.octopusInstance.runBenchmark();
    if (isFirstRun) {
        alert('See the result in console.');
        isFirstRun = false;
    }
}

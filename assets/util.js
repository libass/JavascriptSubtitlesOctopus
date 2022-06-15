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

// Configuration
/**
 * Generates options according to the passed base options and URL search params.
 * @param {Object} options - Base options.
 * @returns {Object} Options.
 */
function makeOptions(options) {
    var NAMES = {
        'wasm-blend': 'BlendRenderer',
        'js-blend': 'JSRenderer',
        'lossy': 'LossyRenderer',
        undefined: 'DefaultRenderer'
    };
    var param = new URLSearchParams(window.location.search);

    var renderMode = param.get('renderMode');

    if (renderMode === null || !(renderMode in NAMES)) {
        renderMode = options.renderMode;
        if (!(renderMode in NAMES))
            renderMode = undefined;
    }

    // Set  Name if required
    var infoNodes = document.querySelectorAll('.optionInfo');
    for(var i = 0; i < infoNodes.length; ++i) {
        var iN = infoNodes[i];
        var txt = iN.innerHTML;
        iN.innerHTML = txt.replace('@RENDER_MODE@', NAMES[renderMode]);
    }

    return Object.assign({}, options, {
        renderMode: renderMode
    });
}

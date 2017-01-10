var LibassJs = function () {
	function LibassJs(canvas, subFile, fonts, onReadyFunction) {
		this.Module = Module || {};
		//var Module = this.Module;
		
		this.Module["preRun"] = this.Module["preRun"] || [];
		
		
		fonts = fonts || [];
		this.Module["preRun"].push(function() {
			Module["FS_createPreloadedFile"]("/", "sub.ass", subFile, true, false, null, Module["printErr"]);
			Module["FS_createFolder"]("/", "fonts", true, true);
			//Module["FS"].mount(Module["FS"].filesystems.IDBFS, {}, '/fonts');
			for (var i = 0; i < fonts.length; i++) {
				Module["FS_createPreloadedFile"]("/fonts", 'font' + i + '-' + fonts[i].split('/').pop(), fonts[i], true, true);
			}
		});
		
		this.Module["print"] = function(text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            console.log(text);
        };
        this.Module["printErr"] = function(text) {
          if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
          console.error(text);
        };
		if (canvas) {
			this.Module["canvas"] = canvas;
		}
		
		if (onReadyFunction) {
			this.Module['onRuntimeInitialized'] = onReadyFunction;
		}
		
		this.Module["noExitRuntime"] = true;
		
		this.load();
	}
	
	LibassJs.prototype.load = function () {
		var Module = this.Module;
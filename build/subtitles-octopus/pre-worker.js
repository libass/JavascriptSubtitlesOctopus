var Module = Module || {};

var self = {};
		
Module["preRun"] = Module["preRun"] || [];

Module["preRun"].push(function() {
	Module["FS_createPreloadedFile"]("/", "sub.ass", self.subUrl, true, false, null, Module["printErr"]);
	Module["FS_createFolder"]("/", "fonts", true, true);
	//Module["FS"].mount(Module["FS"].filesystems.IDBFS, {}, '/fonts');
	fonts = self.fonts || [];
	for (var i = 0; i < fonts.length; i++) {
		Module["FS_createPreloadedFile"]("/fonts", 'font' + i + '-' + fonts[i].split('/').pop(), fonts[i], true, true);
	}
});
		
Module['onRuntimeInitialized'] = function () {
	self.init(screen.width, screen.height);
};

Module["print"] = function(text) {
	if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
	console.log(text);
};
Module["printErr"] = function(text) {
  if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
  console.error(text);
};
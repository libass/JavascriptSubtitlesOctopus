		//Browser.resizeCanvas = true;

		//LibassJs.Module = Module;

		LibassJs.prototype.init = Module['cwrap']('libassjs_init', null, ['number', 'number']);
		LibassJs.prototype.resize = Module['cwrap']('libassjs_resize', null, ['number', 'number']);
		LibassJs.prototype.render = Module['cwrap']('libassjs_render', null, ['number']);
		LibassJs.prototype.quit = Module['cwrap']('libassjs_quit', null, []);

		Module['FS'] = FS;

		SDL.defaults.copyOnLock = false;
		SDL.defaults.discardOnLock = true;
		SDL.defaults.opaqueFrontBuffer = false;
	}

	return LibassJs;
}();

if (typeof LibassJsLoaded == 'function')
{
	LibassJsLoaded();
}
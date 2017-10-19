# Compile libass and all its dependencies to JavaScript.
# You need emsdk environment installed and activated, see:
# <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

# TODO: use harfbuzz? (at least need to compare performance)

FONTCONFIG_PC_PATH = ../freetype/dist/lib/pkgconfig:../expat/dist/lib/pkgconfig
LIBASS_PC_PATH = $(FONTCONFIG_PC_PATH):../fribidi/dist/lib/pkgconfig:../fontconfig/dist/lib/pkgconfig
LIBASSJS_PC_PATH = $(LIBASS_PC_PATH):../libass/dist/lib/pkgconfig
	
LIBASS_DEPS = \
	build/fribidi/dist/lib/libfribidi.so \
	build/freetype/dist/lib/libfreetype.so \
	build/expat/dist/lib/libexpat.so \
	build/fontconfig/dist/lib/libfontconfig.so
LIBASSJS_DEPS = \
	$(LIBASS_DEPS) \
	build/libass/dist/lib/libass.so

all: libass
libass: subtitles-octopus-worker.js

clean: clean-js clean-freetype clean-fribidi clean-fontconfig clean-expat clean-libass clean-octopus
clean-js:
	rm -f -- libass*
clean-freetype:
	-cd build/freetype && rm -rf dist && make clean
clean-fribidi:
	-cd build/fribidi && rm -rf dist && make clean
clean-fontconfig:
	-cd build/fontconfig && rm -rf dist && make clean
clean-expat:
	-cd build/expat && rm -rf dist && make clean
clean-libass:
	-cd build/libass && rm -rf dist && make clean
clean-octopus:
	-cd build/subtitles-octopus && rm -f subtitles-octopus-worker.bc && make clean
	
server:
	python -m SimpleHTTPServer

build/freetype/builds/unix/configure:
	cd build/freetype && ./autogen.sh

# host/build flags are used to enable cross-compiling
# (values must differ) but there should be some better way to achieve
# that: it probably isn't possible to build on x86 now.
build/freetype/dist/lib/libfreetype.so: build/freetype/builds/unix/configure
	cd build/freetype && \
	git reset --hard && \
	patch -p1 < ../freetype-asmjs.patch && \
	emconfigure ./configure \
		CFLAGS="-O3" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		\
		--without-zlib \
		--without-bzip2 \
		--without-png \
		--without-harfbuzz \
		&& \
	emmake make -j8 && \
	emmake make install

build/expat/dist/lib/libexpat.so:
	cd build/expat && \
	emconfigure ./configure \
		CFLAGS=-O3 \
		--prefix="$$(pwd)/dist" \
		&& \
	emmake make -j8 && \
	emmake make install

build/fontconfig/dist/lib/libfontconfig.so: build/freetype/dist/lib/libfreetype.so build/expat/dist/lib/libexpat.so
	cd build/fontconfig && \
	git reset --hard && \
	patch -p1 < ../fontconfig-speedscan.patch && \
	./autogen.sh && \
	EM_PKG_CONFIG_PATH=$(FONTCONFIG_PC_PATH) emconfigure ./configure \
		CFLAGS=-O3 \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-docs \
		&& \
	emmake make -j8 && \
	emmake make install

build/fribidi/configure:
	cd build/fribidi && ./bootstrap

build/fribidi/dist/lib/libfribidi.so: build/fribidi/configure
	cd build/fribidi && \
	git reset --hard && \
	patch -p1 < ../fribidi-make.patch && \
	touch configure.ac aclocal.m4 configure Makefile.am Makefile.in && \
	aclocal && autoconf && autoheader && automake --add-missing && \
	emconfigure ./configure \
		CFLAGS=-O3 \
		NM=llvm-nm \
		--prefix="$$(pwd)/dist" \
		--disable-dependency-tracking \
		--disable-debug \
		--without-glib \
		&& \
	emmake make -j8 && \
	emmake make install

build/libass/configure:
	cd build/libass && ./autogen.sh

build/libass/dist/lib/libass.so: build/libass/configure $(LIBASS_DEPS)
	cd build/libass && \
	EM_PKG_CONFIG_PATH=$(LIBASS_PC_PATH) emconfigure ./configure \
		CFLAGS="-O3" \
		--prefix="$$(pwd)/dist" \
		--disable-static \
		--disable-enca \
		--disable-harfbuzz \
		--disable-asm \
		--enable-fontconfig \
		&& \
	emmake make -j8 && \
	emmake make install
	
build/subtitles-octopus/configure: $(LIBASSJS_DEPS)
	cd build/subtitles-octopus && \
	autoreconf -fi && \
	EM_PKG_CONFIG_PATH=$(LIBASSJS_PC_PATH) emconfigure ./configure
	
build/subtitles-octopus/subtitles-octopus-worker.bc: build/subtitles-octopus/configure $(LIBASSJS_DEPS)
	cd build/subtitles-octopus && \
	emmake make -j8 && \
	mv subtitlesoctopus subtitles-octopus-worker.bc

EMCC_COMMON_ARGS = \
	-s TOTAL_MEMORY=134217728 \
	-O3 \
	-s EXPORTED_FUNCTIONS="['_main', '_malloc', '_libassjs_init', '_libassjs_quit', '_libassjs_resize', '_libassjs_render']" \
	-s NO_EXIT_RUNTIME=1 \
	--use-preload-plugins \
	--preload-file default.ttf \
	--preload-file fonts.conf \
	-s ALLOW_MEMORY_GROWTH=1 \
	-o $@
	#--js-opts 0 -g4 \
	#--closure 1 \
	#--memory-init-file 0 \
	#-s OUTLINING_LIMIT=20000 \

subtitles-octopus-sync.js: build/subtitles-octopus/subtitles-octopus-worker.bc
	emcc build/subtitles-octopus/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js build/subtitles-octopus/pre-sync.js \
		--post-js build/subtitles-octopus/post-sync.js \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem js/ & \
		cp build/subtitles-octopus/subtitles-octopus.js js/

subtitles-octopus-worker.js: build/subtitles-octopus/subtitles-octopus-worker.bc
	emcc build/subtitles-octopus/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js build/subtitles-octopus/pre-worker.js \
		--post-js build/subtitles-octopus/post-worker.js \
		-s WASM=1 \
		-s "BINARYEN_METHOD='native-wasm,asmjs'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* js/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/

# Compile libass and all its dependencies to JavaScript.
# You need emsdk environment installed and activated, see:
# <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

FONTCONFIG_PC_PATH = ../freetype/dist/lib/pkgconfig:../expat/expat/dist/lib/pkgconfig
LIBASS_PC_PATH = $(FONTCONFIG_PC_PATH):../fribidi/dist/lib/pkgconfig:../fontconfig/dist/lib/pkgconfig:../harfbuzz/dist/lib/pkgconfig
LIBASSJS_PC_PATH = $(LIBASS_PC_PATH):../libass/dist/lib/pkgconfig
	
LIBASS_DEPS = \
	build/fribidi/dist/lib/libfribidi.so \
	build/freetype/dist/lib/libfreetype.so \
	build/expat/expat/dist/lib/libexpat.so \
	build/harfbuzz/dist/lib/libharfbuzz.so \
	build/fontconfig/dist/lib/libfontconfig.so
LIBASSJS_DEPS = \
	$(LIBASS_DEPS) \
	build/libass/dist/lib/libass.so

all: libass
libass: subtitles-octopus-worker.js

clean: clean-js clean-freetype clean-fribidi clean-harfbuzz clean-fontconfig clean-expat clean-libass clean-octopus
clean-js:
	rm -f -- libass*
clean-freetype:
	-cd build/freetype && rm -rf dist && make clean
clean-fribidi:
	-cd build/fribidi && rm -rf dist && make clean
clean-fontconfig:
	-cd build/fontconfig && rm -rf dist && make clean
clean-expat:
	-cd build/expat/expat && rm -rf dist && make clean
clean-harfbuzz:
	-cd build/harfbuzz && rm -rf dist && make clean
clean-libass:
	-cd build/libass && rm -rf dist && make clean
clean-octopus:
	-cd build/subtitles-octopus && rm -f subtitles-octopus-worker.bc && make clean
	
server:
	python -m SimpleHTTPServer

git-update: git-freetype git-fribidi git-fontconfig git-expat git-harfbuzz git-libass

git-freetype:
	cd build/freetype && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

git-fribidi:
	cd build/fribidi && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-fontconfig:
	cd build/fontconfig && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-expat:
	cd build/expat && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-harfbuzz:
	cd build/harfbuzz && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-libass:
	cd build/libass && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
# host/build flags are used to enable cross-compiling
# (values must differ) but there should be some better way to achieve
# that: it probably isn't possible to build on x86 now.
build/freetype/dist/lib/libfreetype.so:
	cd build/freetype && \
	git reset --hard && \
	patch -p1 < ../freetype-speedup.patch && \
	NOCONFIGURE=1 ./autogen.sh && \
	emconfigure ./configure \
		CFLAGS="-O3" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		--enable-shared \
		\
		--without-zlib \
		--without-bzip2 \
		--without-png \
		--without-harfbuzz \
		&& \
	emmake make -j8 && \
	emmake make install

build/expat/expat/configure:
	cd build/expat/expat && ./buildconf.sh

build/expat/expat/dist/lib/libexpat.so: build/expat/expat/configure
	cd build/expat/expat && \
	emconfigure ./configure \
		CFLAGS=-O3 \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		--enable-shared \
		--disable-dependency-tracking \
		--without-docbook \
		--without-xmlwf \
		&& \
	emmake make -j8 && \
	emmake make install

build/fontconfig/dist/lib/libfontconfig.so: build/freetype/dist/lib/libfreetype.so build/expat/expat/dist/lib/libexpat.so
	cd build/fontconfig && \
	git reset --hard && \
	patch -p1 < ../fontconfig-fixbuild.patch && \
	patch -p1 < ../fontconfig-disablepthreads.patch && \
	patch -p1 < ../fontconfig-disable-uuid.patch && \
	autoreconf -fiv  && \
	EM_PKG_CONFIG_PATH=$(FONTCONFIG_PC_PATH) emconfigure ./configure \
		CFLAGS=-O3 \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		--enable-shared \
		--disable-docs \
		--with-default-fonts=/fonts \
		&& \
	emmake make -j8 && \
	emmake make install

build/harfbuzz/dist/lib/libharfbuzz.so: build/freetype/dist/lib/libfreetype.so build/fontconfig/dist/lib/libfontconfig.so
	cd build/harfbuzz && \
	git reset --hard && \
	patch -p1 < ../harfbuzz-disablepthreads.patch && \
	NOCONFIGURE=1 ./autogen.sh && \
	EM_PKG_CONFIG_PATH=$(LIBASS_PC_PATH) emconfigure ./configure \
		CFLAGS="-O3" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		--enable-shared \
		--disable-dependency-tracking \
		\
		--without-cairo \
		--with-fontconfig \
		--without-icu \
		--with-freetype \
		--without-glib \
		&& \
	emmake make -j8 && \
	emmake make install

build/fribidi/configure:
	cd build/fribidi && \
	git reset --hard && \
	patch -p1 < ../0001-Fix-Fribidi-Build.patch && \
	patch -p1 < ../fribidi-fixclang.patch && \
	NOCONFIGURE=1 ./autogen.sh

build/fribidi/dist/lib/libfribidi.so: build/fribidi/configure
	cd build/fribidi && \
	emconfigure ./configure \
		CFLAGS='-O3' \
		NM=llvm-nm \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-docs \
		--disable-static \
		--enable-shared \
		--disable-dependency-tracking \
		--disable-debug \
		--without-glib \
		--disable-pthreads \
		&& \
	emmake make -j8 && \
	emmake make install

build/libass/configure:
	cd build/libass && NOCONFIGURE=1 ./autogen.sh

# Use --enable-large-tiles to incrase speed?
build/libass/dist/lib/libass.so: build/libass/configure $(LIBASS_DEPS)
	cd build/libass && \
	EM_PKG_CONFIG_PATH=$(LIBASS_PC_PATH) emconfigure ./configure \
		CFLAGS='-O3' \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-static \
		--enable-shared \
		--enable-harfbuzz \
		--disable-asm \
		--enable-fontconfig \
		&& \
	emmake make -j8 && \
	emmake make install
	
build/subtitles-octopus/configure: $(LIBASSJS_DEPS)
	cd build/subtitles-octopus && \
	autoreconf -fi && \
	EM_PKG_CONFIG_PATH=$(LIBASSJS_PC_PATH) emconfigure ./configure --host=x86-none-linux --build=x86_64
	
build/subtitles-octopus/subtitles-octopus-worker.bc: build/subtitles-octopus/configure $(LIBASSJS_DEPS)
	cd build/subtitles-octopus && \
	emmake make -j8 && \
	mv subtitlesoctopus subtitles-octopus-worker.bc

EMCC_COMMON_ARGS = \
	-s TOTAL_MEMORY=134217728 \
	-O3 \
	-s EXPORTED_FUNCTIONS="['_main', '_malloc', '_libassjs_init', '_libassjs_quit', '_libassjs_resize', '_libassjs_render']" \
	-s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'FS_createPreloadedFile', 'FS_createFolder']" \
	-s NO_EXIT_RUNTIME=1 \
	--use-preload-plugins \
	--preload-file default.ttf \
	--preload-file fonts.conf \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s FORCE_FILESYSTEM=1 \
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
		cp subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem js/wasm/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/wasm/ && \
		cp subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem js/asmjs/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/asmjs/ && \
		mv subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem js/both/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/both/

subtitles-octopus-worker.js: build/subtitles-octopus/subtitles-octopus-worker.bc subtitles-octopus-sync.js
	emcc build/subtitles-octopus/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js build/subtitles-octopus/pre-worker.js \
		--post-js build/subtitles-octopus/post-worker.js \
		-s WASM=1 \
		-s "BINARYEN_METHOD='native-wasm'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* js/wasm/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/wasm/  && \
	emcc build/subtitles-octopus/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js build/subtitles-octopus/pre-worker.js \
		--post-js build/subtitles-octopus/post-worker.js \
		-s WASM=0 \
		-s "BINARYEN_METHOD='asmjs'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* js/asmjs/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/asmjs/ && \
	emcc build/subtitles-octopus/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js build/subtitles-octopus/pre-worker.js \
		--post-js build/subtitles-octopus/post-worker.js \
		-s WASM=1 \
		-s "BINARYEN_METHOD='native-wasm,asmjs'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* js/both/ && \
		cp build/subtitles-octopus/subtitles-octopus.js js/both/

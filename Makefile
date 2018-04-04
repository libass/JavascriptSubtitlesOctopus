# Compile libass and all its dependencies to JavaScript.
# You need emsdk environment installed and activated, see:
# <https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html>.

FONTCONFIG_PC_PATH = ../freetype/dist/lib/pkgconfig:../expat/expat/dist/lib/pkgconfig
LIBASS_PC_PATH = $(FONTCONFIG_PC_PATH):../fribidi/dist/lib/pkgconfig:../fontconfig/dist/lib/pkgconfig:../harfbuzz/dist/lib/pkgconfig

# For Octopus Build Task
LIBASSJS_PC_PATH = ../lib/freetype/dist/lib/pkgconfig:../lib/expat/expat/dist/lib/pkgconfig:../lib/fribidi/dist/lib/pkgconfig:../lib/fontconfig/dist/lib/pkgconfig:../lib/harfbuzz/dist/lib/pkgconfig:../lib/libass/dist/lib/pkgconfig
	
LIBASS_DEPS = \
	lib/fribidi/dist/lib/libfribidi.so \
	lib/freetype/dist/lib/libfreetype.so \
	lib/expat/expat/dist/lib/libexpat.so \
	lib/harfbuzz/dist/lib/libharfbuzz.so \
	lib/fontconfig/dist/lib/libfontconfig.so
LIBASSJS_DEPS = \
	$(LIBASS_DEPS) \
	lib/libass/dist/lib/libass.so

all: git-checkout libass
libass: subtitles-octopus-worker.js

clean: clean-js clean-freetype clean-fribidi clean-harfbuzz clean-fontconfig clean-expat clean-libass clean-octopus
clean-js:
	rm -f -- libass*
clean-freetype:
	cd lib/freetype && rm -rf dist && make clean
clean-fribidi:
	cd lib/fribidi && rm -rf dist && make clean
clean-fontconfig:
	cd lib/fontconfig && rm -rf dist && make clean
clean-expat:
	cd lib/expat/expat && rm -rf dist && make clean
clean-harfbuzz:
	cd lib/harfbuzz && rm -rf dist && make clean
clean-libass:
	cd lib/libass && rm -rf dist && make clean
clean-octopus:
	cd src && rm -f subtitles-octopus-worker.bc && make clean

server:
	# Use Node Http Server npm i -g http-server
	http-server

git-update: git-freetype git-fribidi git-fontconfig git-expat git-harfbuzz git-libass

git-freetype:
	cd lib/freetype && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

git-fribidi:
	cd lib/fribidi && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-fontconfig:
	cd lib/fontconfig && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-expat:
	cd lib/expat && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-harfbuzz:
	cd lib/harfbuzz && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master
	
git-libass:
	cd lib/libass && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

git-checkout:
	git submodule sync --recursive && \
	git submodule update --init --recursive
	
# host/build flags are used to enable cross-compiling
# (values must differ) but there should be some better way to achieve
# that: it probably isn't possible to build on x86 now.
lib/freetype/dist/lib/libfreetype.so:
	echo "Build Freetype ---------" && \
	cd lib/freetype && \
	git reset --hard && \
	patch -Np1 -i "../../build/patches/freetype-speedup.patch" && \
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

lib/expat/expat/configure:
	echo "Configure Expat ---------" && \
	cd lib/expat/expat && ./buildconf.sh

lib/expat/expat/dist/lib/libexpat.so: lib/expat/expat/configure
	echo "Build Expat ---------" && \
	cd lib/expat/expat && \
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

lib/fontconfig/dist/lib/libfontconfig.so: lib/freetype/dist/lib/libfreetype.so lib/expat/expat/dist/lib/libexpat.so
	echo "Build Fontconfig ---------" && \
	cd lib/fontconfig && \
	git reset --hard && \
	patch -Np1 -i "../../build/patches/fontconfig-fixbuild.patch" && \
	patch -Np1 -i "../../build/patches/fontconfig-disablepthreads.patch" && \
	patch -Np1 -i "../../build/patches/fontconfig-disable-uuid.patch" && \
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

lib/harfbuzz/dist/lib/libharfbuzz.so: lib/freetype/dist/lib/libfreetype.so lib/fontconfig/dist/lib/libfontconfig.so
	echo "Build Harfbuzz ---------" && \
	cd lib/harfbuzz && \
	git reset --hard && \
	patch -Np1 -i "../../build/patches/harfbuzz-disablepthreads.patch" && \
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

lib/fribidi/configure:
	echo "Configure Fribidi ---------" && \
	cd lib/fribidi && \
	git reset --hard && \
	patch -Np1 -i "../../build/patches/Fix-Fribidi-Build.patch" && \
	patch -Np1 -i "../../build/patches/fribidi-fixclang.patch" && \
	NOCONFIGURE=1 ./autogen.sh

lib/fribidi/dist/lib/libfribidi.so: lib/fribidi/configure
	echo "Build Fribidi ---------" && \
	cd lib/fribidi && \
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

lib/libass/configure:
	echo "Configure LibASS ---------" && \
	cd lib/libass && NOCONFIGURE=1 ./autogen.sh

lib/libass/dist/lib/libass.so: lib/libass/configure $(LIBASS_DEPS)
	echo "Build LibASS ---------" && \
	cd lib/libass && \
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
	
src/configure: $(LIBASSJS_DEPS)
	echo "Configure ---------" && \
	cd src && \
	autoreconf -fi && \
	EM_PKG_CONFIG_PATH=$(LIBASSJS_PC_PATH) emconfigure ./configure --host=x86-none-linux --build=x86_64
	
src/subtitles-octopus-worker.bc:src/configure $(LIBASSJS_DEPS)
	echo "Prebuild ---------" && \
	cd src && \
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

subtitles-octopus-sync.js: src/subtitles-octopus-worker.bc
	echo "Build Sync Version ---------" && \
	emcc src/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js src/pre-sync.js \
		--post-js src/post-sync.js \
		$(EMCC_COMMON_ARGS) && \
		cp subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem dist/wasm/ && \
		cp src/subtitles-octopus.js dist/wasm/ && \
		cp subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem dist/asmjs/ && \
		cp src/subtitles-octopus.js dist/asmjs/ && \
		mv subtitles-octopus-sync.data subtitles-octopus-sync.js subtitles-octopus-sync.js.mem dist/both/ && \
		cp src/subtitles-octopus.js dist/both/

subtitles-octopus-worker.js: src/subtitles-octopus-worker.bc subtitles-octopus-sync.js
	echo "Build Workers ---------" && \
	emcc src/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js src/pre-worker.js \
		--post-js src/post-worker.js \
		-s WASM=1 \
		-s "BINARYEN_METHOD='native-wasm'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* dist/wasm/ && \
		cp src/subtitles-octopus.js dist/wasm/  && \
	emcc src/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js src/pre-worker.js \
		--post-js src/post-worker.js \
		-s WASM=0 \
		-s "BINARYEN_METHOD='asmjs'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* dist/asmjs/ && \
		cp src/subtitles-octopus.js dist/asmjs/ && \
	emcc src/subtitles-octopus-worker.bc $(LIBASSJS_DEPS) \
		--pre-js src/pre-worker.js \
		--post-js src/post-worker.js \
		-s WASM=1 \
		-s "BINARYEN_METHOD='native-wasm,asmjs'" \
		-s "BINARYEN_TRAP_MODE='clamp'" \
		$(EMCC_COMMON_ARGS) && \
		mv subtitles-octopus-worker.* dist/both/ && \
		cp src/subtitles-octopus.js dist/both/

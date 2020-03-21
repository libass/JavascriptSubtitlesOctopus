# SubtitleOctopus.js - Makefile

# make - Build Dependencies and the SubtitleOctopus.js
BASE_DIR:=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))
DIST_DIR:=$(BASE_DIR)dist/libraries

all: subtitleoctopus

subtitleoctopus: dist

# Fribidi
lib/fribidi/configure:
	cd lib/fribidi && \
	git reset --hard && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/fribidi/*.patch), \
	patch -d "$(BASE_DIR)lib/fribidi" -Np1 -i $(file);) \
	NOCONFIGURE=1 ./autogen.sh

# NM=llvm-nm
dist/libraries/lib/libfribidi.a: lib/fribidi/configure
	cd lib/fribidi && \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		--prefix="$(DIST_DIR)" \
		--host=x86-none-linux \
		--build=x86_64 \
		--enable-static \
		--disable-shared \
		--disable-dependency-tracking \
		--disable-debug \
	&& \
	emmake make -j8 && \
	emmake make install

	
lib/expat/expat/configured:
	cd lib/expat/expat && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/expat/*.patch), \
	patch -d "$(BASE_DIR)lib/expat" -Np1 -i $(file);) \
	touch configured && mkdir build

dist/libraries/lib/libexpat.a: lib/expat/expat/configured
	cd lib/expat/expat/build && \
	emconfigure cmake \
		-DCMAKE_C_FLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		-DCMAKE_INSTALL_PREFIX=$(DIST_DIR) \
		-DEXPAT_BUILD_DOCS=off \
		-DEXPAT_SHARED_LIBS=off \
		-DEXPAT_BUILD_EXAMPLES=off \
		-DEXPAT_BUILD_FUZZERS=off \
		-DEXPAT_BUILD_TESTS=off \
		-DEXPAT_BUILD_TOOLS=off \
		.. \
	&& \
	emmake make -j8 && \
	emmake make install

lib/brotli/configured:
	cd lib/brotli && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/brotli/*.patch), \
	patch -d "$(BASE_DIR)lib/brotli" -Np1 -i $(file);) \
	touch configured && mkdir build

dist/libraries/lib/libbrotlidec.a: lib/brotli/configured
	cd lib/brotli/build && \
	emconfigure cmake \
		-DCMAKE_C_FLAGS=" \
		-O2 \
		" \
		-DCMAKE_INSTALL_PREFIX=$(DIST_DIR) \
		.. \
	&& \
	emmake make -j8 && \
	mkdir -p ../../../dist/libraries/lib/pkgconfig && \
	mv libbrotlidec.pc ../../../dist/libraries/lib/pkgconfig && \
	mv libbrotlicommon.pc ../../../dist/libraries/lib/pkgconfig && \
	mv libbrotlidec-static.a ../../../dist/libraries/lib/libbrotlidec.a && \
	mv libbrotlicommon-static.a ../../../dist/libraries/lib/libbrotlicommon.a && \
	cp -r ../c/include ../../../dist/libraries/

# Freetype without Harfbuzz
lib/freetype/build_hb/dist_hb/lib/libfreetype.a: dist/libraries/lib/libbrotlidec.a
	cd "lib/freetype" && \
	NOCONFIGURE=1 ./autogen.sh && \
	mkdir -p build_hb && \
	cd build_hb && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ../configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		--prefix="$$(pwd)/dist_hb" \
		--host=x86-none-linux \
		--build=x86_64 \
		--enable-static \
		--disable-shared \
		\
		--with-brotli=yes \
		--without-zlib \
		--without-bzip2 \
		--without-png \
		--without-harfbuzz \
	&& \
	emmake make -j8 && \
	emmake make install

# Harfbuzz
lib/harfbuzz/configure:
	cd lib/harfbuzz && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/harfbuzz/*.patch), \
	patch -d "$(BASE_DIR)lib/harfbuzz" -Np1 -i $(file);) \
	NOCONFIGURE=1 ./autogen.sh

dist/libraries/lib/libharfbuzz.a: lib/freetype/build_hb/dist_hb/lib/libfreetype.a lib/harfbuzz/configure
	cd lib/harfbuzz && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig:$(BASE_DIR)lib/freetype/build_hb/dist_hb/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		LDFLAGS="" \
		--prefix="$(DIST_DIR)" \
		--host=x86-none-linux \
		--build=x86_64 \
		--enable-static \
		--disable-shared \
		--disable-dependency-tracking \
		\
		--without-cairo \
		--without-fontconfig \
		--without-icu \
		--with-freetype \
		--without-glib \
	&& \
	emmake make -j8 && \
	emmake make install

# Freetype with Harfbuzz
dist/libraries/lib/libfreetype.a: dist/libraries/lib/libharfbuzz.a dist/libraries/lib/libbrotlidec.a
	cd "lib/freetype" && \
	git reset --hard && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/freetype/*.patch), \
	patch -d "$(BASE_DIR)lib/freetype" -Np1 -i $(file);) \
	NOCONFIGURE=1 ./autogen.sh && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		--prefix="$(DIST_DIR)" \
		--host=x86-none-linux \
		--build=x86_64 \
		--enable-static \
		--disable-shared \
		\
		--with-brotli=yes \
		--without-zlib \
		--without-bzip2 \
		--without-png \
		--with-harfbuzz \
	&& \
	emmake make -j8 && \
	emmake make install

# Fontconfig
lib/fontconfig/configure: 
	cd lib/fontconfig && \
	git reset --hard && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/fontconfig/*.patch), \
	patch -d "$(BASE_DIR)lib/fontconfig" -Np1 -i $(file);) \
	NOCONFIGURE=1 ./autogen.sh

dist/libraries/lib/libfontconfig.a: dist/libraries/lib/libharfbuzz.a dist/libraries/lib/libexpat.a dist/libraries/lib/libfribidi.a dist/libraries/lib/libfreetype.a lib/fontconfig/configure
	cd lib/fontconfig && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-DEMSCRIPTEN \
		-O2 \
		-s NO_EXIT_RUNTIME=1 \
		--llvm-lto 1 \
		-s STRICT=1 \
		-s MODULARIZE=1 \
		" \
		--prefix="$(DIST_DIR)" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-shared \
		--enable-static \
		--disable-docs \
		--with-default-fonts=/fonts \
	&& \
	emmake make -j8 && \
	emmake make install

# libass --

lib/libass/configure:
	cd lib/libass && \
	git reset --hard && \
	$(foreach file, \
	$(wildcard $(BASE_DIR)build/patches/libass/*.patch), \
	patch -d "$(BASE_DIR)lib/libass" -Np1 -i $(file);) \
	NOCONFIGURE=1 ./autogen.sh

dist/libraries/lib/libass.a: dist/libraries/lib/libfontconfig.a dist/libraries/lib/libharfbuzz.a dist/libraries/lib/libexpat.a dist/libraries/lib/libfribidi.a dist/libraries/lib/libfreetype.a dist/libraries/lib/libbrotlidec.a lib/libass/configure
	cd lib/libass && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-O2 \
		-s NO_EXIT_RUNTIME=1 \
		-s STRICT=1 \
		--llvm-lto 1 \
		-s MODULARIZE=1 \
		" \
		--prefix="$(DIST_DIR)" \
		--host=x86-none-linux \
		--build=x86_64 \
		--disable-shared \
		--enable-static \
		--disable-asm \
		\
		--enable-harfbuzz \
		--enable-fontconfig \
	&& \
	emmake make -j8 && \
	emmake make install

# SubtitleOctopus.js
OCTP_DEPS = \
	$(DIST_DIR)/lib/libfribidi.a \
	$(DIST_DIR)/lib/libbrotlicommon.a \
	$(DIST_DIR)/lib/libbrotlidec.a \
	$(DIST_DIR)/lib/libfreetype.a \
	$(DIST_DIR)/lib/libexpat.a \
	$(DIST_DIR)/lib/libharfbuzz.a \
	$(DIST_DIR)/lib/libfontconfig.a \
	$(DIST_DIR)/lib/libass.a

src/Makefile:
	cd src && \
	autoreconf -fi

src/subtitles-octopus-worker.bc: dist/libraries/lib/libass.a src/Makefile
	cd src && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure --host=x86-none-linux --build=x86_64 && \
	emmake make -j8 && \
	mv subtitlesoctopus subtitles-octopus-worker.bc

# Dist Files
EMCC_COMMON_ARGS = \
	-O2 \
	-s EXPORTED_FUNCTIONS="['_main', '_malloc', '_libassjs_init', '_libassjs_quit', '_libassjs_resize', '_libassjs_render', '_libassjs_free_track', '_libassjs_create_track']" \
	-s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'FS_createPreloadedFile', 'FS_createFolder']" \
	-s NO_EXIT_RUNTIME=1 \
	--use-preload-plugins \
	--preload-file default.woff2 \
	--preload-file fonts.conf \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s STRICT=1 \
	-s FORCE_FILESYSTEM=1 \
	--llvm-lto 1 \
	-g1 \
	-o $@
	#--js-opts 0 -g4 \
	#--closure 1 \
	#--memory-init-file 0 \
	#-s OUTLINING_LIMIT=20000 \

dist: src/subtitles-octopus-worker.bc dist/subtitles-octopus-worker.js dist/subtitles-octopus-worker-legacy.js dist/subtitles-octopus.js

dist/subtitles-octopus-worker.js: src/subtitles-octopus-worker.bc
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/pre-worker.js \
		--pre-js src/unbrotli.js \
		--post-js src/post-worker.js \
		-s WASM=1 \
		$(EMCC_COMMON_ARGS)

dist/subtitles-octopus-worker-legacy.js: src/subtitles-octopus-worker.bc
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/pre-worker.js \
		--pre-js src/unbrotli.js \
		--post-js src/post-worker.js \
		-s WASM=0 \
		-s LEGACY_VM_SUPPORT=1 \
		$(EMCC_COMMON_ARGS)

dist/subtitles-octopus.js:
	cp src/subtitles-octopus.js dist/

# Clean Tasks

clean: clean-dist clean-freetype clean-fribidi clean-harfbuzz clean-fontconfig clean-expat clean-libass clean-octopus clean-brotli

clean-dist:
	cd dist && rm -frv ./*
clean-freetype:
	cd lib/freetype && git clean -fdx
clean-fribidi:
	cd lib/fribidi && git clean -fdx
clean-fontconfig:
	cd lib/fontconfig && git clean -fdx
clean-expat:
	cd lib/expat/expat && git clean -fdx
clean-harfbuzz:
	cd lib/harfbuzz && git clean -fdx
clean-libass:
	cd lib/libass && git clean -fdx
clean-brotli:
	cd lib/brotli && git clean -fdx
clean-octopus:
	cd src && git clean -fdx

git-checkout:
	git submodule sync --recursive && \
	git submodule update --init --recursive

server: # Node http server npm i -g http-server
	http-server

git-update: git-freetype git-fribidi git-fontconfig git-expat git-harfbuzz git-libass git-brotli

git-brotli:
	cd lib/brotli && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

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

# SubtitleOctopus.js - Makefile

# make - Build Dependencies and the SubtitleOctopus.js
BASE_DIR:=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))
DIST_DIR:=$(BASE_DIR)dist/libraries

GLOBAL_CFLAGS:=-O3

all: subtitleoctopus

subtitleoctopus: dist

# Fribidi
build/lib/fribidi/configure: lib/fribidi
	rm -rf build/lib/fribidi
	mkdir -p build/lib
	cp -r lib/fribidi build/lib/fribidi
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/fribidi/*.patch), patch -d "$(BASE_DIR)build/lib/fribidi" -Np1 -i $(file) && ) true
	cd build/lib/fribidi && NOCONFIGURE=1 ./autogen.sh

$(DIST_DIR)/lib/libfribidi.a: build/lib/fribidi/configure
	cd build/lib/fribidi && \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-DFRIBIDI_ENTRY=extern \
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
	emmake make distdir && \
	cd lib && \
	emmake make install-libLTLIBRARIES install-pkgincludeHEADERS install-nodist_pkgincludeHEADERS && \
	cd .. && \
	emmake make install-pkgconfigDATA

build/lib/expat/configured: lib/expat
	mkdir -p build/lib/expat
	touch build/lib/expat/configured

$(DIST_DIR)/lib/libexpat.a: build/lib/expat/configured
	cd build/lib/expat && \
	emcmake cmake \
		-DCMAKE_C_FLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s MODULARIZE=1 \
		" \
		-DCMAKE_INSTALL_PREFIX=$(DIST_DIR) \
		-DEXPAT_BUILD_DOCS=off \
		-DEXPAT_SHARED_LIBS=off \
		-DEXPAT_BUILD_EXAMPLES=off \
		-DEXPAT_BUILD_FUZZERS=off \
		-DEXPAT_BUILD_TESTS=off \
		-DEXPAT_BUILD_TOOLS=off \
		$(BASE_DIR)lib/expat/expat \
	&& \
	emmake make -j8 && \
	emmake make install

build/lib/brotli/configured: lib/brotli
	mkdir -p build/lib/brotli
	touch build/lib/brotli/configured

build/lib/brotli/libbrotlidec.pc: build/lib/brotli/configured
	cd build/lib/brotli && \
	emcmake cmake \
		-DCMAKE_C_FLAGS=" \
		$(GLOBAL_CFLAGS) \
		" \
		-DCMAKE_INSTALL_PREFIX=$(DIST_DIR) \
		$(BASE_DIR)lib/brotli \
	&& \
	emmake make -j8 && \
	cp -r $(BASE_DIR)lib/brotli/c/include $(DIST_DIR)

$(DIST_DIR)/lib/libbrotlicommon.a: build/lib/brotli/libbrotlidec.pc
	cd build/lib/brotli && \
	mkdir -p $(DIST_DIR)/lib/pkgconfig && \
	cp libbrotlicommon.pc $(DIST_DIR)/lib/pkgconfig && \
	cp libbrotlicommon-static.a $(DIST_DIR)/lib/libbrotlicommon.a

$(DIST_DIR)/lib/libbrotlidec.a: build/lib/brotli/libbrotlidec.pc $(DIST_DIR)/lib/libbrotlicommon.a
	cd build/lib/brotli && \
	mkdir -p $(DIST_DIR)/lib/pkgconfig && \
	cp libbrotlidec.pc $(DIST_DIR)/lib/pkgconfig && \
	cp libbrotlidec-static.a $(DIST_DIR)/lib/libbrotlidec.a

# Freetype without Harfbuzz
build/lib/freetype/build_hb/dist_hb/lib/libfreetype.a: $(DIST_DIR)/lib/libbrotlidec.a
	rm -rf build/lib/freetype
	cp -r lib/freetype build/lib/freetype
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/freetype/*.patch), patch -d "$(BASE_DIR)build/lib/freetype" -Np1 -i $(file) && ) true
	cd build/lib/freetype && \
		NOCONFIGURE=1 ./autogen.sh && \
		mkdir -p build_hb && \
		cd build_hb && \
		EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
		emconfigure ../configure \
			CFLAGS=" \
			-s USE_PTHREADS=0 \
			$(GLOBAL_CFLAGS) \
			-s NO_FILESYSTEM=1 \
			-s NO_EXIT_RUNTIME=1 \
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
build/lib/harfbuzz/configure: lib/harfbuzz
	rm -rf build/lib/harfbuzz
	cp -r lib/harfbuzz build/lib/harfbuzz
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/harfbuzz/*.patch), patch -d "$(BASE_DIR)build/lib/harfbuzz" -Np1 -i $(file) && ) true
	cd build/lib/harfbuzz && NOCONFIGURE=1 ./autogen.sh

$(DIST_DIR)/lib/libharfbuzz.a: build/lib/freetype/build_hb/dist_hb/lib/libfreetype.a build/lib/harfbuzz/configure
	cd build/lib/harfbuzz && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig:$(BASE_DIR)build/lib/freetype/build_hb/dist_hb/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
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
	cd src && \
	emmake make -j8 install-libLTLIBRARIES install-pkgincludeHEADERS install-pkgconfigDATA

# Freetype with Harfbuzz
$(DIST_DIR)/lib/libfreetype.a: $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libbrotlidec.a
	cd build/lib/freetype && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_FILESYSTEM=1 \
		-s NO_EXIT_RUNTIME=1 \
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
build/lib/fontconfig/configure: lib/fontconfig
	rm -rf build/lib/fontconfig
	cp -r lib/fontconfig build/lib/fontconfig
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/fontconfig/*.patch), patch -d "$(BASE_DIR)build/lib/fontconfig" -Np1 -i $(file) && ) true
	cd build/lib/fontconfig && NOCONFIGURE=1 ./autogen.sh

$(DIST_DIR)/lib/libfontconfig.a: $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libexpat.a $(DIST_DIR)/lib/libfribidi.a $(DIST_DIR)/lib/libfreetype.a build/lib/fontconfig/configure
	cd build/lib/fontconfig && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		-DEMSCRIPTEN \
		$(GLOBAL_CFLAGS) \
		-s NO_EXIT_RUNTIME=1 \
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
	cd src && \
	emmake make distdir install-libLTLIBRARIES && \
	cd ../fontconfig && \
	emmake make distdir install-fontconfigincludeHEADERS && \
	cd ../ && \
	emmake make install-pkgconfigDATA

# libass --

build/lib/libass/configure: lib/libass
	rm -rf build/lib/libass
	cp -r lib/libass build/lib/libass
	cd build/lib/libass && NOCONFIGURE=1 ./autogen.sh

$(DIST_DIR)/lib/libass.a: $(DIST_DIR)/lib/libfontconfig.a $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libexpat.a $(DIST_DIR)/lib/libfribidi.a $(DIST_DIR)/lib/libfreetype.a $(DIST_DIR)/lib/libbrotlidec.a build/lib/libass/configure
	cd build/lib/libass && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure \
		CFLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_EXIT_RUNTIME=1 \
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

# Require a patch to fix some errors
src/SubOctpInterface.cpp: src/SubtitleOctopus.idl
	cd src && \
	python3 ../build/webidl_binder.py SubtitleOctopus.idl SubOctpInterface

src/Makefile: src/SubOctpInterface.cpp
	cd src && \
	autoreconf -fi && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ./configure --host=x86-none-linux --build=x86_64 CFLAGS="$(GLOBAL_CFLAGS)"

src/subtitles-octopus-worker.bc: $(OCTP_DEPS) src/Makefile src/SubtitleOctopus.cpp src/SubOctpInterface.cpp
	cd src && \
	emmake make -j8 && \
	mv subtitlesoctopus.bc subtitles-octopus-worker.bc

# Dist Files
EMCC_COMMON_ARGS = \
	$(GLOBAL_CFLAGS) \
	-s EXPORTED_FUNCTIONS="['_main', '_malloc']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'FS_createPreloadedFile', 'FS_createPath']" \
	-s NO_EXIT_RUNTIME=1 \
	--use-preload-plugins \
	--preload-file assets/default.woff2 \
	--preload-file assets/fonts.conf \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s NO_FILESYSTEM=0 \
	--no-heap-copy \
	-o $@
	#--js-opts 0 -g4 \
	#--closure 1 \
	#--memory-init-file 0 \
	#-s OUTLINING_LIMIT=20000 \

dist: src/subtitles-octopus-worker.bc dist/js/subtitles-octopus-worker.js dist/js/subtitles-octopus-worker-legacy.js dist/js/subtitles-octopus.js

dist/js/subtitles-octopus-worker.js: src/subtitles-octopus-worker.bc src/pre-worker.js src/unbrotli.js src/SubOctpInterface.js src/post-worker.js
	mkdir -p dist/js
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/pre-worker.js \
		--pre-js src/unbrotli.js \
		--post-js src/SubOctpInterface.js \
		--post-js src/post-worker.js \
		-s WASM=1 \
		$(EMCC_COMMON_ARGS)

dist/js/subtitles-octopus-worker-legacy.js: src/subtitles-octopus-worker.bc src/pre-worker.js src/unbrotli.js src/SubOctpInterface.js src/post-worker.js
	mkdir -p dist/js
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/pre-worker.js \
		--pre-js src/unbrotli.js \
		--post-js src/SubOctpInterface.js \
		--post-js src/post-worker.js \
		-s WASM=0 \
		-s LEGACY_VM_SUPPORT=1 \
		$(EMCC_COMMON_ARGS)

dist/js/subtitles-octopus.js: src/subtitles-octopus.js
	mkdir -p dist/js
	cp src/subtitles-octopus.js dist/js/

# Clean Tasks

clean: clean-dist clean-libs clean-octopus

clean-dist:
	cd dist && rm -frv ./libraries/* && rm -frv ./js/*
clean-libs:
	rm -frv dist/libraries build/lib
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

# SubtitleOctopus.js - Makefile

# make - Build Dependencies and the SubtitleOctopus.js
BASE_DIR:=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))
DIST_DIR:=$(BASE_DIR)dist/libraries

GLOBAL_CFLAGS:=-O3 -s ENVIRONMENT=web,webview

all: subtitleoctopus

subtitleoctopus: dist

include $(BASE_DIR)/build/m4/fribidi.mk
include $(BASE_DIR)/build/m4/expat.mk
include $(BASE_DIR)/build/m4/brotli.mk
include $(BASE_DIR)/build/m4/freetype.mk
include $(BASE_DIR)/build/m4/harfbuzz.mk
include $(BASE_DIR)/build/m4/fontconfig.mk
include $(BASE_DIR)/build/m4/libass.mk
include $(BASE_DIR)/build/m4/license_bundle.mk

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

dist: src/subtitles-octopus-worker.bc dist/js/subtitles-octopus-worker.js dist/js/subtitles-octopus-worker-legacy.js dist/js/subtitles-octopus.js dist/js/COPYRIGHT

dist/js/subtitles-octopus-worker.js: src/subtitles-octopus-worker.bc src/pre-worker.js src/SubOctpInterface.js src/post-worker.js build/lib/brotli/js/decode.js
	mkdir -p dist/js
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/pre-worker.js \
		--pre-js build/lib/brotli/js/decode.js \
		--post-js src/SubOctpInterface.js \
		--post-js src/post-worker.js \
		-s WASM=1 \
		$(EMCC_COMMON_ARGS)

dist/js/subtitles-octopus-worker-legacy.js: src/subtitles-octopus-worker.bc src/polyfill.js src/pre-worker.js src/SubOctpInterface.js src/post-worker.js build/lib/brotli/js/decode.js build/lib/brotli/js/polyfill.js
	mkdir -p dist/js
	emcc src/subtitles-octopus-worker.bc $(OCTP_DEPS) \
		--pre-js src/polyfill.js \
		--pre-js build/lib/brotli/js/polyfill.js \
		--pre-js src/pre-worker.js \
		--pre-js build/lib/brotli/js/decode.js \
		--post-js src/SubOctpInterface.js \
		--post-js src/post-worker.js \
		-s WASM=0 \
		-s LEGACY_VM_SUPPORT=1 \
		-s MIN_CHROME_VERSION=27 \
		-s MIN_SAFARI_VERSION=60005 \
		$(EMCC_COMMON_ARGS)

dist/js/subtitles-octopus.js: dist/license/all src/subtitles-octopus.js
	mkdir -p dist/js
	awk '1 {print "// "$$0}' dist/license/all | cat - src/subtitles-octopus.js > $@

# Clean Tasks

clean: clean-dist clean-libs clean-octopus

clean-dist:
	rm -frv dist/libraries/*
	rm -frv dist/js/*
	rm -frv dist/license/*
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

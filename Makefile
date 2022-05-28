# SubtitleOctopus.js - Makefile

# make - Build Dependencies and the SubtitleOctopus.js
BASE_DIR:=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))
DIST_DIR:=$(BASE_DIR)dist/libraries

GLOBAL_CFLAGS:=-O3 -s USE_PTHREADS=0
GLOBAL_LDFLAGS:=-s ENVIRONMENT=web,webview,worker -s NO_EXIT_RUNTIME=1
export LDFLAGS = $(GLOBAL_LDFLAGS)
export CFLAGS = $(GLOBAL_CFLAGS)
export CXXFLAGS = $(GLOBAL_CFLAGS)

export PKG_CONFIG_PATH = $(DIST_DIR)/lib/pkgconfig
export EM_PKG_CONFIG_PATH = $(PKG_CONFIG_PATH)

all: subtitleoctopus
subtitleoctopus: dist

.PHONY: all subtitleoctopus dist

include functions.mk

# Fribidi
build/lib/fribidi/configure: lib/fribidi $(wildcard $(BASE_DIR)build/patches/fribidi/*.patch)
	$(call PREPARE_SRC_PATCHED,fribidi)
	cd build/lib/fribidi && $(RECONF_AUTO)

$(DIST_DIR)/lib/libfribidi.a: build/lib/fribidi/configure
	cd build/lib/fribidi && \
	$(call CONFIGURE_AUTO) && \
	$(JSO_MAKE) -C lib/ fribidi-unicode-version.h && \
	$(JSO_MAKE) -C lib/ install && \
	$(JSO_MAKE) install-pkgconfigDATA

build/lib/expat/configured: lib/expat
	$(call PREPARE_SRC_VPATH,expat)
	touch build/lib/expat/configured

$(DIST_DIR)/lib/libexpat.a: build/lib/expat/configured
	cd build/lib/expat && \
	$(call CONFIGURE_CMAKE,$(BASE_DIR)lib/expat/expat) \
		-DEXPAT_BUILD_DOCS=off \
		-DEXPAT_SHARED_LIBS=off \
		-DEXPAT_BUILD_EXAMPLES=off \
		-DEXPAT_BUILD_FUZZERS=off \
		-DEXPAT_BUILD_TESTS=off \
		-DEXPAT_BUILD_TOOLS=off \
	&& \
	$(JSO_MAKE) && \
	$(JSO_MAKE) install

build/lib/brotli/js/decode.js: build/lib/brotli/configured
build/lib/brotli/js/polyfill.js: build/lib/brotli/configured
build/lib/brotli/configured: lib/brotli $(wildcard $(BASE_DIR)build/patches/brotli/*.patch)
	$(call PREPARE_SRC_PATCHED,brotli)
	touch build/lib/brotli/configured

$(DIST_DIR)/lib/libbrotlidec.a: $(DIST_DIR)/lib/libbrotlicommon.a
$(DIST_DIR)/lib/libbrotlicommon.a: build/lib/brotli/configured
	cd build/lib/brotli && \
    $(call CONFIGURE_CMAKE) && \
    $(JSO_MAKE) && \
	$(JSO_MAKE) install
	# Normalise static lib names
	cd $(DIST_DIR)/lib/ && \
	for lib in *-static.a ; do mv "$$lib" "$${lib%-static.a}.a" ; done


build/lib/freetype/configure: lib/freetype $(wildcard $(BASE_DIR)build/patches/freetype/*.patch)
	$(call PREPARE_SRC_PATCHED,freetype)
	cd build/lib/freetype && $(RECONF_AUTO)

# Freetype without Harfbuzz
build/lib/freetype/build_hb/dist_hb/lib/libfreetype.a: $(DIST_DIR)/lib/libbrotlidec.a build/lib/freetype/configure
	cd build/lib/freetype && \
		mkdir -p build_hb && \
		cd build_hb && \
		$(call CONFIGURE_AUTO,..) \
			--prefix="$$(pwd)/dist_hb" \
			--with-brotli=yes \
			--without-harfbuzz \
		&& \
		$(JSO_MAKE) && \
		$(JSO_MAKE) install

# Harfbuzz
build/lib/harfbuzz/configure: lib/harfbuzz $(wildcard $(BASE_DIR)build/patches/harfbuzz/*.patch)
	$(call PREPARE_SRC_PATCHED,harfbuzz)
	cd build/lib/harfbuzz && $(RECONF_AUTO)

$(DIST_DIR)/lib/libharfbuzz.a: build/lib/freetype/build_hb/dist_hb/lib/libfreetype.a build/lib/harfbuzz/configure
	cd build/lib/harfbuzz && \
	EM_PKG_CONFIG_PATH=$(PKG_CONFIG_PATH):$(BASE_DIR)build/lib/freetype/build_hb/dist_hb/lib/pkgconfig \
	CFLAGS="-DHB_NO_MT $(CFLAGS)" \
	CXXFLAGS="-DHB_NO_MT $(CFLAGS)" \
	$(call CONFIGURE_AUTO) \
		--with-freetype \
	&& \
	cd src && \
	$(JSO_MAKE) install-libLTLIBRARIES install-pkgincludeHEADERS install-pkgconfigDATA

# Freetype with Harfbuzz
$(DIST_DIR)/lib/libfreetype.a: $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libbrotlidec.a
	cd build/lib/freetype && \
	EM_PKG_CONFIG_PATH=$(PKG_CONFIG_PATH):$(BASE_DIR)build/lib/freetype/build_hb/dist_hb/lib/pkgconfig \
	$(call CONFIGURE_AUTO) \
		--with-brotli=yes \
		--with-harfbuzz \
	&& \
	$(JSO_MAKE) && \
	$(JSO_MAKE) install

# Fontconfig
build/lib/fontconfig/configure: lib/fontconfig $(wildcard $(BASE_DIR)build/patches/fontconfig/*.patch)
	$(call PREPARE_SRC_PATCHED,fontconfig)
	cd build/lib/fontconfig && $(RECONF_AUTO)

$(DIST_DIR)/lib/libfontconfig.a: $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libexpat.a $(DIST_DIR)/lib/libfribidi.a $(DIST_DIR)/lib/libfreetype.a build/lib/fontconfig/configure
	cd build/lib/fontconfig && \
	$(call CONFIGURE_AUTO) \
		--disable-docs \
		--with-default-fonts=/fonts \
	&& \
	$(JSO_MAKE) -C src/ install && \
	$(JSO_MAKE) -C fontconfig/ install && \
	$(JSO_MAKE) install-pkgconfigDATA

# libass --

build/lib/libass/configured: lib/libass
	cd lib/libass && $(RECONF_AUTO)
	$(call PREPARE_SRC_VPATH,libass)
	touch build/lib/libass/configured

$(DIST_DIR)/lib/libass.a: $(DIST_DIR)/lib/libfontconfig.a $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libexpat.a $(DIST_DIR)/lib/libfribidi.a $(DIST_DIR)/lib/libfreetype.a $(DIST_DIR)/lib/libbrotlidec.a build/lib/libass/configured
	cd build/lib/libass && \
	$(call CONFIGURE_AUTO,../../../lib/libass) \
		--disable-asm \
		--enable-fontconfig \
	&& \
	$(JSO_MAKE) && \
	$(JSO_MAKE) install

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

src/subtitles-octopus-worker.bc: $(OCTP_DEPS) all-src
.PHONY: all-src
all-src:
	$(MAKE) -C src all

# Dist Files
EMCC_COMMON_ARGS = \
	$(GLOBAL_LDFLAGS) \
	-s EXPORTED_FUNCTIONS="['_main', '_malloc']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'FS_createPreloadedFile', 'FS_createPath']" \
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

dist/license/all:
	@#FIXME: allow -j in toplevel Makefile and reintegrate licence extraction into this file
	make -j "$$(nproc)" -f Makefile_licence all

dist/js/COPYRIGHT: dist/license/all
	cp "$<" "$@"

# Clean Tasks

clean: clean-dist clean-libs clean-octopus

clean-dist:
	rm -frv dist/libraries/*
	rm -frv dist/js/*
	rm -frv dist/license/*
clean-libs:
	rm -frv dist/libraries build/lib
clean-octopus:
	cd src && git clean -fdX

git-checkout:
	git submodule sync --recursive && \
	git submodule update --init --recursive

SUBMODULES := brotli expat fontconfig freetype fribidi harfbuzz libass
git-smreset: $(addprefix git-, $(SUBMODULES))

$(foreach subm, $(SUBMODULES), $(eval $(call TR_GIT_SM_RESET,$(subm))))

server: # Node http server npm i -g http-server
	http-server

.PHONY: clean clean-dist clean-libs clean-octopus git-checkout git-smreset server

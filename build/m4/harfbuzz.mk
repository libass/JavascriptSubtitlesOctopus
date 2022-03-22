#
# Harfbuzz
#
HARFBUZZ_GIT_VERSION:=2.8.2

build/lib/harfbuzz/configure: lib/harfbuzz $(wildcard $(BASE_DIR)build/patches/harfbuzz/*.patch)
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
		-DHB_NO_MT \
		-s NO_EXIT_RUNTIME=1 \
		-s MODULARIZE=1 \
		" \
		CXXFLAGS=" \
		-s USE_PTHREADS=0 \
		$(GLOBAL_CFLAGS) \
		-s NO_FILESYSTEM=1 \
		-DHB_NO_MT \
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

git-harfbuzz:
	cd lib/harfbuzz && \
	git reset --hard && \
	git clean -dfx && \
	git fetch origin && \
	git checkout $(HARFBUZZ_GIT_VERSION) && \
	git submodule sync --recursive && \
	git submodule update --init --recursive

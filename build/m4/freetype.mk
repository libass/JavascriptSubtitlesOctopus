#
# Freetype
#
FREETYPE_GIT_VERSION:=VER-2-11-0

## Without Harfbuzz (Bootstrap)
build/lib/freetype/build_hb/dist_hb/lib/libfreetype.a: $(DIST_DIR)/lib/libbrotlidec.a $(wildcard $(BASE_DIR)build/patches/freetype/*.patch)
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

## With Harfbuzz
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

git-freetype:
	cd lib/freetype && \
	git reset --hard && \
	git clean -dfx && \
	git fetch origin && \
	git checkout $(FREETYPE_GIT_VERSION) && \
	git submodule sync --recursive && \
	git submodule update --init --recursive

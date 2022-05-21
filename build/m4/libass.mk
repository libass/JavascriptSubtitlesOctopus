#
# libass
#
LIBASS_GIT_VERSION:=643829edd8408ec37182a04040fe5a7bf54dccc3

build/lib/libass/configured: lib/libass
	rm -rf build/lib/libass
	cd lib/libass && NOCONFIGURE=1 ./autogen.sh
	mkdir -p build/lib/libass
	touch build/lib/libass/configured

$(DIST_DIR)/lib/libass.a: $(DIST_DIR)/lib/libfontconfig.a $(DIST_DIR)/lib/libharfbuzz.a $(DIST_DIR)/lib/libexpat.a $(DIST_DIR)/lib/libfribidi.a $(DIST_DIR)/lib/libfreetype.a $(DIST_DIR)/lib/libbrotlidec.a build/lib/libass/configured
	cd build/lib/libass && \
	EM_PKG_CONFIG_PATH=$(DIST_DIR)/lib/pkgconfig \
	emconfigure ../../../lib/libass/configure \
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

git-libass:
	cd lib/libass && \
	git reset --hard && \
	git clean -dfx && \
	git fetch origin && \
	git checkout $(LIBASS_GIT_VERSION) && \
	git submodule sync --recursive && \
	git submodule update --init --recursive

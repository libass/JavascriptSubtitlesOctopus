#
# Fontconfig
#
build/lib/fontconfig/configure: lib/fontconfig $(wildcard $(BASE_DIR)build/patches/fontconfig/*.patch)
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
	emmake make -C src/ install && \
	emmake make -C fontconfig/ install && \
	emmake make install-pkgconfigDATA

git-fontconfig:
	cd lib/fontconfig && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

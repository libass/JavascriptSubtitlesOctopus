#
# Fribidi
#
build/lib/fribidi/configure: lib/fribidi $(wildcard $(BASE_DIR)build/patches/fribidi/*.patch)
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
	emmake make -C lib/ install && \
	emmake make install-pkgconfigDATA

git-fribidi:
	cd lib/fribidi && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

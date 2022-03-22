#
# Brotli
#
build/lib/brotli/js/decode.js: build/lib/brotli/configured
build/lib/brotli/js/polyfill.js: build/lib/brotli/configured
build/lib/brotli/configured: lib/brotli $(wildcard $(BASE_DIR)build/patches/brotli/*.patch)
	rm -rf build/lib/brotli
	cp -r lib/brotli build/lib/brotli
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/brotli/*.patch), patch -d "$(BASE_DIR)build/lib/brotli" -Np1 -i $(file) && ) true
	touch build/lib/brotli/configured

build/lib/brotli/libbrotlidec.pc: build/lib/brotli/configured
	cd build/lib/brotli && \
	emcmake cmake \
		-DCMAKE_C_FLAGS=" \
		$(GLOBAL_CFLAGS) \
		" \
		-DCMAKE_INSTALL_PREFIX=$(DIST_DIR) \
		. \
	&& \
	emmake make -j8 && \
	cp -r ./c/include $(DIST_DIR)

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

git-brotli:
	cd lib/brotli && \
	git reset --hard && \
	git clean -dfx && \
	git pull origin master

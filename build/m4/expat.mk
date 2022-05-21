#
# Expat
#
EXPAT_GIT_VERSION:=R_2_4_1

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

git-expat:
	cd lib/expat && \
	git reset --hard && \
	git clean -dfx && \
	git fetch origin && \
	git checkout $(EXPAT_GIT_VERSION) && \
	git submodule sync --recursive && \
	git submodule update --init --recursive

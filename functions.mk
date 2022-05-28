# For inclusion in toplevel Makefile
#   Defines some useful macros and variables for building etc
#   If arguments are expected (macro) it needs to be invoked with $(call ...),
#   if no arguments are supported the definition is aregular avariable and can be used as such.
#   Special macros of the name TR_... create targets (and always take arguments)
#   and thus also need to be $(eval ...)'ed

## Build stuff

# @arg1: name of submodule
define PREPARE_SRC_PATCHED
	rm -rf build/lib/$(1)
	mkdir -p build/lib
	cp -r lib/$(1) build/lib/$(1)
	$(foreach file, $(wildcard $(BASE_DIR)build/patches/$(1)/*.patch), \
		patch -d "$(BASE_DIR)build/lib/$(1)" -Np1 -i $(file) && \
	) :
endef

# @arg1: name of submdolue
define PREPARE_SRC_VPATH
	rm -rf build/lib/$(1)
	mkdir -p build/lib/$(1)
	touch build/lib/$(1)/configured
endef

# All projects we build have autogen.sh, otherwise we could also fallback to `autoreconf -ivf .`
RECONF_AUTO := NOCONFIGURE=1 ./autogen.sh

# @arg1: path to source directory; defaults to current working directory
define CONFIGURE_AUTO
	emconfigure $(or $(1),.)/configure \
	  --prefix="$(DIST_DIR)" \
	  --host=x86-none-linux \
	  --build=x86_64 \
	  --enable-static \
	  --disable-shared \
	  --disable-debug
endef

# @arg1: path to source directory; defaults to current working directory
define CONFIGURE_CMAKE
	emcmake cmake -S "$(or $(1),.)" -DCMAKE_INSTALL_PREFIX="$(DIST_DIR)"
endef

# FIXME: Propagate jobserver info with $(MAKE) and set up our makefile for fully parallel builds
JSO_MAKE := emmake make -j "$(shell nproc)"

## Clean and git related

# @arg1: submodule name
define TR_GIT_SM_RESET
git-$(1):
	cd lib/$(1) && \
	git reset --hard && \
	git clean -dfx
	git submodule update --force lib/$(1)

.PHONY: git-$(1)
endef

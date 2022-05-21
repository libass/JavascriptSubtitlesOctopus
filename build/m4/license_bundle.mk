#
# License Bundle
#
LIB_LICENSES := brotli expat freetype fribidi fontconfig harfbuzz libass
LIB_LICENSES_FINDOPT_brotli   := -path ./research -prune -false -o ! -path ./js/decode.min.js
LIB_LICENSES_FINDOPT_expat    := -path ./expat/fuzz -prune -false -o
LIB_LICENSES_FINDOPT_freetype := -path ./src/tools -prune -false -o
LIB_LICENSES_FINDOPT_fribidi  := -path ./bin -prune -false -o
LIB_LICENSES_FINDOPT_harfbuzz := -path ./test -prune -false -o

$(addprefix dist/license/, $(LIB_LICENSES)): dist/license/%: .git/modules/lib/%/HEAD build/license_extract.sh build/license_defaults
	@mkdir -p dist/license
	(cd "lib/$*" && FINDOPTS="$(LIB_LICENSES_FINDOPT_$*)" \
	 ../../build/license_extract.sh ../../build/license_defaults "$*"  .) > $@

dist/license/subtitlesoctopus: .git/HEAD build/license_extract.sh
	@mkdir -p dist/license
	build/license_extract.sh build/license_defaults subtitlesoctopus src > dist/license/subtitlesoctopus

dist/license/all: dist/license/subtitlesoctopus $(addprefix dist/license/, $(LIB_LICENSES)) build/license_fullnotice build/license_lint.awk
	@echo "# The following lists all copyright notices and licenses for the" >  dist/license/all
	@echo "# work contained in JavascriptSubtitlesOctopus per project."      >> dist/license/all
	@echo "" >> dist/license/all

	@echo "Concatenate extracted license info..."
	@$(foreach LIB_PROJ, subtitlesoctopus $(LIB_LICENSES), \
		echo "# Project: $(LIB_PROJ)"  >> dist/license/all && \
		cat  dist/license/$(LIB_PROJ)  >> dist/license/all && \
	) :

	mv dist/license/all dist/license/all.tmp
	build/license_lint.awk dist/license/all.tmp build/license_fullnotice
	cat dist/license/all.tmp build/license_fullnotice > dist/license/all

dist/js/COPYRIGHT: dist/license/all
	cp "$<" "$@"

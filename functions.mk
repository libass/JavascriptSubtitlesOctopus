# For inclusion in toplevel Makefile
#   Defines some useful macros and variables for building etc
#   If arguments are expected (macro) it needs to be invoked with $(call ...),
#   if no arguments are supported the definition is aregular avariable and can be used as such.
#   Special macros of the name TR_... create targets (and always take arguments)
#   and thus also need to be $(eval ...)'ed


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

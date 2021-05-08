AC_INIT([subtitlesoctopus], [1.1])
AM_INIT_AUTOMAKE([-Wall -Werror foreign])
AC_CONFIG_FILES([Makefile])
AC_PROG_CXX

AC_HEADER_STDC
AC_HEADER_STDBOOL
AC_CHECK_HEADERS([stdint.h unistd.h iconv.h])

PKG_CHECK_MODULES([LIBASS], libass >= 0.9.1,[],[
	AC_MSG_WARN([libass not found via pkg-config])
	#LIBASS_LIBS="-lass"
])

pkg_requires="libass >= 0.9.1"

AC_SUBST([LIBASS_CXXFLAGS])
AC_SUBST([LIBASS_LIBS])

AC_OUTPUT

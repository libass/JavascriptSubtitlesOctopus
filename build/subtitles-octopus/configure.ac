AC_INIT([subtitlesoctopus], [1.1])
AM_INIT_AUTOMAKE([-Wall -Werror foreign])
AC_CONFIG_FILES([Makefile])
AC_PROG_CC

AC_HEADER_STDC
AC_HEADER_STDBOOL
AC_CHECK_HEADERS([stdint.h unistd.h iconv.h])

PKG_CHECK_MODULES([LIBASS], libass >= 0.9.1,[],[
	AC_MSG_WARN([libass not found via pkg-config])
	#LIBASS_LIBS="-lass"
])

#PKG_CHECK_MODULES([LIBPNG], libpng >= 1.2.0, [
#    CFLAGS="$CFLAGS $LIBPNG_CFLAGS"
#    AC_DEFINE(CONFIG_LIBPNG, 1, [found libpng via pkg-config])
#    libpng=true])

#pkg_requires="libass >= 0.9.1, libpng >= 1.2.0"
pkg_requires="libass >= 0.9.1"

#ac_cflags_save="$CFLAGS"
#ac_ldflags_save="$LDFLAGS"	

#PKG_CHECK_MODULES([LIBASS], libass >= 0.9.1, [
#    CFLAGS="$CFLAGS $LIBASS_CFLAGS"
#    CXXFLAGS="$CFLAGS $LIBASS_CFLAGS"
#    LIBS="$LIBS $LIBASS_LIBS"
#    ])
		
#CFLAGS="$CFLAGS $LIBASS_CFLAGS"
#LDFLAGS="$LDFLAGS $LIBASS_LIBS"

#AC_CHECK_LIB([ass], [ass_library_init], [libass_lib="yes"])
#AC_CHECK_HEADER([ass/ass.h], [libass_hdr="yes"])

#if test "$libass_lib" == yes -a "$libass_hdr" == yes
#then	libass=yes
#else	AC_MSG_FAILURE([libass requested but not found])
#fi

#CFLAGS="$ac_cflags_save"
#LDFLAGS="$ac_ldflags_save"

AC_SUBST([LIBASS_CFLAGS])
AC_SUBST([LIBASS_LIBS])

AC_OUTPUT
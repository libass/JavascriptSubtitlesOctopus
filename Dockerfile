FROM archimg/base-devel:latest
RUN pacman -Sy --noconfirm --needed emscripten llvm clang cmake git ragel make autoconf pkgconfig patch libtool itstool automake python2 zip python2-lxml python2-pip python2-html5lib python2-setuptools python2-chardet python2-virtualenv gperf
ENV EMSCRIPTEN="/usr/lib/emscripten"
ENV EMSCRIPTEN_FASTCOMP="/usr/lib/emscripten-fastcomp"
ENV PATH=$PATH:$EMSCRIPTEN
RUN emcc
WORKDIR /code
ENTRYPOINT ["make"]
CMD ["all"]
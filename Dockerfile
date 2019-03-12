FROM archlinux/base:latest
RUN pacman -Sy --noconfirm --needed base-devel emscripten llvm clang cmake git ragel make autoconf pkgconfig patch libtool itstool automake python2 zip python2-lxml python2-pip python2-html5lib python2-setuptools python2-chardet python2-virtualenv gperf
ENV EMSCRIPTEN="/usr/lib/emscripten"
ENV EMSCRIPTEN_FASTCOMP="/usr/lib/emscripten-fastcomp"
ENV PATH=$PATH:$EMSCRIPTEN
#ENV BINARYEN=/usr
#RUN /bin/bash -c "curl -SL https://aur.archlinux.org/cgit/aur.git/snapshot/binaryen.tar.gz | tar zx"
#RUN /bin/bash -c "cd binaryen && chmod 777 -R ./&& sudo -u nobody makepkg"
#RUN pacman -U --noconfirm binaryen/*.pkg.tar.xz
RUN emcc
WORKDIR /code
ENTRYPOINT ["make"]
CMD ["all"]
FROM debian:sid
RUN apt-get update && apt-get install -y \
        llvm \
        clang \
        cmake \
        git \
        ragel \
        build-essential \
        patch \
        libtool \
        itstool \
        pkg-config \
        python2 \
        zip \
        python-lxml \
        python-pip \
        python-html5lib \
        python-chardet \
        gettext \
        autopoint \
        gperf && \
    git clone https://github.com/emscripten-core/emsdk.git && \
    cd emsdk && \
    ./emsdk install latest && \
    ./emsdk activate latest
ENV PATH=$PATH:/emsdk:/emsdk/fastcomp/emscripten:/emsdk/node/12.9.1_64bit/bin
WORKDIR /code
CMD ["make"]

FROM debian:buster
RUN apt-get update && apt-get install -y --no-install-recommends \
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
        python3 \
        zip \
        python-lxml \
        python-pip \
        python-html5lib \
        python-chardet \
        gettext \
        autopoint \
        automake \
        autoconf \
        m4 \
        gperf && \
    rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/emscripten-core/emsdk.git && \
    cd emsdk && \
    ./emsdk install 1.39.6 && \
    ./emsdk activate 1.39.6

ENV PATH=$PATH:/emsdk:/emsdk/upstream/emscripten:/emsdk/node/12.9.1_64bit/bin
WORKDIR /code
CMD ["make"]

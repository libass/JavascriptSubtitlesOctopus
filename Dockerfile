FROM debian:buster
RUN echo "force-unsafe-io" > /etc/dpkg/dpkg.cfg.d/force-unsafe-io
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
        gperf \
        wget && \
    rm -rf /var/lib/apt/lists/*

RUN pip install ply

RUN git clone https://github.com/emscripten-core/emsdk.git && \
    cd emsdk && \
    ./emsdk install 1.39.11 && \
    ./emsdk activate 1.39.11

# Patch emscripten; needed until https://github.com/emscripten-core/emscripten/pull/10846 is merged and released
RUN wget https://raw.githubusercontent.com/emscripten-core/emscripten/d68250f1e6059168bd1f791921445527c7548e29/src/preamble.js -O /emsdk/upstream/emscripten/src/preamble.js && \
    wget https://raw.githubusercontent.com/emscripten-core/emscripten/d68250f1e6059168bd1f791921445527c7548e29/src/URIUtils.js -O /emsdk/upstream/emscripten/src/URIUtils.js

ENV PATH=$PATH:/emsdk:/emsdk/upstream/emscripten:/emsdk/node/12.9.1_64bit/bin
WORKDIR /code
CMD ["make"]

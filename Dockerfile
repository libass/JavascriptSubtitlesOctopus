FROM emscripten/emsdk:1.39.11
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
        gperf && \
    pip3 install ply && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /code
CMD ["make"]

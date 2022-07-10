FROM docker.io/emscripten/emsdk:3.1.15

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        ragel \
        patch \
        libtool \
        itstool \
        pkg-config \
        python3 \
        python3-ply \
        gettext \
        autopoint \
        automake \
        autoconf \
        m4 \
        gperf \
        licensecheck \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code
CMD ["make"]

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
    ./emsdk install 1.39.15 && \
    ./emsdk activate 1.39.15

ENV PATH=$PATH:/emsdk:/emsdk/upstream/emscripten:/emsdk/node/14.15.5_64bit/bin
WORKDIR /code

COPY . /code

#Fixes fribidi requiring a git repository as a submodule
RUN cd lib/fribidi/ && git init && git -c user.email="bogus@example.com" -c user.name="bogus" commit --allow-empty -m "bogus" && cd /code
#Fixes fontconfig requiring a git repository as a submodule
RUN cd lib/fontconfig/ && git init && git -c user.email="bogus@example.com" -c user.name="bogus" commit --allow-empty -m "bogus" && cd /code
#Fixes libass requiring a git repository as a submodule
RUN cd lib/libass/ && git init && git -c user.email="bogus@example.com" -c user.name="bogus" commit --allow-empty -m "bogus" && cd /code

CMD ["make"]

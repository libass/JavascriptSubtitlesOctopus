#! /bin/sh
set -e
cd "$(dirname "$0")"
docker build -t libass/javascriptsubtitlesoctopus .
docker run -it --rm -v "${PWD}":/code libass/javascriptsubtitlesoctopus:latest

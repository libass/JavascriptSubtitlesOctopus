#! /bin/bash
set -e
docker build -t libass/javascriptsubtitlesoctopus .
docker run -it --rm -v ${PWD}:/code libass/javascriptsubtitlesoctopus:latest

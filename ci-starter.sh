#!/bin/sh
echo Start build on CI
echo $cd
./emsdk-portable/emsdk activate latest
source ./emsdk-portable/emsdk_env.sh
make
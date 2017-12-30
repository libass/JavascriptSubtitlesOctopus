#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
./emsdk-portable/emsdk activate latest
source ./emsdk-portable/emsdk_env.sh
make
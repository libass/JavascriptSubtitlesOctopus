#! /bin/sh
set -e
cd "$(dirname "$0")"

. ./run-common.sh

if [ "$FAST" -eq 0 ] ; then
    docker build -t "$IMAGE" .
fi
if [ "$#" -eq 0 ] ; then
    docker run -it --rm -v "${PWD}":/code --name "$CONTAINER" "$IMAGE":latest
else
    docker run -it --rm -v "${PWD}":/code --name "$CONTAINER" "$IMAGE":latest "$@"
fi

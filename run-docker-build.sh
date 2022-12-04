#! /bin/sh
set -e
cd "$(dirname "$0")"

. ./run-common.sh

if [ "$FAST" -eq 0 ] ; then
    docker build -t "$IMAGE" .
fi
if [ "$#" -eq 0 ] ; then
    docker run --rm --env LC_ALL=C.UTF-8 -v "${PWD}":/code --name "$CONTAINER" "$IMAGE":latest
else
    docker run --rm --env LC_ALL=C.UTF-8 -v "${PWD}":/code --name "$CONTAINER" "$IMAGE":latest "$@"
fi

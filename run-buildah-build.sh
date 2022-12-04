#! /bin/sh
set -e
cd "$(dirname "$0")"

. ./run-common.sh

if [ "$#" -eq 0 ] ; then
    cmd="make"
else
    cmd=""
fi

if [ "$FAST" -eq 0 ] ; then
    buildah bud -t "$IMAGE" .
    buildah rm "$CONTAINER" >/dev/null 2>&1 || :
    buildah from --name "$CONTAINER" "$IMAGE":latest
fi
buildah run -t --env LC_ALL=C.UTF-8 -v "${PWD}":/code "$CONTAINER" $cmd "$@"

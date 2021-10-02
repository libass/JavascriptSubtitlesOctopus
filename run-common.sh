usage() {
    echo "$0 [-f] [-c con_name] [-i img_name] [commmand [command_args...]]"
    echo "  -f: Skip building the container and reuse existing (\"fast\")"
    echo "  -c: Name of the container to create/use;"
    echo "      defaults to libass_javascriptsubtitlesoctopus-build"
    echo "  -i: Name of the image to buld/use;"
    echo "      defaults to libass/javascriptsubtitlesoctopus-build"
    echo "If no command is given `make` without arguments will be executed"
    exit 2
}

OPTIND=1
CONTAINER="libass_javascriptsubtitlesoctopus-build"
IMAGE="libass/javascriptsubtitlesoctopus-build"
FAST=0
while getopts "fc:s:" opt ; do
    case "$opt" in
        f) FAST=1 ;;
        c) CONTAINER="$OPTARG" ;;
        i) IMAGE="$OPTARG" ;;
        *) usage ;;
    esac
done

if [ "$OPTIND" -gt 1 ] ; then
    shift $(( OPTIND - 1 ))
fi

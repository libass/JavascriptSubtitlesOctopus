#!/bin/sh

# Copyright 2021 Oneric
# SPDX-License-Identifier: ISC

# Postprocesses the output of licensecheck to automatically
# generate our distribution notice.
# licensecheck is packaged in Debian and its derivatives
# and can be obtained from CPAN everywhere.

usage() {
    echo "$0 <map file> <project name> <dir>" >&2
    exit 1
}

set -eu

FINDOPTS="${FINDOPTS:-}"
tabulator="$(printf '\t')"

if [ "$#" -ne 3 ] || [ ! -e "$3" ] \
        || [ ! -e "$1" ] || [ -d "$1" ] ; then
    usage
fi

def_license="$(awk 'BEGIN{FS="\t+"} /^'"$2"'/ {print $2" | "$3}' "$1")"
def_copy="${def_license#* | }"
def_license="${def_license%% | *}"
base_dir="$3"

if [ -z "$def_license" ] || [ "$def_license" = "$def_copy" ] ; then
    echo "The map file appears to be borked or entry is missing!" >&2
    exit 1
fi

if command -v licensecheck >/dev/null ; then
    :
else
    echo "Could not find licensecheck!" >&2
    exit 2
fi


FIFO="$base_dir"/__LICENSE_EXTRACT_QUEUE.tmp
mkfifo "$FIFO"
# We want to be able to clean up the named pipe on error
# and will check the exit codes ourselves
set +e

find "$base_dir" $FINDOPTS -type f -regextype egrep -regex '.*\.(c|h|cpp|hpp|js)$' -print0 \
    | xargs -0 -P1 licensecheck --machine --copyright --deb-fmt --encoding UTF-8 > "$FIFO"\
	& scan_pid="$!"
awk -F"$tabulator" -v base_dir="$base_dir" \
        -v def_license="$def_license" -v def_copy="$def_copy" '
            BEGIN {
                split("", lcfiles)     # Clear array with only pre-Issue 8 POSIX
                SUBSEP = sprintf("\n") # Seperator for pseudo-multidim arrays

                # Add default
                if(def_copy && def_license)
                    ++lcfiles[def_license, def_copy]
            }

            1 {
                if ($2 == "UNKNOWN")
                    if (def_license) {
                        $2 = def_license
                    }else {
                        print "ERROR: Unlicensed file "$1" matched!" | "cat>&2"
                        print "             If there is no default license, then" | "cat>&2"
                        print "             reporting this upstream might be a good idea." | "cat>&2"
                        exit 1
                    }
                if ($3 == "*No copyright*") {
                    if (def_copy) {
                        $3 = def_copy
                    } else if (def_license != $2) {
                        print "ERROR: Orphaned file "$1" and no default attribution!" | "cat>&2"
                        exit 1
                    } else {
                        # Appears eg in freetype ; hope default copyright holder is correct
                        next
                    }
                }

                split($3, copyh, " / ")
                for(i in copyh)
                    ++lcfiles[$2, copyh[i]];
            }

            END {
                # Group copyright holders per license
                # The second pass in END is required to only add each (license, copy) pair once
                # using pure POSIX-only awk.
                split("", tmp)
                for(lc in lcfiles) {
                    split(lc, lico, SUBSEP)
                    if(lico[1] in tmp)
                        tmp[lico[1]] = tmp[lico[1]]""SUBSEP"  "lico[2]
                    else
                        tmp[lico[1]] = lico[2]
                }

                for(license in tmp) {
                    printf "License: %s\n", license
                    printf "Copyright: %s\n", tmp[license]
                    printf "\n"
                }
            }
        ' \
	< "$FIFO"
fret="$?"
wait "$scan_pid"
sret="$?"
rm "$FIFO"
exit "$((fret | sret))"

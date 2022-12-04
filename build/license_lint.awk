#!/usr/bin/awk -f

# Copyright 2021 Oneric
# SPDX-License-Identifier: ISC

# Check that we have the full text of all licenses
# being used in the JSO and subprojects
#
# Usage: license_lint.awk <license info files ...> <fulltext file>

function canonicalise_name(l)
{
    sub(/\++$/, "", l)
    sub(/(.0)+$/, "", l)
    return l
}

BEGIN {
    FS = ": | and/or "
    split("", licenses)
    fulltext = 0
    errors = 0
}

FNR == 1 && FILENAME == ARGV[ARGC-1] {
    fulltext = 1
}


!fulltext && /^License: / {
    for(i=2; i<=NF; ++i) {
        l = canonicalise_name($2)
        ++licenses[l]
    }
}

fulltext && /^License: / {
    for(i=2; i<=NF; ++i) {
        l = canonicalise_name($2)
        if(!(l in licenses)) {
            print "Superfluous full text for '"l"'!" | "cat>&2"
            ++errors
        } else {
            delete licenses[l]
        }
    }
}

END {
    for (l in licenses) {
        if(l == "public-domain" || l == "Unlicense")
          continue # No notice required
        print "Missing full text for '"l"'!" | "cat>&2"
        ++errors
    }

    if (errors) {
        exit 1
    }
}

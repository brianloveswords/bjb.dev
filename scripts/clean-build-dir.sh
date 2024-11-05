#!/usr/bin/env bash

set -eu

# removes the build directory.
#
# the whole reason this is a script is to make it safer because I don't trust rimraffing
# in Makefiles, they are too loosey goosey when variables are missing.

function main() {
    rm -rf -- ${BUILD_DIR}
}

main

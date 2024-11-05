#!/usr/bin/env bash

set -euo pipefail

# syncs the contents of the BUILD_DIR to the SITE bucket
#
# required arguments:
#   - BUILD_DIR: directory to sync to the bucket
#   - SITE: the bucket to sync to

function main() {
    EXTRA_ARGS=""

    if [ -n "${SYNC_DRY_RUN:-}" ]; then
        EXTRA_ARGS="-n"
    fi


    gsutil -m rsync -d -c -r ${EXTRA_ARGS} ${BUILD_DIR} gs://${SITE}
}

main

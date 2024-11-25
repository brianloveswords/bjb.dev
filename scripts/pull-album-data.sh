#!/usr/bin/env bash

set -euo pipefail

FILE="bsky-bc/album-data.js"

function main {
    gsutil cp "gs://${SITE}/${FILE}" "public/${FILE}"

}

main "$@"

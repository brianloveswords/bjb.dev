#!/usr/bin/env bash

set -euo pipefail

function main() {
    # this syntax for setting a default value if the variable is not set
    # is absolutely ridiculous.
    : ${READY_TO_PURGE_CACHE:="false"}

    if [[ "${READY_TO_PURGE_CACHE}" == "true" ]]; then
        purge_cache
    else
        setup
    fi
}

function setup() {
    echo "cloudflare-purge-cache: setting up environment variables"
    export CLOUDFLARE_API_TOKEN="op://private/cloudflare/api token"
    export CLOUDFLARE_ZONE="op://private/cloudflare/zone"
    export READY_TO_PURGE_CACHE=true

    op run -- ${0}
}

function purge_cache() {
    echo "cloudflare-purge-cache: firing the lasers"
    curl -X POST --silent \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
}

main

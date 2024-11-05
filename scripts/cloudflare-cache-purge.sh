#!/usr/bin/env bash

set -euo pipefail

function main() {
    CLOUDFLARE_API_TOKEN=$(op read "op://private/Cloudflare/api token")
    CLOUDFLARE_ZONE=$(op read "op://private/Cloudflare/zone")

    curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    	-H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
}

main

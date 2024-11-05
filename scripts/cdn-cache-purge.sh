#!/usr/bin/env bash

set -euo pipefail

# purges the CDN cache
#
# requires:
#   - CLOUDFLARE_API_TOKEN
#   - CLOUDFLARE_ZONE

function main() {
    echo "cloudflare-purge-cache: firing the lasers"
    curl -X POST --silent \
        "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
}

main

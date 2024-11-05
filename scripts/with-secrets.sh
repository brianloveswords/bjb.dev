#!/usr/bin/env bash

set -euo pipefail

function main() {
    if [ -f "./.env" ]; then
        echo using .env file
        op run --env-file "./.env" -- make "$@"
    else
        op run -- make "$@"
    fi
}

main "$@"

#!/usr/bin/env bash

set -euo pipefail

function setup() {
    TMPDIR="$(mktemp -d)"
    trap cleanup EXIT

    CREDENTIALS_FILE="${TMPDIR}/gcp-credentials.json"

    op document get "GCP Credentials" >"${CREDENTIALS_FILE}"
}

function cleanup() {
    echo "cleaning up"
    rm -rf -- "${TMPDIR}"
}

function main() {
    setup

    gcloud auth activate-service-account \
        --key-file ${CREDENTIALS_FILE} \
        --project ${PROJECT}
}

main

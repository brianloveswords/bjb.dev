#!/usr/bin/env bash

set -euo pipefail

# activates the cloud provider service account
#
# required:
#   - GCP_CREDS: the JSON blob for the service account
#   - CLOUD_PROJECT: the GCP project ID

function main() {
    echo "${GCP_CREDS}" | \
        gcloud auth activate-service-account \
            --key-file - \
            --project "${CLOUD_PROJECT}"
}

main

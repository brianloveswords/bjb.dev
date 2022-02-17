SITE := bjb.dev
PROJECT := brianloveswords
CLOUDFLARE_API_TOKEN := $(shell cat .private/cloudflare-api-token.txt)
CLOUDFLARE_ZONE := $(shell cat .private/cloudflare-zone.txt)
GOOGLE_APPLICATION_CREDENTIALS := ${PWD}/.private/credentials.json
BUILD_DIR := dist

export GOOGLE_APPLICATION_CREDENTIALS

update-remote : clean build push cache-purge

package-lock.json : package.json
	@npm install

node_modules : package-lock.json
	@touch node_modules

build : node_modules
	@npm run build
.PHONY: build

auth :
	@gcloud auth activate-service-account --key-file ${GOOGLE_APPLICATION_CREDENTIALS} --project ${PROJECT}

push : NODE_ENV=production
push : build auth cache-purge
	@gsutil -m rsync -d -r ${BUILD_DIR} gs://${SITE}

push-dry-run : auth build
	@gsutil rsync -d -r -n ${BUILD_DIR} gs://${SITE}

cache-purge :
	@curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/purge_cache" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
	 -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'

clean :
	@rm -rf dist



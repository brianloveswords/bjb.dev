SITE := bjb.dev
PROJECT := brianloveswords
BUILD_DIR := dist

update-remote : clean build push cache-purge


package-lock.json : package.json
	@npm install


node_modules : package-lock.json
	@touch node_modules


build : node_modules
	@npm run build
.PHONY: build


auth :
	@scripts/activate-service-account.sh

push : NODE_ENV=production
push : auth build
	@gsutil -m rsync -d -c -r ${BUILD_DIR} gs://${SITE}


push-dry-run : auth build
	@gsutil -m rsync -d -c -r -n ${BUILD_DIR} gs://${SITE}


cache-purge :
	@scripts/cloudflare-cache-purge.sh

publish : push cache-purge


clean :
	@rm -rf dist

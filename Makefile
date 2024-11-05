## site configuration
export SITE = bjb.dev
export CLOUD_PROJECT := brianloveswords

## 🔑 secrets 🔑
export GCP_CREDS := op://private/google-cloud/service-account.json
export CLOUDFLARE_ZONE := op://gha/cloudflare/zone
export CLOUDFLARE_API_TOKEN := op://gha/cloudflare/api token

## defined by Astro, unlikely to change
export BUILD_DIR = dist


default : local/clean publish

##
## real files
##

package-lock.json : package.json
	@npm install


node_modules : package-lock.json
	@touch node_modules

##
## tasks
##

# publish the site to the internet
publish : cloud/sync cdn/cache/purge


# run the development server
local/dev : node_modules
	@npm run dev


# build the site
local/build : node_modules
	@npm run build


# clean the build directory
local/clean :
	@scripts/clean-build-dir.sh


# authenticates with gcloud
cloud/auth :
	@op run -- scripts/activate-service-account.sh


# synchronizes the local build with the cloud storage bucket
cloud/sync : NODE_ENV=production
cloud/sync : cloud/auth local/build
	@scripts/storage-sync.sh



# dry run of the sync, show what files would change
cloud/sync/dry-run : SYNC_DRY_RUN=true
cloud/sync/dry-run : cloud/auth local/build
	@scripts/storage-sync.sh


# purges the CDN cache
cdn/cache/purge :
	@op run -- scripts/cdn-cache-purge.sh

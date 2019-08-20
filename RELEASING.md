# Releasing

```sh
$ npm run prepare-new-release
# Edit the file new-release.
# It will be prepended to CHANGELOG.md
# So make sure the style is consistent.
$ vim new-release
SKYGEAR_VERSION=<new-version> KEY_ID=<gpg-key-id> GITHUB_TOKEN=<github-token> GIT_BRANCH=next ./scripts/release.sh
```

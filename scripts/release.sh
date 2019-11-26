#!/bin/bash

set -eux

if [ -z "$GIT_BRANCH" ]; then
  >&2 echo "GIT_BRANCH is required."
  exit 1
fi

if [ -z "$SKYGEAR_VERSION" ]; then
  >&2 echo "SKYGEAR_VERSION is required."
  exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
  >&2 echo "GITHUB_TOKEN is required."
  exit 1
fi

if [ -e "new-release" ]; then
  echo "Making github release and release commit..."
else
  >&2 echo "file 'new-release' is required."
  exit 1
fi

if [[ "$SKYGEAR_VERSION" =~ "alpha" ]]; then
    NPM_PUBLISH_FLAG="--tag alpha"

    # No tag means 'latest' tag, remove this line after releasing public version
    NPM_PUBLISH_FLAG=""
else
    NPM_PUBLISH_FLAG=""
fi

npm run clean
npm --no-git-tag-version version "$SKYGEAR_VERSION"

touch NEWCHANGELOG && cat new-release > NEWCHANGELOG && echo "" >> NEWCHANGELOG && cat CHANGELOG.md >> NEWCHANGELOG && mv NEWCHANGELOG CHANGELOG.md
git add CHANGELOG.md package.json package-lock.json
git commit -m "Update CHANGELOG for v$SKYGEAR_VERSION"
git tag -a v"$SKYGEAR_VERSION" -s -m "Release v$SKYGEAR_VERSION"
git push git@github.com:SkygearIO/skycli.git "$GIT_BRANCH"
git push git@github.com:SkygearIO/skycli.git v"$SKYGEAR_VERSION"

github-release release -u skygeario -r skycli --draft --tag v"$SKYGEAR_VERSION" --name v"$SKYGEAR_VERSION" --description "$(cat new-release)"
rm new-release

npm publish $NPM_PUBLISH_FLAG --access public

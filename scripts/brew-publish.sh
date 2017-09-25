#!/bin/sh

TARBALL=$(npm info skycli dist.tarball)
SHASUM=$(curl $TARBALL | shasum -a 256 |cut -d' ' -f1)
VERSION=$(npm info skycli version)
FORMULA=skygeario/tap/skycli

brew bump-formula-pr --version=$VERSION --url=$TARBALL --sha256=$SHASUM $FORMULA

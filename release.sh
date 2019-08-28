#!/bin/bash

set -ex

VERSION=$(cat version)

sed -i "" -e "s/export const SDK_VERSION = \"[[:digit:]]*\.[[:digit:]]*\.[[:digit:]]*\(-beta[[:digit:]]\)*\";/export const SDK_VERSION = \"$VERSION\";/g" src/BerbixVerify.jsx
sed -i "" -e "s/  \"version\": \"[[:digit:]]*\.[[:digit:]]*\.[[:digit:]]*\(-beta[[:digit:]]\)*\",/  \"version\": \"$VERSION\",/g" package.json

git add package.json src/*.jsx version
git commit -m "Updating Berbix React Native SDK version to $VERSION"
git tag -a $VERSION -m "Version $VERSION"
git push --follow-tags

npm run webpack
npm publish

#!/usr/bin/env bash
set -o errexit
set -o pipefail

if [[ -z "$1" ]]; then
    echo "Usage: $0 <increment>"
    bun pm version | tail -n +3
    exit 1
fi

cd config/aur
git pull

cd ../..
GIT_TAG=$(bun pm version $1)
bun build --production --outdir=dist --target=bun src/bin/*
bun pm pack --filename config/aur/package.tgz

cd config/aur

PKGVER="${GIT_TAG#v}"; PKGVER="${PKGVER//-/.}"
sed -i "/^pkgver=/c\pkgver=${PKGVER}" PKGBUILD

SHA256=$(sha256sum package.tgz | awk '{print $1}')
sed -i "/^sha256sums=/c\sha256sums=('$SHA256')" PKGBUILD

echo "Updated PKGBUILD: "
grep -E '^(pkgver|sha256sums)=' PKGBUILD

makepkg --printsrcinfo > .SRCINFO
git add PKGBUILD .SRCINFO package.tgz
git commit -m "Release $PKGVER"
git push

cd ../..
git add config/aur/PKGBUILD
git commit --amend

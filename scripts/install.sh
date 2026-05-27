#!/usr/bin/env bash
set -o errexit
set -o pipefail


bun build --production --outdir=dist --target=bun src/bin/*
bun pm pack --filename config/aur/package.tgz
echo


cd config/aur

SHA256=$(sha256sum package.tgz | awk '{print $1}')
sed -i "/^sha256sums=/c\sha256sums=('$SHA256')" PKGBUILD

makepkg --printsrcinfo > .SRCINFO
makepkg -si
